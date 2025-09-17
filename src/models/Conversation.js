import mongoose from 'mongoose';


/**
 * Schema para mensajes individuales dentro de una conversación
 * Soporta roles de OpenAI/Claude: user, assistant, system
 */
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },

  /**
   * Contenido textual del mensaje
   * Límite de 10,000 caracteres para optimizar almacenamiento
   */
  content: {
    type: String,
    required: true,
    maxlength: [10000, 'El contenido no puede exceder 10000 caracteres']
  },
  /**
   * Timestamp específico del mensaje
   * Permite rastrear timing individual de cada intercambio
   */
  timestamp: {
    type: Date,
    default: Date.now
  },
  /**
   * Conteo de tokens específico del mensaje
   * Usado para facturación detallada y análisis de costo
   */
  tokenCount: {
    type: Number,
    default: 0
  }
});

/**
 * Schema principal que representa una conversación completa
 * Incluye metadatos, referencias y configuración utilizada
 */
const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es obligatorio'],
    index: true  // Índice para consultas por usuario
  },
   /**
   * Plantilla de prompt utilizada
   * Referencia al modelo PromptTemplate para trazabilidad
   */
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromptTemplate',
    required: true
  },
  /**
   * Título descriptivo de la conversación
   * Generado automáticamente del prompt del usuario
   */
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  /**
   * Array de mensajes que conforman la conversación
   * Historial completo de intercambios usuario-Claude
   */
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'error'],
    default: 'completed'
  },

  /**
   * Total de tokens consumidos en toda la conversación
   * Suma de tokens de entrada + tokens de salida
   */
  totalTokens: {
    type: Number,
    default: 0
  },
  //modelo de claude utilizado 
  claudeModel: {
    type: String,
    required: true
  },
  //metadatos adicionales de procesamiento
  metadata: {
    /**
     * Prompt original ingresado por el usuario
     * Antes de combinarse con la plantilla
     */
    userPrompt: String,
    /**
     * Prompt final enviado a Claude
     * Resultado de combinar plantilla + prompt usuario
     */
    combinedPrompt: String,
    //tiempo de respuesta
    responseTime: Number,
    //Parámetro de temperature utilizado (0.0-1.0)
    temperature: Number,
    /**
     * Límite máximo de tokens solicitado
     * Parámetro de configuración del request
     */
    maxTokens: Number
  }
}, {
  timestamps: true,
   /**
   * Transformación para JSON
   * Limpia campos internos al serializar
   */
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;  // Elimina version key de Mongoose
      return ret;
    }
  }
});

/**
 * Índice compuesto para historial de usuario
 * Optimiza: "Obtener conversaciones del usuario ordenadas por fecha"
 */
conversationSchema.index({ userId: 1, createdAt: -1 });

//analisis de uso de plantilla
conversationSchema.index({ templateId: 1 });

//indicide filtrado por estado
conversationSchema.index({ status: 1 });

export default mongoose.model('Conversation', conversationSchema); 