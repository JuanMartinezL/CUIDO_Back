import PromptTemplate from '../models/PromptTemplate.js';
import { AppError } from '../utils/response.js';

class PromptService {
  /**
   * Combina una plantilla predefinida con el prompt del usuario
   * siguiendo las mejores prácticas de ingeniería de prompts
   */
  combinePrompts(template, userInput, options = {}) {
    const {
      maxResponseLength = 500,
      responseStyle = 'conciso y directo',
      language = 'español',
      preventHallucination = true
    } = options;

    // Plantilla base del sistema con instrucciones fijas
    const systemBase = `Eres un asistente AI especializado y preciso. Tu objetivo es proporcionar respuestas ${responseStyle} en ${language}.

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE basándote en la información proporcionada
- Si no tienes información suficiente, indica claramente qué falta
- Máximo ${maxResponseLength} caracteres en tu respuesta
- Estructura tu respuesta de manera clara y directa
- NO inventes información o datos que no tengas
- Enfócate en ser útil y preciso`;

    // Instrucciones específicas de la plantilla
    const templateInstructions = `
CONTEXTO ESPECÍFICO:
${template.systemInstructions}

PLANTILLA DE TRABAJO:
${template.template}`;

    // Entrada del usuario
    const userSection = `
CONSULTA DEL USUARIO:
${userInput.trim()}`;

    // Instrucciones de formato de salida
    const outputInstructions = `
FORMATO DE RESPUESTA REQUERIDO:
- Directo al punto
- Sin introducciones innecesarias
- Máximo ${maxResponseLength} caracteres
- Si aplica, usa numeración o viñetas para claridad
- Concluye con una recomendación práctica si es relevante`;

    // Combinación final
    const combinedPrompt = [
      systemBase,
      templateInstructions,
      userSection,
      preventHallucination ? '\nIMPORTANTE: Solo responde con información que puedas verificar o deducir lógicamente del contexto proporcionado.' : '',
      outputInstructions
    ].filter(Boolean).join('\n');

    return {
      systemMessage: systemBase,
      combinedPrompt: combinedPrompt.trim(),
      metadata: {
        templateId: template._id,
        templateName: template.name,
        userPromptLength: userInput.length,
        maxResponseLength,
        language,
        preventHallucination
      }
    };
  }

  async getTemplateById(templateId, userId) {
    const template = await PromptTemplate.findOne({
      _id: templateId,
      isActive: true
    }).populate('createdBy', 'name email');

    if (!template) {
      throw new AppError('Plantilla no encontrada', 404);
    }

    return template;
  }

  async incrementUsageCount(templateId) {
    await PromptTemplate.findByIdAndUpdate(
      templateId,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
  }

  validateUserInput(userInput) {
    if (!userInput || typeof userInput !== 'string') {
      throw new AppError('El prompt del usuario es requerido', 400);
    }

    if (userInput.trim().length < 5) {
      throw new AppError('El prompt debe tener al menos 5 caracteres', 400);
    }

    if (userInput.length > 2000) {
      throw new AppError('El prompt no puede exceder 2000 caracteres', 400);
    }

    // Sanitización básica
    return userInput.trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
  }

  // Función para prevenir inyección de prompts
  sanitizePrompt(input) {
    // Remover caracteres potencialmente problemáticos
    const dangerous = [
      'ignore previous instructions',
      'ignore all previous',
      'system:',
      '```',
      '<script>',
      '</script>',
      'javascript:',
      'data:text/html'
    ];

    let sanitized = input.toLowerCase();
    dangerous.forEach(phrase => {
      if (sanitized.includes(phrase)) {
        throw new AppError('El prompt contiene contenido no permitido', 400);
      }
    });

    return input;
  }
}

export default new PromptService();
      