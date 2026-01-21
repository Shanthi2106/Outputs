import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../../utils/logger';

/**
 * Validation middleware factory
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error:', {
          path: req.path,
          errors: error.errors,
        });

        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      logger.error('Unexpected validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
}

// Validation schemas for different endpoints

export const termQuerySchema = z.object({
  term: z.string().min(1, 'Term is required').max(200, 'Term too long'),
});

export const contextQuerySchema = z.object({
  term: z.string().min(1, 'Term is required').max(200, 'Term too long'),
  context: z.string().min(1, 'Context is required').max(5000, 'Context too long'),
});

export const conversationSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
  sessionId: z.string().optional(),
});

export default validate;
