import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../config';
import { logger } from '../utils/logger';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class AIService {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;

  constructor() {
    if (config.aiProvider === 'openai' && config.openaiApiKey) {
      this.openaiClient = new OpenAI({
        apiKey: config.openaiApiKey,
        timeout: 60000, // 60 second timeout
        maxRetries: 2, // Retry failed requests up to 2 times
      });
      logger.info('OpenAI client initialized');
    } else if (config.aiProvider === 'anthropic' && config.anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: config.anthropicApiKey,
      });
      logger.info('Anthropic client initialized');
    } else {
      throw new Error(`AI provider ${config.aiProvider} not properly configured`);
    }
  }

  async generateResponse(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    try {
      if (config.aiProvider === 'openai') {
        return await this.generateOpenAIResponse(messages, systemPrompt);
      } else {
        return await this.generateAnthropicResponse(messages, systemPrompt);
      }
    } catch (error) {
      // If error is already an Error with a meaningful message, re-throw it
      if (error instanceof Error) {
        logger.error('AI generation error:', {
          message: error.message,
          stack: error.stack,
        });
        throw error; // Re-throw to preserve the error message
      }
      
      // For unknown error types, wrap in Error
      logger.error('AI generation error (unknown type):', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async generateOpenAIResponse(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      apiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    apiMessages.push(
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: config.aiModel || 'gpt-4o',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000, // Increased for GPT-4's better context handling
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        logger.warn('GPT-4 returned empty response');
        throw new Error('Empty response from GPT-4');
      }

      return {
        content,
        usage: {
          inputTokens: completion.usage?.prompt_tokens || 0,
          outputTokens: completion.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        logger.error('OpenAI API error:', {
          status: error.status,
          code: error.code,
          message: error.message,
          type: error.type,
        });
        
        // Provide more specific error messages based on error type
        if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key configuration.');
        } else if (error.status === 400) {
          // Check if it's a model error
          if (error.message.includes('model') || error.message.includes('Invalid')) {
            throw new Error(`Invalid AI model: ${config.aiModel}. Please check your AI_MODEL configuration in .env file.`);
          }
          throw new Error(`Invalid request: ${error.message}`);
        } else if (error.status === 500 || error.status === 502 || error.status === 503) {
          throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
        } else if (error.status === 504) {
          throw new Error('Request timed out. The AI service is taking too long to respond.');
        }
        
        // For other API errors, include the error message
        throw new Error(`OpenAI API error: ${error.message}`);
      } else if (error instanceof Error) {
        // Re-throw with original message if it's already an Error
        logger.error('OpenAI request error:', {
          message: error.message,
          stack: error.stack,
        });
        throw error;
      } else {
        // Unknown error type
        logger.error('Unknown OpenAI error:', error);
        throw new Error('An unexpected error occurred while communicating with OpenAI API.');
      }
    }
  }

  private async generateAnthropicResponse(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = messages.map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await this.anthropicClient.messages.create({
      model: config.aiModel || 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      system: systemPrompt,
      messages: apiMessages,
    });

    const contentBlock = response.content[0];
    const content = contentBlock.type === 'text' ? contentBlock.text : '';

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Generate an explanation for an autism-related term using GPT-4
   */
  async explainTerm(term: string, context?: string): Promise<string> {
    const systemPrompt = `You are an expert autism education specialist powered by GPT-4, helping parents understand terminology from their child's documentation.

YOUR RESPONSE MUST INCLUDE (use markdown formatting):
1. **Plain Language Definition**: One clear sentence explaining what this term means
2. **Why It Matters**: What this tells you about your child's plan or needs
3. **Real Examples**: 2-3 specific scenarios where parents will see this term
4. **Action Steps**: What the parent should do with this information
5. **Questions to Ask**: 2-3 specific questions to ask the care team about this term

STYLE GUIDELINES:
- Use "your child" to make it personal
- Include specific numbers when relevant (e.g., "typically 5-10 hours per week")
- Provide both what's typical and what might be concerning
- Always end with empowering action steps
- Use clear, structured formatting with markdown
- NEVER provide medical advice or diagnosis

Remember: Google gives generic definitions. You provide ACTIONABLE, PERSONALIZED guidance using GPT-4's advanced understanding.`;

    const userMessage = context
      ? `Explain "${term}" in the context of this document excerpt: "${context}". Focus on what this means for the parent's child specifically based on how the term is used in their document. Provide a comprehensive, structured explanation.`
      : `Explain the autism term "${term}" with practical guidance for parents. Include what to look for, questions to ask, and action steps. Provide a comprehensive, structured explanation.`;

    try {
      const response = await this.generateResponse(
        [{ role: 'user', content: userMessage }],
        systemPrompt
      );

      return response.content;
    } catch (error) {
      logger.error(`Error explaining term "${term}":`, error);
      // Preserve the original error message if available
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to generate explanation for term: ${term}`);
    }
  }

  /**
   * Check if a query is requesting medical advice (safety boundary) using GPT-4
   */
  async detectMedicalAdviceRequest(query: string): Promise<boolean> {
    const systemPrompt = `You are a safety filter powered by GPT-4 that detects if a user query is requesting medical advice, diagnosis, or treatment recommendations.

CRITERIA FOR MEDICAL ADVICE (respond "YES"):
- Asking for diagnosis or assessment of symptoms
- Requesting treatment recommendations or medication advice
- Asking "should I" or "what should I do" about medical conditions
- Seeking second opinions on medical decisions
- Asking about side effects, dosages, or medical procedures

CRITERIA FOR EDUCATIONAL INFORMATION (respond "NO"):
- Asking for definitions or explanations of terminology
- Understanding what terms mean in documents (IEPs, reports, etc.)
- Learning about autism-related concepts and processes
- Asking how to interpret documentation
- General educational questions about autism terminology

Respond with ONLY "YES" or "NO" - nothing else.`;

    try {
      const response = await this.generateResponse(
        [{ role: 'user', content: query }],
        systemPrompt
      );

      const result = response.content.trim().toUpperCase();
      return result === 'YES' || result.startsWith('YES');
    } catch (error) {
      logger.error('Error detecting medical advice request:', error);
      // Default to safe: treat as medical advice if detection fails
      // This ensures we don't accidentally allow medical advice through
      return true;
    }
  }
}

export default new AIService();
