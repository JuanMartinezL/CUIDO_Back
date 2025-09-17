import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiter específico para autenticación
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit de autenticación excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
      retryAfter: 900
    });
  }
});

// Rutas públicas (con rate limiting)
router.post('/register', 
  authRateLimiter,
  validateRequest(registerSchema), 
  register
);

router.post('/login', 
  authRateLimiter,
  validateRequest(loginSchema), 
  login
);

// Rutas protegidas
router.get('/profile', authenticate, getProfile);

export default router;