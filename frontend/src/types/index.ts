export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isMedicalAdviceWarning?: boolean;
}

export interface ConversationHistory {
  role: 'user' | 'assistant';
  content: string;
}

export interface TermExplanation {
  term: string;
  explanation: string;
  relatedTerms?: string[];
}

export interface FeedbackData {
  rating: number;
  comment?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
