import express from 'express';
import { 
  getPrompts, 
  getPromptById, 
  createPrompt, 
  updatePrompt, 
  deletePrompt 
} from '../controllers/promptController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { z } from 'zod';

const router = express.Router();

// Esquemas de validación
const promptQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  category: z.enum(['analysis', 'creative', 'technical', 'business', 'educational', 'general']).optional(),
  tags: z.string().optional(),
  search: z.string().max(100).optional()
});

const createPromptSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim(),
  
  template: z.string()
    .min(20, 'El template debe tener al menos 20 caracteres')
    .max(2000, 'El template no puede exceder 2000 caracteres')
    .trim(),
  
  systemInstructions: z.string()
    .min(20, 'Las instrucciones deben tener al menos 20 caracteres')
    .max(1000, 'Las instrucciones no pueden exceder 1000 caracteres')
    .trim(),
  
  category: z.enum(['analysis', 'creative', 'technical', 'business', 'educational', 'general']),
  
  tags: z.array(
    z.string().max(30).trim().toLowerCase()
  ).max(10, 'Máximo 10 tags permitidos').optional().default([])
});

const updatePromptSchema = createPromptSchema.partial();

// Rutas públicas (requieren autenticación)
router.get('/', 
  authenticate,
  validateQuery(promptQuerySchema),
  getPrompts
);

router.get('/:id', 
  authenticate,
  getPromptById
);

// Rutas para administradores
router.post('/', 
  authenticate,
  authorize('admin'),
  validateRequest(createPromptSchema),
  createPrompt
);

router.put('/:id', 
  authenticate,
  authorize('admin'),
  validateRequest(updatePromptSchema),
  updatePrompt
);

router.delete('/:id', 
  authenticate,
  authorize('admin'),
  deletePrompt
);

export default router;