export interface TermVideo {
  title: string;
  youtubeId: string;
  source?: string;
}

export interface Term {
  term: string;
  fullName: string;
  category: string;
  definition: string;
  plainLanguage: string;
  examples: string[];
  relatedTerms: string[];
  documentTypes: string[];
  videos?: TermVideo[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isMedicalAdviceWarning?: boolean;
  /** Glossary terms detected in the user question, with optional educational videos */
  relatedTerms?: Array<{
    term: string;
    videos?: TermVideo[];
  }>;
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

export interface SavedConversation {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  termsMentioned?: string[];
}
