import aiService from './AIService';
import knowledgeBaseService, { Term } from './KnowledgeBaseService';
import safetyService from './SafetyService';
import { logger } from '../utils/logger';

export interface QueryResponse {
  response: string;
  isMedicalAdvice: boolean;
  relatedTerms?: string[];
  foundTerms?: Term[];
}

export class QueryService {
  /**
   * Handle a simple term query
   */
  async queryTerm(term: string): Promise<QueryResponse> {
    logger.info('Processing term query:', { term });

    // Check safety first
    const safetyCheck = await safetyService.checkQuery(term);
    if (!safetyCheck.isSafe) {
      return {
        response: safetyCheck.suggestedResponse || 'Query not allowed',
        isMedicalAdvice: true,
      };
    }

    // Search knowledge base
    const foundTerm = knowledgeBaseService.searchTerm(term);

    if (foundTerm) {
      // We have this term in our knowledge base
      const explanation = knowledgeBaseService.getTermExplanation(foundTerm);
      return {
        response: explanation,
        isMedicalAdvice: false,
        relatedTerms: foundTerm.relatedTerms,
      };
    }

    // Not in knowledge base, use AI
    try {
      const aiResponse = await aiService.explainTerm(term);
      return {
        response: aiResponse,
        isMedicalAdvice: false,
      };
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw new Error('Failed to generate explanation');
    }
  }

  /**
   * Handle a contextual query with document excerpt
   */
  async queryWithContext(term: string, context: string): Promise<QueryResponse> {
    logger.info('Processing contextual query:', { term, contextLength: context.length });

    // Check safety
    const safetyCheck = await safetyService.checkQuery(`${term} ${context}`);
    if (!safetyCheck.isSafe) {
      return {
        response: safetyCheck.suggestedResponse || 'Query not allowed',
        isMedicalAdvice: true,
      };
    }

    // Find all terms mentioned in the context
    const foundTerms = knowledgeBaseService.findTermsInText(context);

    try {
      // Use AI to explain the term in context
      const aiResponse = await aiService.explainTerm(term, context);

      return {
        response: aiResponse,
        isMedicalAdvice: false,
        foundTerms,
        relatedTerms: foundTerms.length > 0 ? foundTerms.map((t) => t.term) : undefined,
      };
    } catch (error) {
      logger.error('Error generating contextual response:', error);
      throw new Error('Failed to generate contextual explanation');
    }
  }

  /**
   * Handle a conversational message
   */
  async handleConversation(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<QueryResponse> {
    logger.info('Processing conversation message:', {
      messageLength: message.length,
      historyLength: history.length,
    });

    // Check safety
    const safetyCheck = await safetyService.checkQuery(message);
    if (!safetyCheck.isSafe) {
      return {
        response: safetyCheck.suggestedResponse || 'Query not allowed',
        isMedicalAdvice: true,
      };
    }

    // Check if message mentions any terms from our knowledge base
    const mentionedTerms = knowledgeBaseService.findTermsInText(message);

    try {
      // Build conversation context
      const conversationMessages = [
        ...history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: message,
        },
      ];

      // Generate AI response with conversation history
      const systemPrompt = `You are a compassionate educational assistant helping parents and caregivers understand autism-related terminology.

Key Guidelines:
- Explain terms in clear, plain language suitable for non-clinical audiences
- Be empathetic and supportive in your tone
- Provide practical examples where helpful
- Stay focused on education about terminology and concepts
- NEVER provide medical advice, diagnosis, or treatment recommendations
- If asked about medical topics, gently redirect to consult with healthcare professionals
- Maintain conversation context from previous messages
- If the user asks follow-up questions, build on previous explanations
- If asked to simplify, use even more basic language and analogies

Available knowledge: You have access to information about common autism terms including: ${mentionedTerms.map((t) => t.term).join(', ') || 'general autism terminology'}.`;

      const aiResponse = await aiService.generateResponse(conversationMessages, systemPrompt);

      return {
        response: aiResponse.content,
        isMedicalAdvice: false,
        foundTerms: mentionedTerms,
      };
    } catch (error) {
      logger.error('Error in conversation handling:', error);
      throw new Error('Failed to generate response');
    }
  }
}

export default new QueryService();
