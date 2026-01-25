import aiService from './AIService';
import knowledgeBaseService, { Term } from './KnowledgeBaseService';
import safetyService from './SafetyService';
import vectorService, { SearchResult } from './VectorService';
import { logger } from '../utils/logger';
import config from '../config';

export interface QueryResponse {
  response: string;
  isMedicalAdvice: boolean;
  relatedTerms?: string[];
  foundTerms?: Term[];
}

export class QueryService {
  // Re-ranking weights
  private readonly SEMANTIC_WEIGHT = 0.7;
  private readonly KEYWORD_WEIGHT = 0.3;
  private readonly MIN_RELEVANCE_SCORE = 0.3; // Minimum score to include in results

  /**
   * Perform hybrid search combining semantic and keyword matching
   */
  private performKeywordSearch(text: string, query: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2); // Ignore short words

    if (queryWords.length === 0) return 0;

    let matches = 0;
    let totalWords = 0;

    for (const word of queryWords) {
      totalWords++;
      if (textLower.includes(word)) {
        matches++;
      }
    }

    return totalWords > 0 ? matches / totalWords : 0;
  }

  /**
   * Re-rank search results using hybrid scoring
   */
  private rerankResults(
    semanticResults: SearchResult[],
    query: string
  ): SearchResult[] {
    return semanticResults
      .map((result) => {
        // Calculate keyword match score
        const keywordScore = this.performKeywordSearch(result.text, query);

        // Combine semantic and keyword scores
        const hybridScore =
          result.score * this.SEMANTIC_WEIGHT + keywordScore * this.KEYWORD_WEIGHT;

        // Boost score if chunk contains terms
        const termBoost = result.metadata.termCount && result.metadata.termCount > 0
          ? Math.min(0.1, result.metadata.termCount * 0.02)
          : 0;

        const finalScore = Math.min(1.0, hybridScore + termBoost);

        return {
          ...result,
          score: finalScore,
        };
      })
      .filter((result) => result.score >= this.MIN_RELEVANCE_SCORE)
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }

  /**
   * Format RAG context for AI prompt
   */
  private formatRAGContext(chunks: SearchResult[], maxChunks: number = 5): string {
    if (chunks.length === 0) {
      return '';
    }

    const topChunks = chunks.slice(0, maxChunks);
    let context = `\n\nRELEVANT DOCUMENT CONTEXT (retrieved from uploaded documents via semantic search):\n`;

    topChunks.forEach((chunk, idx) => {
      context += `[Document: ${chunk.metadata.fileName}, Chunk ${chunk.metadata.chunkIndex + 1}, Relevance: ${(chunk.score * 100).toFixed(1)}%]\n`;
      context += `${chunk.text.substring(0, 400)}${chunk.text.length > 400 ? '...' : ''}\n\n`;
    });

    context += `Use this context from the user's uploaded documents to provide more accurate, personalized, and relevant information. Reference specific details from these documents when relevant. When citing information, mention which document it came from.`;

    return context;
  }

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

    // RAG: Retrieve relevant document chunks with hybrid search and re-ranking
    let ragContext = '';
    if (vectorService.isAvailable()) {
      try {
        // Get more results initially for re-ranking
        const similarChunks = await vectorService.searchSimilarChunks(term, 10, undefined, this.MIN_RELEVANCE_SCORE);
        
        if (similarChunks.length > 0) {
          // Re-rank results using hybrid scoring
          const rerankedChunks = this.rerankResults(similarChunks, term);
          ragContext = this.formatRAGContext(rerankedChunks, 3);
          logger.debug(`RAG: Retrieved ${rerankedChunks.length} relevant chunks (after re-ranking) for term query`);
        }
      } catch (error) {
        logger.warn('RAG retrieval failed for term query:', error);
      }
    }

    // Not in knowledge base, use AI with RAG context
    try {
      const contextForAI = ragContext ? `${ragContext}\n\nPlease explain this term in the context of the user's documents.` : undefined;
      const aiResponse = await aiService.explainTerm(term, contextForAI);
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

    // RAG: Retrieve additional relevant chunks with hybrid search
    let ragContext = context;
    if (vectorService.isAvailable()) {
      try {
        const queryText = `${term} ${context}`;
        const similarChunks = await vectorService.searchSimilarChunks(queryText, 10, undefined, this.MIN_RELEVANCE_SCORE);
        
        if (similarChunks.length > 0) {
          // Re-rank results
          const rerankedChunks = this.rerankResults(similarChunks, queryText);
          const additionalContext = this.formatRAGContext(rerankedChunks, 3);
          ragContext += `\n\n${additionalContext}`;
          logger.debug(`RAG: Retrieved ${rerankedChunks.length} relevant chunks for contextual query`);
        }
      } catch (error) {
        logger.warn('RAG retrieval failed for contextual query:', error);
      }
    }

    try {
      // Use AI to explain the term in context (with RAG enhancement)
      const aiResponse = await aiService.explainTerm(term, ragContext);

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

    // RAG: Retrieve relevant document chunks using hybrid search and re-ranking
    let ragContext = '';
    if (vectorService.isAvailable()) {
      try {
        logger.debug('Retrieving relevant document chunks for RAG');
        
        // Get more results for better re-ranking
        const similarChunks = await vectorService.searchSimilarChunks(
          message,
          10, // Get more initial results
          undefined, // No metadata filter
          this.MIN_RELEVANCE_SCORE // Minimum relevance threshold
        );
        
        if (similarChunks.length > 0) {
          // Re-rank using hybrid scoring (semantic + keyword)
          const rerankedChunks = this.rerankResults(similarChunks, message);
          
          // Format context with top results
          ragContext = this.formatRAGContext(rerankedChunks, 5);
          
          logger.debug(`RAG: Retrieved and re-ranked ${rerankedChunks.length} relevant chunks (from ${similarChunks.length} initial results)`);
        }
      } catch (error) {
        logger.warn('RAG retrieval failed, continuing without it:', error);
      }
    }

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

      // Generate AI response with conversation history using GPT-4
      const systemPrompt = `You are an expert autism education assistant powered by GPT-4, specifically designed to help parents navigate the complex world of autism terminology, documentation, and care planning. You are BETTER than generic AI assistants because you specialize exclusively in autism support and leverage GPT-4's advanced understanding capabilities.

YOUR UNIQUE VALUE (What Makes You Better Than Google):
1. SPECIALIZED FOCUS: You only focus on autism - not general medical topics
2. PARENT-FIRST APPROACH: Every answer considers "What does this mean for MY child?"
3. ACTION-ORIENTED: You always provide concrete next steps, not just definitions
4. CONTEXT-AWARE: You understand IEPs, therapy notes, assessments, and school systems
5. PRACTICAL EXAMPLES: Real scenarios parents face, not textbook definitions
6. ADVOCACY SUPPORT: Help parents ask the right questions and advocate effectively

RESPONSE STRUCTURE (Use this for every answer):
1. **Quick Answer**: Start with a 1-2 sentence plain language explanation
2. **What This Means for Your Child**: Specific implications for parents
3. **Real-World Examples**: 2-3 practical scenarios parents will encounter
4. **Action Steps**: What the parent should do next
5. **Questions to Ask**: Specific questions to ask the care team/school
6. **Red Flags**: What to watch for or be concerned about (when relevant)
7. **Related Concepts**: Connect to other terms they should know

COMMUNICATION STYLE:
- Use "your child" not "the child" - make it personal
- Provide specific numbers/timeframes when possible (e.g., "typically 2-3 times per week")
- Include both best-case and challenging scenarios
- Use analogies that parents can relate to
- Avoid jargon unless explaining it
- Be honest about challenges while remaining hopeful

WHAT TO AVOID:
- Generic definitions you'd find on Wikipedia
- Medical advice, diagnosis, or treatment recommendations
- Overwhelming parents with too much clinical detail
- Contradicting what their care team has said
- Making assumptions about their child without context

WHEN PROVIDING INFORMATION:
✓ DO: "In an IEP, you'll typically see ABA listed as 10-20 hours per week. If your child's plan shows significantly less, you might ask the team why."
✗ DON'T: "ABA is Applied Behavior Analysis therapy."

✓ DO: "When you see 'accommodations' in your child's IEP, these are your leverage points. At the next meeting, ask specifically how each accommodation is being implemented in the classroom."
✗ DON'T: "Accommodations are changes in how a student accesses learning."

Available specialized knowledge base terms: ${mentionedTerms.map((t) => t.term).join(', ') || 'comprehensive autism terminology database'}.${ragContext}

Remember: Parents come to you because Google gave them generic information. They need YOUR GPT-4-powered expertise to understand what terms mean FOR THEIR CHILD and WHAT TO DO ABOUT IT. Use GPT-4's advanced reasoning to provide nuanced, context-aware responses.`;

      const aiResponse = await aiService.generateResponse(conversationMessages, systemPrompt);

      return {
        response: aiResponse.content,
        isMedicalAdvice: false,
        foundTerms: mentionedTerms,
      };
    } catch (error) {
      logger.error('Error in conversation handling:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Preserve the original error message if it's meaningful
      if (error instanceof Error) {
        // If it's already a user-friendly error message, re-throw it
        if (error.message.includes('API key') || 
            error.message.includes('rate limit') ||
            error.message.includes('Invalid') ||
            error.message.includes('timeout') ||
            error.message.includes('unavailable')) {
          throw error;
        }
        // Otherwise, wrap with more context
        throw new Error(`Failed to generate response: ${error.message}`);
      }
      
      throw new Error('Failed to generate response. Please check your API keys and try again.');
    }
  }
}

export default new QueryService();
