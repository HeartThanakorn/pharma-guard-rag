/**
 * ChatInterface Component
 * Main chat UI with message list, input, and controls
 */

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import type { Message } from '../types';
import { sendMessage } from '../services/api';
import MessageBubble from './MessageBubble';
import LoadingSpinner from './LoadingSpinner';

interface ChatInterfaceProps {
  hasDocuments: boolean;
}

const WELCOME_MESSAGE = `👋 Welcome to PharmaRAG!

I'm your pharmaceutical information assistant. Upload a drug leaflet PDF and ask me questions about:
• Drug interactions
• Dosage information
• Side effects
• Safety warnings

I'll provide answers based only on your uploaded documents.`;

const ChatInterface = ({ hasDocuments }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();

    const question = inputValue.trim();
    if (!question || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get last 5 messages for context (excluding current)
      const history = messages.slice(-10);
      const response = await sendMessage(question, history);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">💬 Chat</h2>
        {messages.length > 0 && (
          <button
            onClick={handleNewChat}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            🔄 New Chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Empty/Welcome state */}
        {messages.length === 0 && (
          <div className="bg-blue-50 rounded-lg p-4 text-blue-800">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {WELCOME_MESSAGE}
            </pre>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.role === 'user'}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg px-4 py-3 rounded-bl-none">
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-gray-500 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        {!hasDocuments && (
          <div className="mb-3 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
            ⚠️ Upload a PDF document first to start asking questions.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasDocuments
                ? 'Ask a question about your documents...'
                : 'Upload a document to start chatting...'
            }
            disabled={!hasDocuments || isLoading}
            rows={2}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!hasDocuments || isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
        
        {/* Footer Disclaimer */}
        <div className="mt-2 text-center">
            <p className="text-[10px] text-gray-400">
              ⚠️ AI can make mistakes. Please consult a doctor.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
