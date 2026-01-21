import { Router, Request, Response } from 'express';
import queryService from '../../services/QueryService';
import { validate, conversationSchema } from '../middleware/validation.middleware';
import { logger } from '../../utils/logger';

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
    logger.error('Error in conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process conversation',
      message: error instanceof Error ? error.message : 'Unknown error',
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
