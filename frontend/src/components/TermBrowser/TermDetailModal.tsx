import { useEffect } from 'react';
import { Term } from '@/types';

interface TermDetailModalProps {
  term: Term;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  Therapy: 'bg-green-100 text-green-800 border-green-200',
  Education: 'bg-blue-100 text-blue-800 border-blue-200',
  Communication: 'bg-purple-100 text-purple-800 border-purple-200',
  Sensory: 'bg-orange-100 text-orange-800 border-orange-200',
  Behavior: 'bg-red-100 text-red-800 border-red-200',
  Social: 'bg-pink-100 text-pink-800 border-pink-200',
  Cognitive: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export default function TermDetailModal({ term, onClose }: TermDetailModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[term.category] || 'bg-gray-100 text-gray-800'} border mb-3`}>
                {term.category}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {term.term}
              </h2>
              <p className="text-lg text-gray-600">
                {term.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Plain Language Explanation */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <span className="text-xl mr-2">💬</span>
              Plain Language Explanation
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {term.plainLanguage}
            </p>
          </div>

          {/* Examples */}
          {term.examples && term.examples.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="text-xl mr-2">💡</span>
                Examples
              </h3>
              <ul className="space-y-2">
                {term.examples.map((example, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-blue-800">{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Terms */}
          {term.relatedTerms && term.relatedTerms.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">🔗</span>
                Related Terms
              </h3>
              <div className="flex flex-wrap gap-2">
                {term.relatedTerms.map((relatedTerm, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {relatedTerm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Document Types */}
          {term.documentTypes && term.documentTypes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">📄</span>
                Where You Might See This
              </h3>
              <div className="flex flex-wrap gap-2">
                {term.documentTypes.map((docType, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm border border-purple-200"
                  >
                    {docType}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technical Definition */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <span className="text-xl mr-2">📖</span>
              Technical Definition
            </h3>
            <p className="text-gray-700 text-sm">
              {term.definition}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
