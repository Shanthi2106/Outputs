import { useState } from 'react';
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import Disclaimer from './components/Common/Disclaimer';
import ChatInterface from './components/Chat/ChatInterface';

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {showDisclaimer && (
          <Disclaimer onAccept={() => setShowDisclaimer(false)} />
        )}

        {!showDisclaimer && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Autism Terminology Assistant
              </h1>
              <p className="text-gray-600">
                Understanding autism-related terms in plain language
              </p>
            </div>

            <ChatInterface />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
