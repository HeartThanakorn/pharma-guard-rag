/**
 * RAG Engine Service for PharmaRAG
 * Retrieval-Augmented Generation pipeline using Google Gemini
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../config/index';
import { Message, Source, ChatResponse } from '../types/index';
import * as vectorStore from './vectorStore';
import { SYSTEM_PROMPT, NO_DOCUMENTS_MESSAGE, DISCLAIMER } from '../prompts/systemPrompt';

// Initialize Gemini LLM
let llmInstance: ChatGoogleGenerativeAI | null = null;

function getLLM(): ChatGoogleGenerativeAI {
  if (!llmInstance) {
    if (!config.googleApiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }
    
    llmInstance = new ChatGoogleGenerativeAI({
      apiKey: config.googleApiKey,
      modelName: 'gemini-2.0-flash',
      temperature: 0.3, // Lower temperature for more factual responses
      maxOutputTokens: 2048,
    });
  }
  return llmInstance;
}

/**
 * Query the RAG engine with a question and conversation history
 */
export async function query(
  question: string,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  console.log(`🔍 RAG Query: "${question}"`);
  
  // Step 1: Perform similarity search to find relevant chunks
  const relevantDocs = await vectorStore.similaritySearch(question, 4);
  
  console.log(`  📚 Found ${relevantDocs.length} relevant chunks`);
  
  // Step 2: Handle case when no relevant documents found
  if (relevantDocs.length === 0) {
    return {
      answer: NO_DOCUMENTS_MESSAGE,
      sources: [],
      disclaimer: DISCLAIMER,
    };
  }
  
  // Step 3: Format context from retrieved chunks
  const context = formatContext(relevantDocs);
  
  // Step 4: Format conversation history (last 5 turns)
  const history = formatHistory(conversationHistory.slice(-10)); // 5 turns = 10 messages
  
  // Step 5: Build prompt using template
  const promptText = SYSTEM_PROMPT
    .replace('{context}', context)
    .replace('{history}', history || 'No previous conversation.')
    .replace('{question}', question);
  
  // Step 6: Call LLM
  const llm = getLLM();
  
  try {
    const response = await llm.invoke([
      new SystemMessage(promptText),
      new HumanMessage(question),
    ]);
    
    const answer = typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
    
    // Step 7: Extract sources from retrieved chunks
    const sources = extractSources(relevantDocs);
    
    console.log(`  ✅ Generated response with ${sources.length} sources`);
    
    return {
      answer,
      sources,
      disclaimer: DISCLAIMER,
    };
  } catch (error) {
    console.error('LLM Error:', error);
    throw new Error('Failed to generate response from AI service');
  }
}

/**
 * Format retrieved documents into context string
 */
function formatContext(docs: any[]): string {
  return docs.map((doc, index) => {
    const source = doc.metadata?.source || 'Unknown Document';
    const page = doc.metadata?.page || 1;
    return `[Document ${index + 1}: ${source}, Page ${page}]
${doc.pageContent}
---`;
  }).join('\n\n');
}

/**
 * Format conversation history
 */
function formatHistory(messages: Message[]): string {
  if (messages.length === 0) return '';
  
  return messages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n');
}

/**
 * Extract unique sources from documents
 */
function extractSources(docs: any[]): Source[] {
  const sourceMap = new Map<string, Source>();
  
  docs.forEach(doc => {
    const source = doc.metadata?.source || 'Unknown';
    const page = doc.metadata?.page || 1;
    const key = `${source}-${page}`;
    
    if (!sourceMap.has(key)) {
      sourceMap.set(key, { document: source, page });
    }
  });
  
  return Array.from(sourceMap.values());
}
