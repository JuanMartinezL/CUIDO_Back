import authService from '../services/authService.js';
import { asyncHandler } from '../utils/response.js';

// Autenticar usuario
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = authService.verifyToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }

  const user = await authService.getCurrentUser(decoded.userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  req.user = user;
  req.userId = user._id;
  next();
});

// Autorizar usuario
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }
    next();
  };
};
