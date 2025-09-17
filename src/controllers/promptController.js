import PromptTemplate from '../models/PromptTemplate.js';
import { asyncHandler, sendSuccess, AppError } from '../utils/response.js';
import logger from '../utils/logger.js';

//lista paginada de plantillas activas con filtros opcionales
export const getPrompts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    tags, 
    search 
  } = req.query;

  const query = { isActive: true }; // Base: solo plantillas activas

  // Filtros por categorias
  if (category) query.category = category;

  // Filtro por tags (array de tags separados por coma)
  if (tags) query.tags = { $in: tags.split(',') };
  
  //busqueda
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

   // Cálculo de paginación

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Ejecutar consultas en paralelo
  const [prompts, total] = await Promise.all([
    // Consulta principal con optimizaciones
    PromptTemplate.find(query)
      .select('name description category tags usageCount isDefault createdAt')
      .populate('createdBy', 'name email')
      .sort({ 
        isDefault: -1,   // Plantillas por defecto primero
        usageCount: -1,   // Más usadas primero
        createdAt: -1   // Más recientes primero
      })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    
      // Conteo total para paginación
    PromptTemplate.countDocuments(query)
  ]);


  // Metadatos de paginación
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
    hasNext: skip + prompts.length < total,
    hasPrev: page > 1
  };

    // Log de auditoría
  logger.info('Plantillas listadas', { 
    count: prompts.length, 
    total, 
    userId: req.userId 
  });

  sendSuccess(res, 'Plantillas obtenidas exitosamente', { 
    prompts, 
    pagination 
  });
});

export const getPromptById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prompt = await PromptTemplate.findOne({
    _id: id,
    isActive: true
  }).populate('createdBy', 'name email');

  if (!prompt) {
    throw new AppError('Plantilla no encontrada', 404);
  }

  sendSuccess(res, 'Plantilla obtenida exitosamente', { prompt });
});

//Crea una nueva plantilla personalizada

export const createPrompt = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    template,
    systemInstructions,
    category,
    tags = []  // array vacío por defecto
  } = req.validatedData;

   // Creación de nueva plantilla
  const prompt = new PromptTemplate({
    name,
    description,
    template,
    systemInstructions,
    category,
    tags,
    createdBy: req.userId   // Usuario actual como creador
     // isDefault: false (default en el schema)
    // isActive: true (default en el schema)
    // usageCount: 0 (default en el schema
  });



  // Log de auditoría
  await prompt.save();

  logger.info('Nueva plantilla creada', { 
    promptId: prompt._id, 
    name: prompt.name, 
    createdBy: req.userId 
  });

  sendSuccess(res, 'Plantilla creada exitosamente', { prompt }, 201);
});

//Actualiza una plantilla existente (solo por el creador)
export const updatePrompt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.validatedData;

  // Actualización con control de permisos
  const prompt = await PromptTemplate.findOneAndUpdate(
    { 
      _id: id, 
      createdBy: req.userId // Solo el creador puede actualizar
    },
    updateData,
    { 
      new: true,  // Retorna documento actualizado
      runValidators: true  // Aplica validaciones del schema
    }
  ).populate('createdBy', 'name email');

  if (!prompt) {
    throw new AppError('Plantilla no encontrada o sin permisos', 404);
  }


  // Log de auditoría
  logger.info('Plantilla actualizada', { 
    promptId: prompt._id, 
    updatedBy: req.userId 
  });

  sendSuccess(res, 'Plantilla actualizada exitosamente', { prompt });
});

export const deletePrompt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Soft delete - marcar como inactiva
  const prompt = await PromptTemplate.findOneAndUpdate(
    { 
      _id: id, 
      createdBy: req.userId 
    },
    { isActive: false },
    { new: true }
  );

  if (!prompt) {
    throw new AppError('Plantilla no encontrada o sin permisos', 404);
  }

   // Log de auditoría
  logger.info('Plantilla eliminada', { 
    promptId: prompt._id, 
    deletedBy: req.userId 
  });

  sendSuccess(res, 'Plantilla eliminada exitosamente');
});