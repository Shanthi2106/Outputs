import { formatFileSize } from '@/utils/exportUtils';

interface DocumentAnalysisProps {
  analysis: any;
  onReset: () => void;
}

export default function DocumentAnalysis({ analysis, onReset }: DocumentAnalysisProps) {
  const report = analysis.consolidatedReport;

  return (
    <div className="space-y-6">
      {/* Consolidated Test Result Report Header */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              📊 Consolidated Test Result Report
            </h1>
            <p className="text-lg text-primary-700 font-semibold mb-1">
              {report?.documentType || 'Autism-Related Document'}
            </p>
            <p className="text-gray-600">
              {analysis.fileName} • {formatFileSize(analysis.fileSize)} • {analysis.wordCount} words
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Analysis Date: {report?.dateAnalyzed || new Date().toLocaleDateString()}
            </p>
          </div>
          <button onClick={onReset} className="btn-secondary">
            📤 Upload Another
          </button>
        </div>
      </div>

      {/* Autism Terms Found - PRIMARY SECTION */}
      {analysis.foundTerms && analysis.foundTerms.length > 0 && (
        <div className="card border-l-4 border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50">
          <h2 className="text-2xl font-bold text-primary-900 mb-4 flex items-center">
            <span className="text-3xl mr-3">📚</span>
            Autism Terms Found in Your Document ({analysis.foundTerms.length})
          </h2>
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-base leading-relaxed mb-2">
              <span className="font-bold text-blue-900">We found {analysis.foundTerms.length} autism-related {analysis.foundTerms.length === 1 ? 'term' : 'terms'}</span> in your document.
              Each term below includes:
            </p>
            <ul className="ml-6 space-y-1 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">💡</span>
                <span><strong>What it means for YOUR child</strong> - Based on how it's used in your document</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✨</span>
                <span><strong>Real examples</strong> - Practical scenarios you'll encounter</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">🔗</span>
                <span><strong>Related terms</strong> - Other concepts to learn about</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            {analysis.foundTerms.map((termData: any, index: number) => (
              <div
                key={index}
                className="bg-white border-2 border-primary-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary-900">
                      {termData.term.term}
                    </h3>
                    <p className="text-sm text-primary-700 font-semibold">
                      {termData.term.fullName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Category: {termData.term.category} • Found {termData.occurrences} {termData.occurrences === 1 ? 'time' : 'times'}
                    </p>
                  </div>
                  <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                    {termData.occurrences}x
                  </span>
                </div>

                {/* Contextual Meaning - What it means in THIS document */}
                {termData.contextualMeaning && (
                  <div className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg shadow-sm">
                    <div className="flex items-start mb-3">
                      <span className="text-3xl mr-3">💡</span>
                      <h4 className="text-xl font-bold text-blue-900">
                        What This Means for Your Child
                      </h4>
                    </div>
                    <div className="prose prose-blue max-w-none">
                      {termData.contextualMeaning.split('\n\n').map((paragraph: string, idx: number) => (
                        <p key={idx} className="text-gray-800 leading-relaxed mb-3 text-base">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {termData.term.examples && termData.term.examples.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="flex items-start mb-2">
                      <span className="text-2xl mr-2">✨</span>
                      <h4 className="text-lg font-bold text-green-900">Real-World Examples</h4>
                    </div>
                    <p className="text-sm text-green-800 mb-3">
                      Here are practical scenarios where you'll see {termData.term.term} in action:
                    </p>
                    <ul className="space-y-3">
                      {termData.term.examples.map((example: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-600 font-bold mr-3 mt-0.5">{i + 1}.</span>
                          <span className="text-gray-800 text-base">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Terms */}
                {termData.term.relatedTerms && termData.term.relatedTerms.length > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start mb-2">
                      <span className="text-xl mr-2">🔗</span>
                      <h4 className="text-base font-bold text-purple-900">Related Terms to Learn About</h4>
                    </div>
                    <p className="text-sm text-purple-800 mb-2">
                      Understanding these related terms will give you a more complete picture:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {termData.term.relatedTerms.map((relatedTerm: string, idx: number) => (
                        <span key={idx} className="bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-sm font-semibold">
                          {relatedTerm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Types where this term appears */}
                {termData.term.documentTypes && termData.term.documentTypes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">You'll typically see {termData.term.term} in:</span> {termData.term.documentTypes.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Natural Language Report */}
      {report?.narrativeReport && (
        <div className="card border-l-4 border-indigo-500">
          <details className="group">
            <summary className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 flex items-center">
              <span className="text-2xl mr-2">📄</span>
              Detailed Analysis Report
              <span className="ml-2 text-sm text-gray-500">(Click to expand)</span>
            </summary>
            <div className="mt-4 prose prose-lg max-w-none">
              {report.narrativeReport.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="text-gray-800 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Key Findings - Collapsible */}
      {report?.keyFindings && report.keyFindings.length > 0 && (
        <div className="card border-l-4 border-green-500">
          <details className="group">
            <summary className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 flex items-center">
              <span className="text-2xl mr-2">✅</span>
              Key Findings
              <span className="ml-2 text-sm text-gray-500">(Click to expand)</span>
            </summary>
            <ul className="space-y-3 mt-4">
              {report.keyFindings.map((finding: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 font-bold mr-3 mt-1">{index + 1}.</span>
                  <p className="text-gray-800 text-lg">{finding}</p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Term Breakdown - Collapsible */}
      {report?.termBreakdown && report.termBreakdown.length > 0 && (
        <div className="card border-l-4 border-blue-500">
          <details className="group">
            <summary className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              AI Analysis - Term Breakdown & Significance
              <span className="ml-2 text-sm text-gray-500">(Click to expand)</span>
            </summary>
            <div className="space-y-4 mt-4">
              {report.termBreakdown.map((item: any, index: number) => (
                <div
                  key={index}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">
                        {item.term}
                      </h3>
                      <p className="text-sm text-blue-700">
                        Category: {item.category} • Found {item.count} {item.count === 1 ? 'time' : 'times'}
                      </p>
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {item.count}x
                    </span>
                  </div>
                  <p className="text-gray-800 mt-2">
                    <span className="font-semibold">Significance:</span> {item.significance}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Recommendations - Collapsible */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <div className="card border-l-4 border-purple-500 bg-purple-50">
          <details className="group">
            <summary className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 flex items-center">
              <span className="text-2xl mr-2">💡</span>
              AI Recommendations
              <span className="ml-2 text-sm text-gray-500">(Click to expand)</span>
            </summary>
            <ul className="space-y-3 mt-4">
              {report.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="flex items-start bg-white rounded-lg p-3 border border-purple-200">
                  <span className="text-purple-600 font-bold mr-3">•</span>
                  <p className="text-gray-800">{recommendation}</p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Overall Assessment - Collapsible */}
      {report?.overallAssessment && (
        <div className="card border-l-4 border-indigo-500 bg-indigo-50">
          <details className="group">
            <summary className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              AI Overall Assessment
              <span className="ml-2 text-sm text-gray-500">(Click to expand)</span>
            </summary>
            <p className="text-gray-800 text-lg leading-relaxed mt-4">
              {report.overallAssessment}
            </p>
          </details>
        </div>
      )}

      {/* Original Summary (Collapsible) */}
      <div className="card border-t-4 border-gray-300">
        <details className="group">
          <summary className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 flex items-center">
            <span className="text-2xl mr-2">📝</span>
            Quick Summary
            <span className="ml-2 text-sm text-gray-500">(Click to expand)</span>
          </summary>
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">{analysis.summary}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Term Analysis</h4>
              <p className="text-purple-800">{analysis.analysis}</p>
            </div>
          </div>
        </details>
      </div>


      {/* Footer Note */}
      <div className="card bg-yellow-50 border-2 border-yellow-300">
        <div className="flex items-start">
          <span className="text-3xl mr-3">ℹ️</span>
          <div>
            <h3 className="font-bold text-yellow-900 mb-1">Important Note</h3>
            <p className="text-yellow-800 text-sm">
              This automated analysis is provided for informational purposes only.
              Always consult with your child's healthcare providers, therapists, and educators
              for professional guidance and interpretation of test results and documentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
