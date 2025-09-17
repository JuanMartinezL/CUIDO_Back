// IMPORTANTE: Configurar dotenv ANTES de cualquier importación
import dotenv from 'dotenv';
dotenv.config();

// Debug temporal para verificar que las variables se cargan
console.log("🔧 Variables de entorno cargadas:");
console.log("ANTHROPIC_API_KEY configurada:", !!process.env.ANTHROPIC_API_KEY);
console.log("ANTHROPIC_API_KEY longitud:", process.env.ANTHROPIC_API_KEY?.length || 0);
console.log("CLAUDE_MODEL:", process.env.CLAUDE_MODEL || 'no configurado');

// Importar DESPUÉS de configurar dotenv
import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import logger from './src/utils/logger.js';
import claudeService from './src/services/claudeService.js';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Verificar configuración crítica antes de continuar
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error('ANTHROPIC_API_KEY no está configurada en el archivo .env');
      process.exit(1);
    }

    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      logger.error('ANTHROPIC_API_KEY no tiene el formato correcto (debe empezar con sk-ant-)');
      process.exit(1);
    }

    // Validar configuración de Claude (SIN inicializar aún)
    const configValidation = claudeService.validateConfiguration();
    if (!configValidation.valid) {
      logger.warn('⚠️ Problemas de configuración de Claude detectados:', configValidation.issues);
      // Continuar pero advertir
    } else {
      logger.info('✅ Configuración de Claude validada');
    }

    // Conectar a MongoDB
    await connectDB();
    logger.info('✅ Conectado exitosamente a la base de datos');

    // Validar conexión con Claude API (AQUÍ se inicializa Claude)
    const claudeConnected = await claudeService.validateConnection();
    if (claudeConnected) {
      logger.info('✅ Conexión con Claude API validada exitosamente ');
    } else {
      logger.warn('No se pudo validar conexión con Claude API');
      logger.warn('Verifica tu ANTHROPIC_API_KEY y conexión a internet');
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${PORT} (${NODE_ENV})`);
      logger.info(`📡 Health check disponible en http://localhost:${PORT}/health`);
      
      // Log de configuración (sin exponer datos sensibles)
      logger.info('🔧 Configuración del servidor:', {
        port: PORT,
        environment: NODE_ENV,
        mongoConnected: true,
        claudeConfigured: !!process.env.ANTHROPIC_API_KEY,
        claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
      });
    });

    // Manejo graceful de cierre
    const gracefulShutdown = (signal) => {
      logger.info(`🔄 ${signal} recibido. Cerrando servidor gracefully...`);
      server.close(() => {
        logger.info('✅ Servidor cerrado exitosamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(' Unhandled Rejection en:', promise, 'razón:', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      logger.error(' Uncaught Exception:', error);
      process.exit(1);
    });

    return server;

  } catch (error) {
    logger.error(' Error al iniciar servidor:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default startServer;