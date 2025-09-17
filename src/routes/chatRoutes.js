import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { 
  completeChat, 
  getChatHistory, 
  getConversationById 
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest, validateQuery } from '../middleware/validation.js';
import { chatCompletionSchema } from '../validators/chatValidator.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiter específico para chat
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 solicitudes de chat por minuto por usuario
  keyGenerator: (req) => {
    return req.user?._id?.toString() || ipKeyGenerator(req);
  },
  message: {
    success: false,
    message: 'Límite de solicitudes de chat excedido. Espera un minuto antes de continuar.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit de chat excedido', {
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      success: false,
      message: 'Límite de solicitudes de chat excedido. Espera un minuto.',
      retryAfter: 60
    });
  }
});

// Esquema para validar query de historial
const historyQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Rutas de chat
router.post('/complete',
  authenticate,
  chatRateLimiter,
  validateRequest(chatCompletionSchema),
  completeChat
);

router.get('/history',
  authenticate,
  validateQuery(historyQuerySchema),
  getChatHistory
);

router.get('/conversations/:id',
  authenticate,
  getConversationById
);

export default router;