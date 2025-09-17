import claudeService from '../services/claudeService.js';
import promptService from '../services/promptService.js';
import Conversation from '../models/Conversation.js';
import { asyncHandler, sendSuccess, AppError } from '../utils/response.js';
import logger from '../utils/logger.js';

export const completeChat = asyncHandler(async (req, res) => {
  const { templateId, userPrompt, temperature, maxTokens } = req.validatedData;
  const userId = req.userId;

  // Log inicial del procesamiento
  logger.info('Iniciando chat completion', { 
    templateId, 
    userId, 
    userPromptLength: userPrompt.length 
  });

  try {
    // Obtiene plantilla y verifica permisos del usuario
    const template = await promptService.getTemplateById(templateId, userId);

    // Validación básica y sanitización de seguridad
    const sanitizedUserPrompt = promptService.validateUserInput(userPrompt);
    promptService.sanitizePrompt(sanitizedUserPrompt);

    // Combina plantilla del sistema con prompt del usuario
    const promptCombination = promptService.combinePrompts(
      template, 
      sanitizedUserPrompt,
      {
        maxResponseLength: maxTokens > 1000 ? 800 : 500,
        responseStyle: 'conciso y directo',
        language: 'español'
      }
    );

    // Generar respuesta con Claude
    const claudeResponse = await claudeService.generateResponse(
      promptCombination.combinedPrompt,
      {
        maxTokens,
        temperature,
        systemMessage: promptCombination.systemMessage
      }
    );

    // Crear registro de conversación
    const conversation = new Conversation({
      userId,
      templateId,
      title: sanitizedUserPrompt.substring(0, 100) + '...', // Título descriptivo
      claudeModel: claudeResponse.metadata.model,
      messages: [
        {
          role: 'user',
          content: sanitizedUserPrompt,
          tokenCount: claudeResponse.usage.inputTokens
        },
        {
          role: 'assistant',
          content: claudeResponse.response,
          tokenCount: claudeResponse.usage.outputTokens
        }
      ],
      totalTokens: claudeResponse.usage.totalTokens,
      metadata: {
        userPrompt: sanitizedUserPrompt,
        combinedPrompt: promptCombination.combinedPrompt,
        responseTime: claudeResponse.metadata.responseTime,
        temperature,
        maxTokens
      }
    });

    await conversation.save();

    // Incrementa contador de uso para analytics de plantillas
    await promptService.incrementUsageCount(templateId);

    logger.info('Chat completion exitoso', {
      conversationId: conversation._id,
      responseTime: claudeResponse.metadata.responseTime,
      totalTokens: claudeResponse.usage.totalTokens,
      templateId,
      userId
    });

    // Respuesta al cliente
    sendSuccess(res, 'Respuesta generada exitosamente', {
      response: claudeResponse.response,
      conversationId: conversation._id,
      tokenUsage: {
        input: claudeResponse.usage.inputTokens,
        output: claudeResponse.usage.outputTokens,
        total: claudeResponse.usage.totalTokens
      },
      metadata: {
        model: claudeResponse.metadata.model,
        responseTime: claudeResponse.metadata.responseTime,
        temperature,
        maxTokens,
        template: template.name
      }
    });

  } catch (error) {
    // Logging detallado de errores para debugging
    logger.error('Error en chat completion', {
      error: error.message,
      templateId,
      userId,
      userPromptLength: userPrompt?.length
    });

    // Re-throw para manejo centralizado de errores
    throw error;
  }
});

//historial paginado de conversaciones del usuario
export const getChatHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.userId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Consultas paralelas para optimizar rendimiento
  const [conversations, total] = await Promise.all([
    // Obtener conversaciones con campos específicos
    Conversation.find({ userId })
      .select('title createdAt totalTokens claudeModel')
      .populate('templateId', 'name category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    
      // Contar total para paginación
    Conversation.countDocuments({ userId })
  ]);


  // Cálculo de metadatos de paginación
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
    hasNext: skip + conversations.length < total,
    hasPrev: page > 1
  };

  sendSuccess(res, 'Historial obtenido exitosamente', {
    conversations,
    pagination
  });
});

//conversación específica con todos sus detalles
export const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  // Buscar conversación con validación de propiedad
  const conversation = await Conversation.findOne({
    _id: id,
    userId //  Seguridad: para que solo el propietario puede ver
  })
  .populate('templateId', 'name description category') // Datos de plantilla
  .populate('userId', 'name email');  // Datos del usuario

  // validar que exista
  if (!conversation) {
    throw new AppError('Conversación no encontrada', 404);
  }

  sendSuccess(res, 'Conversación obtenida exitosamente', {
    conversation
  });
});