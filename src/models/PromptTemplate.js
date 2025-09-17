import mongoose from 'mongoose';

const promptTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la plantilla es requerido'],
    unique: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  template: {
    type: String,
    required: [true, 'El template es requerido'],
    trim: true,
    maxlength: [2000, 'El template no puede exceder 2000 caracteres']
  },
  systemInstructions: {
    type: String,
    required: [true, 'Las instrucciones del sistema son requeridas'],
    trim: true,
    maxlength: [1000, 'Las instrucciones no pueden exceder 1000 caracteres']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['Recursos Humanos y Salud', 'Calidad Asistencial y Salud', 'analysis', 'creative', 'technical', 'business', 'educational', 'general']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Cada tag no puede exceder 30 caracteres']
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

promptTemplateSchema.index({ category: 1, isActive: 1 });
promptTemplateSchema.index({ tags: 1 });
promptTemplateSchema.index({ createdBy: 1 });

export default mongoose.model('PromptTemplate', promptTemplateSchema);