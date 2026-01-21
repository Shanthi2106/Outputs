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
      logger.error('AI generation error:', error);
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

    const completion = await this.openaiClient.chat.completions.create({
      model: config.aiModel,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
      },
    };
  }

  private async generateAnthropicResponse(
    messages: AIMessage[],
    systemPrompt?: string
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const apiMessages = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : ('assistant' as const),
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
   * Generate an explanation for an autism-related term
   */
  async explainTerm(term: string, context?: string): Promise<string> {
    const systemPrompt = `You are a compassionate educational assistant helping parents and caregivers understand autism-related terminology. Your role is to:
- Explain terms in clear, plain language suitable for non-clinical audiences
- Be empathetic and supportive in your tone
- Provide practical examples where helpful
- NEVER provide medical advice, diagnosis, or treatment recommendations
- If asked about medical topics, gently redirect to consult with healthcare professionals
- Focus on education and understanding, not clinical guidance`;

    const userMessage = context
      ? `Please explain the term "${term}" in the context of this excerpt from a document: "${context}"`
      : `Please explain the autism-related term "${term}" in simple, parent-friendly language.`;

    const response = await this.generateResponse(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    return response.content;
  }

  /**
   * Check if a query is requesting medical advice (safety boundary)
   */
  async detectMedicalAdviceRequest(query: string): Promise<boolean> {
    const systemPrompt = `You are a safety filter that detects if a user query is requesting medical advice, diagnosis, or treatment recommendations. Respond with only "YES" if the query is asking for medical advice, or "NO" if it's asking for educational information about terminology.`;

    const response = await this.generateResponse(
      [{ role: 'user', content: query }],
      systemPrompt
    );

    return response.content.trim().toUpperCase() === 'YES';
  }
}

export default new AIService();
