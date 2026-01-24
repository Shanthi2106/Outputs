import { useState, useEffect } from 'react';
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import Disclaimer from './components/Common/Disclaimer';
import ChatInterface from './components/Chat/ChatInterface';
import TabNavigation from './components/Layout/TabNavigation';
import DocumentUpload from './components/Document/DocumentUpload';
import TermBrowser from './components/TermBrowser/TermBrowser';
import ConversationManager from './components/Conversation/ConversationManager';
import { SavedConversation } from './types';
import api from './services/api';

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'upload' | 'browse' | 'saved'>('chat');
  const [loadedConversation, setLoadedConversation] = useState<SavedConversation | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check backend connection with retry logic
  const checkBackend = async (isRetry: boolean = false) => {
    if (!isRetry) {
      setBackendStatus('checking');
    }
    
    try {
      await api.healthCheck();
      setBackendStatus('connected');
      setRetryCount(0);
      setErrorMessage(null);
      setLastCheckTime(new Date());
    } catch (error: any) {
      console.error('Backend health check failed:', error);
      setBackendStatus('disconnected');
      setLastCheckTime(new Date());
      
      // Extract error message
      if (error?.isNetworkError) {
        setErrorMessage(error.message || 'Unable to reach the backend server');
      } else if (error?.response?.status === 503) {
        setErrorMessage('Backend server is not ready. Please wait a moment and try again.');
      } else {
        setErrorMessage('Backend server is not responding. Please check if it is running.');
      }
      
      // Increment retry count for automatic retries
      if (!isRetry) {
        setRetryCount(prev => prev + 1);
      }
    }
  };

  // Initial check and automatic retry with exponential backoff
  useEffect(() => {
    checkBackend();

    // Retry logic with exponential backoff (max 5 retries)
    let retryTimeout: NodeJS.Timeout;
    if (retryCount > 0 && retryCount <= 5 && backendStatus === 'disconnected') {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000); // 1s, 2s, 4s, 8s, 16s, max 30s
      retryTimeout = setTimeout(() => {
        checkBackend(true);
      }, delay);
    }

    // Periodic health check every 30 seconds when connected
    const interval = setInterval(() => {
      if (backendStatus === 'connected') {
        checkBackend(true);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [retryCount, backendStatus]);

  const handleLoadConversation = (conversation: SavedConversation) => {
    setLoadedConversation(conversation);
    setActiveTab('chat');
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'chat' | 'upload' | 'browse' | 'saved');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
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
              {backendStatus === 'disconnected' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-2xl mx-auto">
                  <p className="text-red-800 font-semibold mb-2">⚠️ Backend Server Not Connected</p>
                  
                  {errorMessage && (
                    <p className="text-red-700 text-sm mb-3 font-medium">
                      {errorMessage}
                    </p>
                  )}
                  
                  <p className="text-red-700 text-sm mb-2">
                    Please ensure:
                  </p>
                  <ul className="text-red-700 text-sm list-disc list-inside space-y-1 mb-3">
                    <li>Backend server is running (check terminal for <code className="bg-red-100 px-1 rounded">npm run dev</code> in backend folder)</li>
                    <li>Server is running on port 3004</li>
                    <li>API URL is correct in <code className="bg-red-100 px-1 rounded">frontend/.env</code> (should be: http://localhost:3004/api/v1)</li>
                    <li>No firewall is blocking the connection</li>
                  </ul>
                  
                  {lastCheckTime && (
                    <p className="text-red-600 text-xs mb-3">
                      Last checked: {lastCheckTime.toLocaleTimeString()}
                      {retryCount > 0 && ` (Retry attempt ${retryCount}/5)`}
                    </p>
                  )}
                  
                  <button
                    onClick={() => {
                      setRetryCount(0);
                      checkBackend();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    🔄 Retry Connection
                  </button>
                </div>
              )}
              {backendStatus === 'checking' && (
                <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                  Checking backend connection...
                </div>
              )}
            </div>

            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="mt-6">
              {activeTab === 'chat' && (
                <ChatInterface
                  key={loadedConversation?.id || 'new'}
                  initialMessages={loadedConversation?.messages}
                  conversationName={loadedConversation?.name}
                />
              )}

              {activeTab === 'upload' && <DocumentUpload />}

              {activeTab === 'browse' && <TermBrowser />}

              {activeTab === 'saved' && (
                <ConversationManager onLoadConversation={handleLoadConversation} />
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
