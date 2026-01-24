import { useState } from 'react';
import { SavedConversation } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { exportConversationToPDF, exportConversationToText } from '@/utils/exportUtils';

interface ConversationManagerProps {
  onLoadConversation: (conversation: SavedConversation) => void;
}

export default function ConversationManager({ onLoadConversation }: ConversationManagerProps) {
  const [conversations, setConversations] = useLocalStorage<SavedConversation[]>(
    'saved-conversations',
    []
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Deserialize dates from localStorage (they're stored as strings)
  const deserializeConversation = (conv: SavedConversation): SavedConversation => {
    return {
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    };
  };

  const handleDelete = (id: string) => {
    setConversations(conversations.filter((conv) => conv.id !== id));
    setDeleteConfirm(null);
  };

  const handleExportPDF = (conversation: SavedConversation) => {
    exportConversationToPDF(conversation.messages, conversation.name);
  };

  const handleExportText = (conversation: SavedConversation) => {
    exportConversationToText(conversation.messages, conversation.name);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          My Conversations
        </h2>
        <p className="text-gray-600">
          View, load, export, or delete your saved conversations.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💾</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Saved Conversations Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Save conversations from the Chat tab to access them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const deserializedConv = deserializeConversation(conversation);
            return (
            <div key={conversation.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {deserializedConv.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {deserializedConv.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {deserializedConv.messages.length} messages
                    {deserializedConv.termsMentioned && deserializedConv.termsMentioned.length > 0 && (
                      <span> • Terms: {deserializedConv.termsMentioned.join(', ')}</span>
                    )}
                  </p>
                </div>

                {deleteConfirm === deserializedConv.id ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-600">Delete?</span>
                    <button
                      onClick={() => handleDelete(deserializedConv.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(deserializedConv.id)}
                    className="text-red-600 hover:text-red-700 text-2xl leading-none"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Preview of first message */}
              {deserializedConv.messages.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {deserializedConv.messages[0].content}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onLoadConversation(deserializedConv)}
                  className="btn-primary"
                >
                  📖 Load Conversation
                </button>
                <button
                  onClick={() => handleExportPDF(deserializedConv)}
                  className="btn-secondary"
                >
                  📄 Export PDF
                </button>
                <button
                  onClick={() => handleExportText(deserializedConv)}
                  className="btn-secondary"
                >
                  📝 Export Text
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
