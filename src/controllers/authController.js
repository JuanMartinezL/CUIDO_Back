import authService from '../services/authService.js';
import { asyncHandler, sendSuccess, AppError } from '../utils/response.js';
import logger from '../utils/logger.js';


// Registrar usuario
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validatedData; // Datos ya validados por middleware de validación

  logger.info('Intento de registro', { email, ip: req.ip }); // Log de auditoría: intento de registro

  // Procesamiento del registro via servicio
  const result = await authService.register({ name, email, password });

   // Log de auditoría: registro exitoso
  logger.info('Usuario registrado exitosamente', { 
    userId: result.user._id, 
    email: result.user.email 
  });

  // Respuesta HTTP exitosa (201 Created)
  sendSuccess(res, 'Usuario registrado exitosamente', result, 201);
});

// Iniciar sesión
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData; // Credenciales ya validadas por middleware
 
  logger.info('Intento de login', { email, ip: req.ip }); // Log de auditoría: intento de login

  const result = await authService.login({ email, password }); // Autenticación via servicio

  // Log de auditoría: login exitoso
  logger.info('Usuario autenticado exitosamente', { 
    userId: result.user._id, 
    email: result.user.email 
  });

  // Respuesta HTTP exitosa (200 OK)
  sendSuccess(res, 'Inicio de sesión exitoso', result);
});

// Obtener perfil
export const getProfile = asyncHandler(async (req, res) => {
  // Usuario ya disponible via middleware de autenticación
  const user = req.user;

    // Respuesta con datos del perfil
  sendSuccess(res, 'Perfil obtenido exitosamente', { user });
});