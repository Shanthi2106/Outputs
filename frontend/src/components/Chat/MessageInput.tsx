import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex flex-col space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question or paste a document excerpt here..."
          disabled={disabled}
          className="input-field resize-none"
          rows={3}
          aria-label="Message input"
        />

        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>

          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tips:</strong> You can ask about specific terms like "What
          is echolalia?" or paste a section from your child's IEP or therapy notes
          for contextual explanations.
        </p>
      </div>
    </div>
  );
}
