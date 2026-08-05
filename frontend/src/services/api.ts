import axios, { AxiosInstance } from 'axios';

// Use environment variable if set, otherwise:
// - In production (Vercel): use relative path to API
// - In development: use localhost
const getApiBaseUrl = () => {
  // Detect production environment - check multiple indicators
  // Use typeof window check to avoid SSR/build-time errors
  const isLocalhostHostname = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const isProduction = 
    import.meta.env.PROD || 
    import.meta.env.MODE === 'production' ||
    import.meta.env.VITE_VERCEL === '1' ||
    (typeof window !== 'undefined' && !isLocalhostHostname);
  
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // Log detection for debugging
  console.log('[API Config]', {
    PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
    VITE_VERCEL: import.meta.env.VITE_VERCEL,
    VITE_API_URL: envApiUrl,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    isLocalhostHostname,
    isProduction,
  });
  
  // If VITE_API_URL is set, validate it
  if (envApiUrl) {
    // Always ignore localhost URLs in production (even if set in env)
    const isLocalhost = envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1');
    
    if (isProduction && isLocalhost) {
      // Force relative path in production, ignore localhost from .env
      console.warn('[API Config] Ignoring localhost API URL in production, using relative path');
      return '/api/v1';
    }
    
    // Use the provided URL if it's valid for the current environment
    return envApiUrl;
  }
  
  // In production (Vercel), use relative path
  if (isProduction) {
    console.log('[API Config] Using production relative path: /api/v1');
    return '/api/v1';
  }
  
  // In development, use localhost
  console.log('[API Config] Using development localhost URL');
  return 'http://localhost:3004/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Log final API URL for debugging
console.log('[API Service] Final API Base URL:', API_BASE_URL);

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds - increased for OpenAI API response time
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
        // Enhance error object with better error messages
        if (error.response) {
          // Server responded with error status
          const errorData = error.response.data;
          const status = error.response.status;
          
          // Extract error message from response
          let errorMessage = error.message || 'An error occurred';
          
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
          
          // Create enhanced error with user-friendly message
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).response = error.response;
          (enhancedError as any).status = status;
          (enhancedError as any).data = errorData;
          
          console.error('API Error:', {
            status,
            message: errorMessage,
            data: errorData,
            url: error.config?.url,
          });
          
          return Promise.reject(enhancedError);
        } else if (error.request) {
          // Request made but no response received
          const baseURL = error.config?.baseURL || API_BASE_URL;
          const fullURL = error.config?.url ? `${baseURL}${error.config.url}` : baseURL;
          
          let errorMessage = 'Network error: Unable to reach the server.';
          
          // Provide more specific error messages based on the error
          if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
            errorMessage = `Cannot connect to backend server at ${baseURL}. Please ensure the backend server is running on port 3004.`;
          } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
            errorMessage = `Request timed out while connecting to ${baseURL}. The server may be slow or unreachable.`;
          } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
            errorMessage = `Cannot resolve server address. Please check that ${baseURL} is correct.`;
          } else {
            errorMessage = `Network error: Unable to reach the server at ${baseURL}. Please check:\n1. Backend server is running (check terminal)\n2. API URL is correct (currently: ${baseURL})\n3. No firewall blocking the connection`;
          }
          
          const networkError = new Error(errorMessage);
          (networkError as any).request = error.request;
          (networkError as any).isNetworkError = true;
          (networkError as any).baseURL = baseURL;
          (networkError as any).fullURL = fullURL;
          
          console.error('Network Error:', {
            message: error.message,
            code: error.code,
            url: fullURL,
            baseURL: baseURL,
            config: error.config,
          });
          
          return Promise.reject(networkError);
        } else {
          // Error setting up the request
          console.error('Request Setup Error:', error.message);
          return Promise.reject(error);
        }
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
  ): Promise<{
    response: string;
    isMedicalAdvice: boolean;
    foundTerms?: Array<{
      term: string;
      category: string;
      fullName?: string;
      videos?: Array<{ title: string; youtubeId: string; source?: string }>;
    }>;
  }> {
    const response = await this.client.post('/conversation', {
      message,
      history: conversationHistory,
    }, {
      timeout: 120000, // 120 seconds timeout for AI responses
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
    try {
      // Try /api/v1/health first (preferred endpoint)
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      // If that fails and we're in production, try root /health as fallback
      const isProduction = typeof window !== 'undefined' && 
        !window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1');
      
      if (isProduction && error?.response?.status === 404) {
        // Try root health endpoint as fallback
        try {
          const fallbackResponse = await axios.get('/api/health', {
            baseURL: window.location.origin,
            timeout: 10000,
          });
          return fallbackResponse.data;
        } catch (fallbackError) {
          // Re-throw original error if fallback also fails
          throw error;
        }
      }
      throw error;
    }
  }

  /**
   * Upload and analyze document
   */
  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);

    const response = await this.client.post('/document/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file upload
    });
    return response.data;
  }

  /**
   * Highlight terms in text
   */
  async highlightText(text: string): Promise<any> {
    const response = await this.client.post('/document/highlight', { text });
    return response.data;
  }

  /**
   * Get all terms from the knowledge base
   */
  async getAllTerms(): Promise<{ success: boolean; terms: any[]; count?: number }> {
    const response = await this.client.get('/query/terms');
    return response.data;
  }
}

export default new ApiService();
