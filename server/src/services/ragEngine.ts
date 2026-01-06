/**
 * RAG Engine Service for PharmaRAG
 * Retrieval-Augmented Generation pipeline with multi-provider support
 * Supports: Gemini (Google) and Deepseek (OpenAI-compatible API)
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import OpenAI from 'openai';
import { config } from '../config/index';
import { Message, Source, ChatResponse } from '../types/index';
import * as vectorStore from './vectorStore';
import { SYSTEM_PROMPT, NO_DOCUMENTS_MESSAGE, DISCLAIMER } from '../prompts/systemPrompt';

// LLM instances
let geminiInstance: ChatGoogleGenerativeAI | null = null;
let deepseekInstance: OpenAI | null = null;

/**
 * Get Gemini LLM instance
 */
function getGeminiLLM(): ChatGoogleGenerativeAI {
  if (!geminiInstance) {
    if (!config.googleApiKey) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }
    
    geminiInstance = new ChatGoogleGenerativeAI({
      apiKey: config.googleApiKey,
      modelName: 'gemini-3-flash',
      temperature: 0.3,
      maxOutputTokens: 2048,
    });
  }
  return geminiInstance;
}

/**
 * Get Deepseek client (OpenAI-compatible API)
 */
function getDeepseekClient(): OpenAI {
  if (!deepseekInstance) {
    if (!config.deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }
    
    deepseekInstance = new OpenAI({
      apiKey: config.deepseekApiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return deepseekInstance;
}

/**
 * Call LLM with the specified provider
 */
async function callLLM(systemPrompt: string, userQuestion: string): Promise<string> {
  if (config.aiProvider === 'deepseek') {
    // Use Deepseek API
    const client = getDeepseekClient();
    
    console.log(`  🤖 Using Deepseek (deepseek-chat)`);
    
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuestion },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });
    
    return response.choices[0]?.message?.content || '';
  } else {
    // Use Gemini API (default)
    const llm = getGeminiLLM();
    
    console.log(`  🤖 Using Gemini (gemini-3-flash)`);
    
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userQuestion),
    ]);
    
    return typeof response.content === 'string' 
      ? response.content 
      : JSON.stringify(response.content);
  }
}

/**
 * Query the RAG engine with a question and conversation history
 */
export async function query(
  question: string,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  console.log(`🔍 RAG Query: "${question}"`);
  console.log(`  📡 AI Provider: ${config.aiProvider.toUpperCase()}`);
  
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
  
  // Step 6: Call LLM based on provider
  try {
    const answer = await callLLM(promptText, question);
    
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
    throw new Error(`Failed to generate response from ${config.aiProvider.toUpperCase()} AI service`);
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
