import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    //conexion principal
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      //// Pool de conexiones: máximo 10 conexiones simultáneas
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Timeout para seleccionar servidor: 5 segundos
      socketTimeoutMS: 45000,  // Timeout para operaciones socket: 45 segundos
      
    });

    logger.info(`Base de datos conectada: ${conn.connection.host}`);
    //configuracion de event listeners

    //manejo de errores durante la conexion activa

    mongoose.connection.on('error', (err) => {
      logger.error('Error de conexión a la base de datos:', err);
    });

    //evento de desconexion

    mongoose.connection.on('disconnected', () => {
      logger.warn('Base de datos desconectada');
    });

    //evento de reconexion automatica
    mongoose.connection.on('reconnected', () => {
      logger.info('Base de datos reconectada');
    });

      //Cierra la conexión de manera segura cuando la aplicación se termina
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('Conexión a la base de datos cerrada por terminación de aplicación');
      } catch (error) {
        logger.error('Error cerrando conexión a la base de datos:', error);
      }
    });

    return conn;
  } catch (error) {
    // Error crítico: termina la aplicación si no puede conectarse
    logger.error('Error conectando a la base de datos:', error);
    process.exit(1);
  }
};