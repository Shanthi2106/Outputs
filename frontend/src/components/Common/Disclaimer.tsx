interface DisclaimerProps {
  onAccept: () => void;
}

export default function Disclaimer({ onAccept }: DisclaimerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to the Autism Parent Assistant
          </h2>
          <p className="text-gray-600">
            Please read and accept these important guidelines before using this tool.
          </p>
        </div>

        <div className="space-y-4 mb-8 text-gray-700">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              Educational Purpose Only
            </h3>
            <p className="text-sm">
              This tool provides plain-language explanations of autism-related
              terminology to help you understand documents like IEPs, therapy notes,
              and assessment reports.
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">⚠️</span>
              Not Medical Advice
            </h3>
            <p className="text-sm">
              This assistant does NOT provide medical advice, diagnosis, or
              treatment recommendations. Always consult with qualified healthcare
              professionals for medical guidance regarding your child.
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">🔒</span>
              Privacy & Confidentiality
            </h3>
            <p className="text-sm">
              We do not store your conversations or any personal information. Each
              session is private and temporary. However, avoid sharing sensitive
              personal or medical details.
            </p>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
            <h3 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">💬</span>
              How to Use
            </h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Ask about autism-related terms you don't understand</li>
              <li>Paste excerpts from documents for contextual explanations</li>
              <li>Ask follow-up questions for clarification</li>
              <li>Request simpler explanations if needed</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onAccept}
            className="btn-primary text-lg px-8 py-3"
          >
            I Understand - Continue
          </button>
        </div>
      </div>
    </div>
  );
}
