import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import LoadingIndicator from './LoadingIndicator';
import TermVideos from '../Common/TermVideos';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="space-y-4 mb-6 max-h-[70vh] overflow-y-auto pr-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`${
              message.relatedTerms?.length
                ? 'max-w-[95%] sm:max-w-[85%]'
                : 'max-w-[80%]'
            } rounded-lg p-4 ${
              message.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.isMedicalAdviceWarning && (
              <div className="mb-3 pb-3 border-b border-yellow-300 bg-yellow-50 -m-4 mb-3 p-4 rounded-t-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">
                      This appears to be a medical question
                    </p>
                    <p>
                      I can only provide educational information about terminology.
                      Please consult with a qualified healthcare professional for
                      medical advice.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.role === 'assistant' &&
              message.relatedTerms &&
              message.relatedTerms.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-4">
                  {message.relatedTerms.map((t) => (
                    <TermVideos
                      key={t.term}
                      termName={t.term}
                      videos={t.videos}
                      compact
                    />
                  ))}
                </div>
              )}

            <div
              className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
              }`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg p-4">
            <LoadingIndicator />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
