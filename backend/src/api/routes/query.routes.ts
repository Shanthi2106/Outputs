import { Router, Request, Response } from 'express';
import queryService from '../../services/QueryService';
import knowledgeBaseService from '../../services/KnowledgeBaseService';
import { validate, termQuerySchema, contextQuerySchema } from '../middleware/validation.middleware';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/v1/query/term
 * Simple term lookup
 */
router.post('/term', validate(termQuerySchema), async (req: Request, res: Response) => {
  try {
    const { term } = req.body;

    logger.info('Term query request:', { term });

    const result = await queryService.queryTerm(term);

    res.json({
      success: true,
      explanation: result.response,
      relatedTerms: result.relatedTerms,
      isMedicalAdvice: result.isMedicalAdvice,
    });
  } catch (error) {
    logger.error('Error in term query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process term query',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/query/context
 * Contextual explanation from document excerpt
 */
router.post('/context', validate(contextQuerySchema), async (req: Request, res: Response) => {
  try {
    const { term, context } = req.body;

    logger.info('Context query request:', {
      term,
      contextLength: context.length,
    });

    const result = await queryService.queryWithContext(term, context);

    res.json({
      success: true,
      explanation: result.response,
      foundTerms: result.foundTerms?.map((t) => ({
        term: t.term,
        category: t.category,
      })),
      relatedTerms: result.relatedTerms,
      isMedicalAdvice: result.isMedicalAdvice,
    });
  } catch (error) {
    logger.error('Error in context query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process context query',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/query/terms
 * Get all autism-related terms from the knowledge base
 */
router.get('/terms', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching all terms from knowledge base');

    const terms = knowledgeBaseService.getAllTerms();

    res.json({
      success: true,
      terms: terms.map((term) => ({
        term: term.term,
        fullName: term.fullName,
        category: term.category,
        definition: term.definition,
        plainLanguage: term.plainLanguage,
        examples: term.examples,
        relatedTerms: term.relatedTerms,
        documentTypes: term.documentTypes,
      })),
      count: terms.length,
    });
  } catch (error) {
    logger.error('Error fetching terms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch terms',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
