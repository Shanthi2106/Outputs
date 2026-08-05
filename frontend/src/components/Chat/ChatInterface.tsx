import { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Message, SavedConversation } from '@/types';
import api from '@/services/api';
import useLocalStorage from '@/hooks/useLocalStorage';
import { exportConversationToPDF, exportConversationToText } from '@/utils/exportUtils';

interface ChatInterfaceProps {
  initialMessages?: Message[];
  conversationName?: string;
}

export default function ChatInterface({ initialMessages, conversationName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages || [
      {
        id: '1',
        role: 'assistant',
        content:
          "Hello! I'm here to help you understand autism-related terminology. You can ask me about specific terms, or paste an excerpt from a document (like an IEP or therapy notes) and I'll explain the terms within it. What would you like to know?",
        timestamp: new Date(),
      },
    ]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useLocalStorage<SavedConversation[]>(
    'saved-conversations',
    []
  );
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update messages when initialMessages prop changes (e.g., when loading a conversation)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    } else if (initialMessages === undefined) {
      // Reset to default welcome message when starting a new conversation
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content:
            "Hello! I'm here to help you understand autism-related terminology. You can ask me about specific terms, or paste an excerpt from a document (like an IEP or therapy notes) and I'll explain the terms within it. What would you like to know?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [initialMessages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare conversation history
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send message to API
      const response = await api.sendMessage(content, history);

      let relatedTerms =
        response.foundTerms && response.foundTerms.length > 0
          ? response.foundTerms.map((t) => ({
              term: t.term,
              videos: t.videos || [],
            }))
          : undefined;

      // Client fallback: if backend didn't attach terms/videos, match against glossary
      if (!relatedTerms?.length || !relatedTerms.some((t) => (t.videos?.length || 0) > 0)) {
        try {
          const termsData = await api.getAllTerms();
          const allTerms = termsData.terms || [];
          const lower = content.toLowerCase();
          const matched = allTerms.filter(
            (t: { term: string; fullName: string }) =>
              lower.includes(t.term.toLowerCase()) ||
              lower.includes(t.fullName.toLowerCase())
          );
          if (matched.length > 0) {
            relatedTerms = matched.map(
              (t: {
                term: string;
                videos?: Array<{ title: string; youtubeId: string; source?: string }>;
              }) => ({
                term: t.term,
                videos: t.videos || [],
              })
            );
          }
        } catch {
          // ignore fallback errors
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        isMedicalAdviceWarning: response.isMedicalAdvice,
        relatedTerms,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      // Extract actual error message from backend response
      let errorMessage = "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.";
      let isRateLimit = false;
      let retryAfter: number | null = null;
      
      // Check if it's a network error
      if (error?.isNetworkError) {
        // Network errors get special formatting
        errorMessage = `⚠️ **Connection Error**\n\n${error.message}\n\n**Troubleshooting Steps:**\n1. Ensure the backend server is running on port 3004 (check terminal)\n2. Verify the API URL in your frontend/.env file (should be: http://localhost:3004/api/v1)\n3. Check that port 3004 is not blocked by firewall\n4. Try refreshing the page\n5. Run quick-start-backend.bat to start the backend server`;
      } else {
        // Check for rate limit error (429)
        if (error?.response?.status === 429 || error?.status === 429) {
          isRateLimit = true;
          retryAfter = error?.response?.data?.retryAfter || error?.retryAfter || null;
          const retryMessage = retryAfter 
            ? `Please wait ${retryAfter} seconds before trying again.`
            : 'Please wait a moment before trying again.';
          errorMessage = `⏱️ **Rate Limit Exceeded**\n\nYou've made too many requests too quickly.\n\n${retryMessage}\n\n**Tip:** Try waiting a moment between questions, or ask multiple questions in a single message.`;
        } else {
          // Try to extract error message from different error response formats
          if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.message) {
            errorMessage = error.message;
          }
        }
      }

      // Log full error for debugging
      console.error('Error sending message:', {
        error,
        response: error?.response?.data,
        message: errorMessage,
        isNetworkError: error?.isNetworkError,
        baseURL: error?.baseURL,
        status: error?.response?.status,
        details: error?.response?.data?.details,
      });
      
      // If we have error details in development, show them
      if (error?.response?.data?.details && import.meta.env.DEV) {
        console.error('Error details:', error.response.data.details);
      }

      // Add error message to chat
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessageObj]);

      // If rate limited, set up auto-retry after the retry period
      if (isRateLimit && retryAfter) {
        // Auto-retry after the specified time
        setTimeout(() => {
          // User can manually retry, or we could auto-retry here
          // For now, just show a message that they can try again
        }, retryAfter * 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          "Hello! I'm here to help you understand autism-related terminology. What would you like to know?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleSaveConversation = () => {
    // Generate conversation name from first user message or use default
    const firstUserMessage = messages.find((msg) => msg.role === 'user');
    const name =
      conversationName ||
      (firstUserMessage
        ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : 'Untitled Conversation');

    const newConversation: SavedConversation = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: messages,
    };

    setConversations([...conversations, newConversation]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportPDF = () => {
    const name =
      conversationName ||
      messages.find((msg) => msg.role === 'user')?.content.slice(0, 30) ||
      'conversation';
    exportConversationToPDF(messages, name);
    setShowExportMenu(false);
  };

  const handleExportText = () => {
    const name =
      conversationName ||
      messages.find((msg) => msg.role === 'user')?.content.slice(0, 30) ||
      'conversation';
    exportConversationToText(messages, name);
    setShowExportMenu(false);
  };

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {conversationName || 'Ask Your Question'}
        </h2>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-sm text-green-600 mr-2">💾 Saved!</span>
          )}

          <button
            onClick={handleSaveConversation}
            className="btn-secondary text-sm"
            title="Save this conversation"
          >
            💾 Save
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-secondary text-sm"
              title="Export conversation"
            >
              📤 Export
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  📄 Export as PDF
                </button>
                <button
                  onClick={handleExportText}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                >
                  📝 Export as Text
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
            title="Reset conversation"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
