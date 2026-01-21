export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Autism Parent Assistant
              </h1>
              <p className="text-sm text-gray-500">Educational Resource</p>
            </div>
          </div>

          {/* Navigation links removed - will be added when content sections are created */}
        </div>
      </div>
    </header>
  );
}
