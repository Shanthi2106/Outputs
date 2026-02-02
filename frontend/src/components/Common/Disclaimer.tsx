interface DisclaimerProps {
  onAccept: () => void;
}

export default function Disclaimer({ onAccept }: DisclaimerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90dvh] flex flex-col my-auto min-h-0">
        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              Welcome to the Autism Parent Assistant
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Please read and accept these important guidelines before using this tool.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 text-gray-700 mb-4 sm:mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4">
              <h3 className="font-semibold mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
                <span className="mr-2 shrink-0">ℹ️</span>
                Educational Purpose Only
              </h3>
              <p className="text-xs sm:text-sm">
                This tool provides plain-language explanations of autism-related
                terminology to help you understand documents like IEPs, therapy notes,
                and assessment reports.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4">
              <h3 className="font-semibold mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
                <span className="mr-2 shrink-0">⚠️</span>
                Not Medical Advice
              </h3>
              <p className="text-xs sm:text-sm">
                This assistant does NOT provide medical advice, diagnosis, or
                treatment recommendations. Always consult with qualified healthcare
                professionals for medical guidance regarding your child.
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4">
              <h3 className="font-semibold mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
                <span className="mr-2 shrink-0">🔒</span>
                Privacy & Confidentiality
              </h3>
              <p className="text-xs sm:text-sm">
                We do not store your conversations or any personal information. Each
                session is private and temporary. However, avoid sharing sensitive
                personal or medical details.
              </p>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 sm:p-4">
              <h3 className="font-semibold mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
                <span className="mr-2 shrink-0">💬</span>
                How to Use
              </h3>
              <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside">
                <li>Ask about autism-related terms you don't understand</li>
                <li>Paste excerpts from documents for contextual explanations</li>
                <li>Ask follow-up questions for clarification</li>
                <li>Request simpler explanations if needed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sticky button area - always visible on mobile */}
        <div className="flex-shrink-0 flex justify-center p-4 sm:p-6 md:p-8 pt-0 border-t border-gray-100 bg-white rounded-b-lg">
          <button
            onClick={onAccept}
            className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            I Understand - Continue
          </button>
        </div>
      </div>
    </div>
  );
}
