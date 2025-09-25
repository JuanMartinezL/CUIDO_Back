//  Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 🔄 Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 📦 Response utilities
export const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
    ...(data !== null && { data })
  };

  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    ...(error && { error })
  };

  return res.status(statusCode).json(response);
};

//  Validation error formatter (defensive version)
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors)) {
    return [{
      field: 'unknown',
      message: 'Error de validación inesperado',
      code: 'invalid_format'
    }];
  }

  return errors.map(error => ({
    field: Array.isArray(error.path) ? error.path.join('.') : error.path || 'unknown',
    message: error.message || 'Mensaje no disponible',
    code: error.code || 'unknown_error'
  }));
};