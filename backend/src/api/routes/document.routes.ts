import { Router, Request, Response } from 'express';
import multer from 'multer';
import documentService from '../../services/DocumentService';
import { logger } from '../../utils/logger';

const router = Router();

// Configure multer for file uploads (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and text files are allowed.'));
    }
  },
});

/**
 * POST /api/v1/document/upload
 * Upload and analyze a document
 */
router.post(
  '/upload',
  upload.single('document'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      logger.info('Document upload request:', {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      });

      const analysis = await documentService.analyzeDocument(req.file);

      logger.info('Sending analysis response to client');

      res.json({
        success: true,
        analysis: {
          fileName: analysis.fileName,
          fileType: analysis.fileType,
          fileSize: analysis.fileSize,
          wordCount: analysis.wordCount,
          summary: analysis.summary,
          analysis: analysis.analysis,
          consolidatedReport: analysis.consolidatedReport,
          foundTerms: analysis.foundTerms.map((t) => ({
            term: t.term.term,
            fullName: t.term.fullName,
            category: t.term.category,
            definition: t.term.definition,
            plainLanguage: t.term.plainLanguage,
            examples: t.term.examples,
            relatedTerms: t.term.relatedTerms,
            documentTypes: t.term.documentTypes,
            occurrences: t.occurrences,
            contextualMeaning: t.contextualMeaning,
          })),
          textPreview: analysis.text.substring(0, 500) + '...',
        },
      });
    } catch (error) {
      logger.error('Error processing document upload:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process document';

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * POST /api/v1/document/highlight
 * Highlight terms in provided text
 */
router.post('/highlight', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Text is required',
      });
      return;
    }

    if (text.length > 50000) {
      res.status(400).json({
        success: false,
        error: 'Text too long (maximum 50,000 characters)',
      });
      return;
    }

    logger.info('Text highlight request:', {
      textLength: text.length,
    });

    // Find terms in text
    const foundTerms = documentService['findTermsInText'](text);

    // Generate highlighted HTML
    const highlightedText = documentService.highlightTerms(
      text,
      foundTerms.map((t) => t.term)
    );

    res.json({
      success: true,
      highlightedText,
      foundTerms: foundTerms.map((t) => ({
        term: t.term.term,
        fullName: t.term.fullName,
        category: t.term.category,
        occurrences: t.occurrences,
        plainLanguage: t.term.plainLanguage,
      })),
    });
  } catch (error) {
    logger.error('Error highlighting text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to highlight text',
    });
  }
});

/**
 * GET /api/v1/document/supported-types
 * Get list of supported file types
 */
router.get('/supported-types', (req: Request, res: Response) => {
  res.json({
    success: true,
    supportedTypes: [
      {
        type: 'application/pdf',
        extension: '.pdf',
        description: 'PDF Documents',
      },
      {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: '.docx',
        description: 'Microsoft Word Documents (2007+)',
      },
      {
        type: 'application/msword',
        extension: '.doc',
        description: 'Microsoft Word Documents (Legacy)',
      },
      {
        type: 'text/plain',
        extension: '.txt',
        description: 'Plain Text Files',
      },
    ],
    maxFileSize: '5MB',
  });
});

export default router;
