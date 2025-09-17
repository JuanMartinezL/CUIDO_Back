import Anthropic from '@anthropic-ai/sdk';
import { AppError } from '../utils/response.js';
import logger from '../utils/logger.js';

class ClaudeService {
  constructor() {
    // NO inicializar aquí - hacerlo cuando se necesite
    this.anthropic = null;
    this.model = null;
    this.defaultMaxTokens = 1000;
    this.defaultTemperature = 0.7;
    this.initialized = false;
  }

  // Inicialización perezosa - se ejecuta la primera vez que se usa el servicio
  initialize() {
    if (this.initialized) return;

    // Verificar que la API key esté presente
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no está configurada en las variables de entorno');
    }

    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      throw new Error('ANTHROPIC_API_KEY tiene formato inválido. Debe empezar con sk-ant-');
    }

    try {
      // Solo usar apiKey, no authToken
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      // Actualizar a un modelo no deprecado
      this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
      this.initialized = true;

      logger.info('✅ Claude Service inicializado exitosamente', {
        model: this.model,
        apiKeyConfigured: true
      });
    } catch (error) {
      logger.error('❌ Error al inicializar Claude Service:', error.message);
      throw error;
    }
  }

  async generateResponse(combinedPrompt, options = {}) {
    // Asegurar inicialización antes de usar
    this.initialize();
    
    const startTime = Date.now();
    
    try {
      const {
        maxTokens = this.defaultMaxTokens,
        temperature = this.defaultTemperature,
        systemMessage = null
      } = options;

      logger.info('Enviando solicitud a Claude', {
        model: this.model,
        maxTokens,
        temperature,
        promptLength: combinedPrompt.length
      });

      const requestConfig = {
        model: this.model,
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [{
          role: 'user',
          content: combinedPrompt
        }]
      };

      // Solo agregar system message si existe
      if (systemMessage) {
        requestConfig.system = systemMessage;
      }

      const response = await this.anthropic.messages.create(requestConfig);

      const responseTime = (Date.now() - startTime) / 1000;

      if (!response.content || response.content.length === 0) {
        throw new AppError('Claude no generó respuesta', 500);
      }

      const assistantMessage = response.content[0];
      
      if (assistantMessage.type !== 'text') {
        throw new AppError('Tipo de respuesta no esperado de Claude', 500);
      }

      const result = {
        response: assistantMessage.text.trim(),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        metadata: {
          model: this.model,
          responseTime,
          temperature,
          maxTokens,
          stopReason: response.stop_reason
        }
      };

      logger.info('Respuesta de Claude generada exitosamente', {
        responseTime,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        responseLength: result.response.length
      });

      return result;

    } catch (error) {
      const responseTime = (Date.now() - startTime) / 1000;
      
      logger.error('Error al generar respuesta con Claude', {
        error: error.message,
        responseTime,
        model: this.model,
        stack: error.stack
      });

      if (error.status === 400) {
        throw new AppError('Solicitud inválida a Claude: ' + error.message, 400);
      }
      
      if (error.status === 401) {
        throw new AppError('API key de Claude inválida', 500);
      }
      
      if (error.status === 429) {
        throw new AppError('Límite de rate excedido para Claude API', 429);
      }
      
      if (error.status >= 500) {
        throw new AppError('Error interno del servicio Claude', 503);
      }

      throw new AppError('Error al comunicarse con Claude: ' + error.message, 500);
    }
  }

  async validateConnection() {
    try {
      // Asegurar inicialización antes de usar
      this.initialize();
      
      logger.info('Validando conexión con Claude API');
      
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hello'
        }]
      });

      logger.info('✅ Conexión con Claude API validada exitosamente');
      return true;
    } catch (error) {
      logger.error('❌ Falló la validación de conexión con Claude', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });
      return false;
    }
  }

  // Método para verificar la configuración SIN inicializar
  validateConfiguration() {
    const issues = [];

    if (!process.env.ANTHROPIC_API_KEY) {
      issues.push('ANTHROPIC_API_KEY no está configurada');
    } else if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      issues.push('ANTHROPIC_API_KEY no tiene el formato correcto');
    }

    // Verificar si el modelo es deprecado
    const modelToCheck = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    const deprecatedModels = ['20240620', '20240229']; 
    const isDeprecated = deprecatedModels.some(version => modelToCheck.includes(version));
    
    if (isDeprecated) {
      issues.push('Modelo deprecado en uso, actualizar a claude-3-5-sonnet-20241022 o claude-3-5-sonnet-latest');
    }

    // Verificar que el modelo tenga un formato válido
    if (!modelToCheck.startsWith('claude-')) {
      issues.push('Modelo no válido, debe empezar con "claude-"');
    }

    if (issues.length > 0) {
      logger.warn('Problemas de configuración detectados:', { issues });
      return { valid: false, issues };
    }

    logger.info('✅ Configuración de Claude validada');
    return { valid: true, issues: [] };
  }
}

export default new ClaudeService();