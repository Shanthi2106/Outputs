import { Router, Request, Response } from 'express';
import queryService from '../../services/QueryService';
import { validate, conversationSchema } from '../middleware/validation.middleware';
import { logger } from '../../utils/logger';
import config from '../../config';

const router = Router();

/**
 * POST /api/v1/conversation
 * Handle multi-turn conversational interaction
 */
router.post('/', validate(conversationSchema), async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    logger.info('Conversation request:', {
      messageLength: message.length,
      historyLength: history.length,
    });

    const result = await queryService.handleConversation(message, history);

    res.json({
      success: true,
      response: result.response,
      isMedicalAdvice: result.isMedicalAdvice,
      foundTerms: result.foundTerms?.map((t) => ({
        term: t.term,
        category: t.category,
      })),
    });
  } catch (error) {
    // Log full error details for debugging
    logger.error('Error in conversation:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      messageLength: req.body?.message?.length,
      historyLength: req.body?.history?.length,
    });

    // Determine error type and provide user-friendly message
    let statusCode = 500;
    let errorMessage = 'Failed to process conversation';
    let errorDetails: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        statusCode = 401;
        errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.message.includes('model') || error.message.includes('Invalid')) {
        statusCode = 400;
        errorMessage = `Invalid AI model configuration: ${error.message}`;
      } else if (error.message.includes('Empty response')) {
        errorMessage = 'The AI service returned an empty response. Please try again.';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        statusCode = 504;
        errorMessage = 'Request timed out. The AI service is taking too long to respond. Please try again.';
      }

      // Include error details in development mode
      if (config.nodeEnv === 'development') {
        errorDetails = error.stack;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: 'Failed to process conversation',
      message: errorMessage,
      ...(errorDetails && { details: errorDetails }),
    });
  }
});

/**
 * POST /api/v1/conversation/reset
 * Reset conversation (no-op for stateless design, but included for API completeness)
 */
router.post('/reset', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Conversation reset. Start a new conversation by sending a message.',
  });
});

export default router;
