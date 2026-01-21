import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Query a term explanation
   */
  async queryTerm(term: string): Promise<{ explanation: string }> {
    const response = await this.client.post('/query/term', { term });
    return response.data;
  }

  /**
   * Query with context from a document
   */
  async queryWithContext(
    term: string,
    context: string
  ): Promise<{ explanation: string }> {
    const response = await this.client.post('/query/context', {
      term,
      context,
    });
    return response.data;
  }

  /**
   * Send a conversational message
   */
  async sendMessage(
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<{ response: string; isMedicalAdvice: boolean }> {
    const response = await this.client.post('/conversation', {
      message,
      history: conversationHistory,
    });
    return response.data;
  }

  /**
   * Submit feedback
   */
  async submitFeedback(
    rating: number,
    comment?: string
  ): Promise<{ success: boolean }> {
    const response = await this.client.post('/feedback', {
      rating,
      comment,
    });
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export default new ApiService();
