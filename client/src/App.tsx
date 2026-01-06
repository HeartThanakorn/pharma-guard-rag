/**
 * PharmaRAG Main Application
 * Two-column layout with sidebar (documents) and main (chat)
 */

import { useState } from 'react';
import DisclaimerBanner from './components/DisclaimerBanner';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import ChatInterface from './components/ChatInterface';
import { useDocuments } from './hooks/useDocuments';

function App() {
  const {
    documents,
    totalChunks,
    isLoading: isLoadingDocs,
    fetchDocuments,
  } = useDocuments();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasDocuments = documents.length > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Disclaimer Banner - Fixed at top */}
      <DisclaimerBanner />

      {/* Main content with padding for fixed banner */}
      <div className="pt-14">
        {/* Header */}
        <header className="bg-blue-600 text-white py-4 px-6 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">💊 PharmaRAG</h1>
              <p className="text-blue-100 text-sm">
                AI-Powered Drug Information Assistant
              </p>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-xl">{sidebarOpen ? '✕' : '📄'}</span>
            </button>
          </div>
        </header>

        {/* Main layout */}
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Documents section */}
            <aside
              className={`
                lg:w-80 lg:flex-shrink-0
                ${sidebarOpen ? 'block' : 'hidden lg:block'}
              `}
            >
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 className="font-semibold text-gray-700 mb-4">
                  📤 Upload Document
                </h2>
                <FileUpload onUploadComplete={fetchDocuments} />
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <DocumentList
                  documents={documents}
                  totalChunks={totalChunks}
                  isLoading={isLoadingDocs}
                  onDocumentDeleted={fetchDocuments}
                />
              </div>
            </aside>

            {/* Main content - Chat section */}
            <section className="flex-1 min-h-[600px]">
              <ChatInterface hasDocuments={hasDocuments} />
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-400 py-4 px-6 mt-8">
          <div className="container mx-auto text-center text-sm">
            <p>
              PharmaRAG © 2025 • AI-powered pharmaceutical information assistant
            </p>
            <p className="mt-1 text-xs">
              Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
