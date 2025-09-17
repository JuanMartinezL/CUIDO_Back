import { z } from 'zod';

export const chatCompletionSchema = z.object({
  templateId: z.string()
    .min(24, 'ID de template inválido')
    .max(24, 'ID de template inválido')
    .regex(/^[0-9a-fA-F]{24}$/, 'Formato de ID inválido'),
  
  userPrompt: z.string()
    .min(5, 'El prompt debe tener al menos 5 caracteres')
    .max(2000, 'El prompt no puede exceder 2000 caracteres')
    .trim()
    .refine((val) => {
      // Prevenir inyección de prompts
      const dangerous = [
        'ignore previous instructions',
        'ignore all previous',
        'system:',
        'assistant:',
        '<script>',
        'javascript:'
      ];
      const lower = val.toLowerCase();
      return !dangerous.some(phrase => lower.includes(phrase));
    }, 'El prompt contiene contenido no permitido'),
  
  temperature: z.number()
    .min(0, 'La temperatura debe ser mayor o igual a 0')
    .max(1, 'La temperatura debe ser menor o igual a 1')
    .optional()
    .default(0.7),
  
  maxTokens: z.number()
    .min(1, 'maxTokens debe ser mayor a 0')
    .max(4000, 'maxTokens no puede exceder 4000')
    .optional()
    .default(1000)
});