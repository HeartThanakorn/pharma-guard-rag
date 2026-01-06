/**
 * useChat Hook
 * Manages chat state and message handling
 */

import { useState, useCallback } from 'react';
import type { Message } from '../types';
import { sendMessage as sendMessageApi } from '../services/api';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (question: string) => Promise<void>;
  clearChat: () => void;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Welcome to PharmaRAG!

I'm your pharmaceutical information assistant. Upload a drug leaflet PDF and ask me questions about:
• Drug interactions
• Dosage information
• Side effects
• Safety warnings

I'll provide answers based only on your uploaded documents.`,
  timestamp: new Date(),
};

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    // Get current messages for context (excluding welcome message)
    const currentMessages = messages.filter((m) => m.id !== 'welcome');

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    // Remove welcome message when first real message is sent
    setMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== 'welcome');
      return [...filtered, userMessage];
    });
    setIsLoading(true);
    setError(null);

    try {
      // Send last 10 messages (5 turns) for context
      const history = currentMessages.slice(-10);
      const response = await sendMessageApi(question.trim(), history);

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);

      // Add error message as assistant response
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ ${errorMsg}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
