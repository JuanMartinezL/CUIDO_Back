import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/response.js';

class AuthService {
  generateToken(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'claude-prompt-api',
        subject: userId.toString()
      }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expirado', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Token inválido', 401);
      }
      throw new AppError('Error de autenticación', 401);
    }
  }

  async register({ name, email, password }) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    const user = new User({ name, email: email.toLowerCase(), password });
    await user.save();

    const token = this.generateToken(user._id);
    
    return {
      user: user.toJSON(),
      token
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id);
    
    return {
      user: user.toJSON(),
      token
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return user;
  }
}

export default new AuthService();