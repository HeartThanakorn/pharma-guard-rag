# Design Document: PharmaRAG

## Overview

PharmaRAG is a RAG-based pharmaceutical Q&A system built as a monorepo with separate `/server` (Node.js/Express) and `/client` (React/Vite) applications. The system processes PDF drug leaflets, generates embeddings, stores them in an in-memory vector database, and uses Google Gemini 3 Flash (or Deepseek as alternative) to answer user questions strictly based on uploaded documents.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PharmaRAG System                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐         ┌──────────────────────────────────────┐  │
│  │   React Frontend     │         │         Node.js Backend              │  │
│  │   (Vite + Tailwind)  │  HTTP   │         (Express.js)                 │  │
│  │                      │◄───────►│                                      │  │
│  │  • ChatInterface     │         │  ┌─────────────────────────────────┐ │  │
│  │  • FileUpload        │         │  │     Document Processor          │ │  │
│  │  • DocumentList      │         │  │  • pdf-parse (text extraction)  │ │  │
│  │                      │         │  │  • RecursiveCharacterSplitter   │ │  │
│  └──────────────────────┘         │  └─────────────────────────────────┘ │  │
│                                   │                 │                     │  │
│                                   │                 ▼                     │  │
│                                   │  ┌─────────────────────────────────┐ │  │
│                                   │  │     Embedding Service           │ │  │
│                                   │  │  • GoogleGenerativeAIEmbeddings │ │  │
│                                   │  └─────────────────────────────────┘ │  │
│                                   │                 │                     │  │
│                                   │                 ▼                     │  │
│                                   │  ┌─────────────────────────────────┐ │  │
│                                   │  │     Vector Store (HNSWLib)      │ │  │
│                                   │  │  • In-memory storage            │ │  │
│                                   │  │  • Similarity search            │ │  │
│                                   │  └─────────────────────────────────┘ │  │
│                                   │                 │                     │  │
│                                   │                 ▼                     │  │
│                                   │  ┌─────────────────────────────────┐ │  │
│                                   │  │     RAG Engine                  │ │  │
│                                   │  │  • Multi-Provider Support       │ │  │
│                                   │  │  • Deepseek (Chat)              │ │  │
│                                   │  │  • Gemini (Embeddings/Chat)     │ │  │
│                                   │  └─────────────────────────────────┘ │  │
│                                   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
PDF Upload Flow:
================
[User] → [Upload PDF] → [Express /api/upload]
                              │
                              ▼
                    [pdf-parse: Extract Text + Page Numbers]
                              │
                              ▼
                    [RecursiveCharacterTextSplitter]
                    [1000 chars, 200 overlap]
                              │
                              ▼
                    [GoogleGenerativeAIEmbeddings]
                    [gemini-embedding-1.0 model]
                              │
                              ▼
                    [HNSWLib Vector Store]
                    [Store with metadata: filename, page, chunkIndex]
                              │
                              ▼
                    [Return: {success, documentId, chunkCount}]


Q&A Flow:
=========
[User] → [Ask Question] → [Express /api/chat]
                              │
                              ▼
                    [HNSWLib.similaritySearch(query, k=4)]
                              │
                              ▼
                    [Retrieve Top 4 Relevant Chunks]
                    [Include: content, source, page]
                              │
                              ▼
                    [Build RAG Prompt]
                    [System: Safety instructions + Context]
                    [Human: User question + Chat history]
                              │
                              ▼
                    [ChatGoogleGenerativeAI (Gemini 3 Flash)]
                              │
                              ▼
                    [Return: {answer, sources: [{doc, page}]}]
```

## Components and Interfaces

### Backend Components

#### 1. Document Processor (`server/src/services/documentProcessor.ts`)

```typescript
// Uses LangChain's PDFLoader from @langchain/community/document_loaders/fs/pdf
// This automatically handles page extraction and metadata (page numbers)
// Eliminates need for raw pdf-parse logic

interface ProcessedDocument {
  id: string;
  filename: string;
  chunks: DocumentChunk[];
  uploadedAt: Date;
}

interface DocumentChunk {
  content: string;
  metadata: {
    source: string;
    page: number;
    chunkIndex: number;
  };
}

// Functions:
// - processUpload(filePath: string, filename: string): Promise<ProcessedDocument>
// - loadPdfWithPages(filePath: string): Promise<Document[]>  // Uses PDFLoader
// - splitIntoChunks(docs: Document[]): DocumentChunk[]       // Uses RecursiveCharacterTextSplitter
```

#### 2. Embedding Service (`server/src/services/embeddingService.ts`)

```typescript
// Uses @langchain/google-genai GoogleGenerativeAIEmbeddings
// Model: gemini-embedding-1.0
// Functions:
// - generateEmbeddings(chunks: DocumentChunk[]): Promise<void>
// - addToVectorStore(chunks: DocumentChunk[]): Promise<void>
```

#### 3. RAG Engine (`server/src/services/ragEngine.ts`)

```typescript
// Supports hybrid AI providers via AI_PROVIDER env var
// - Primary Chat: Deepseek (via OpenAI-compatible API)
// - Fallback/Alternative: Google Gemini 3 Flash
// - Embeddings: Google Gemini (via embeddingService)

interface ChatRequest {
  question: string;
  conversationHistory: Message[];
}

interface ChatResponse {
  answer: string;
  sources: Source[];
  disclaimer: string;
}

interface Source {
  document: string;
  page: number;
}

// Functions:
// - query(request: ChatRequest): Promise<ChatResponse>
// - callLLM(prompt: string): Promise<string> // Dispatches to configured provider
```

#### 4. Vector Store Manager (`server/src/services/vectorStore.ts`)

```typescript
// Uses HNSWLib from langchain/vectorstores/hnswlib
// IMPORTANT: Implemented as a SINGLETON pattern
// Both upload and chat routes must access the SAME instance

// Singleton instance
let vectorStoreInstance: HNSWLib | null = null;

// Functions:
// - getInstance(): Promise<HNSWLib>  // Returns singleton, initializes if needed
// - initialize(): Promise<void>
// - addDocuments(docs: Document[]): Promise<void>
// - similaritySearch(query: string, k: number): Promise<Document[]>
// - deleteDocument(documentId: string): Promise<void>
// - getDocumentList(): DocumentInfo[]
```

### API Endpoints

| Method | Endpoint             | Description                     |
| ------ | -------------------- | ------------------------------- |
| POST   | `/api/upload`        | Upload and process PDF          |
| POST   | `/api/chat`          | Send question, get RAG response |
| GET    | `/api/documents`     | List all uploaded documents     |
| DELETE | `/api/documents/:id` | Delete document and embeddings  |
| GET    | `/api/health`        | Health check endpoint           |

### Frontend Components

#### 1. ChatInterface (`client/src/components/ChatInterface.tsx`)

- Displays conversation history
- Input field for questions
- Loading state during processing
- Source citations display

#### 2. FileUpload (`client/src/components/FileUpload.tsx`)

- Drag-and-drop PDF upload
- Upload progress indicator
- Success/error feedback

#### 3. DocumentList (`client/src/components/DocumentList.tsx`)

- List of uploaded documents
- Delete functionality
- Chunk count display

#### 4. DisclaimerBanner (`client/src/components/DisclaimerBanner.tsx`)

- Prominent medical disclaimer
- Always visible at top of chat

## Data Models

### Document Metadata (In-Memory)

```typescript
interface DocumentMetadata {
  id: string;
  filename: string;
  uploadedAt: Date;
  chunkCount: number;
  pageCount: number;
}

// Stored in: server/src/store/documentStore.ts (simple Map)
```

### Message Format

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}
```

### Vector Store Document

```typescript
// LangChain Document format
interface Document {
  pageContent: string;
  metadata: {
    source: string; // filename
    page: number; // page number
    chunkIndex: number; // chunk position
    documentId: string; // for deletion
  };
}
```

## Project File Structure

```
pharma-rag/
├── package.json                          # Root package.json for monorepo scripts
├── .env.example                          # Environment variables template
├── README.md                             # Project documentation
│
├── server/
│   ├── package.json                      # Server dependencies
│   ├── tsconfig.json                     # TypeScript config
│   ├── .env                              # Server environment variables
│   │
│   └── src/
│       ├── index.ts                      # Express app entry point (with CORS config)
│       ├── config/
│       │   └── index.ts                  # Configuration loader
│       │
│       ├── routes/
│       │   ├── upload.ts                 # POST /api/upload
│       │   ├── chat.ts                   # POST /api/chat
│       │   └── documents.ts              # GET/DELETE /api/documents
│       │
│       ├── services/
│       │   ├── documentProcessor.ts      # PDF loading (PDFLoader) and chunking
│       │   ├── embeddingService.ts       # Embedding generation
│       │   ├── vectorStore.ts            # HNSWLib vector store (SINGLETON)
│       │   └── ragEngine.ts              # RAG query pipeline
│       │
│       ├── prompts/
│       │   └── systemPrompt.ts           # Safety-focused system prompt
│       │
│       ├── store/
│       │   └── documentStore.ts          # In-memory document metadata
│       │
│       ├── middleware/
│       │   └── errorHandler.ts           # Global error handling
│       │
│       └── types/
│           └── index.ts                  # TypeScript interfaces
│
└── client/
    ├── package.json                      # Client dependencies
    ├── vite.config.ts                    # Vite configuration
    ├── tsconfig.json                     # TypeScript config
    ├── tailwind.config.js                # Tailwind CSS config
    ├── postcss.config.js                 # PostCSS config
    ├── index.html                        # HTML entry point
    │
    └── src/
        ├── main.tsx                      # React entry point
        ├── App.tsx                       # Main App component
        ├── index.css                     # Global styles + Tailwind
        │
        ├── components/
        │   ├── ChatInterface.tsx         # Main chat UI
        │   ├── MessageBubble.tsx         # Individual message display
        │   ├── FileUpload.tsx            # PDF upload component
        │   ├── DocumentList.tsx          # Document management
        │   ├── SourceCitation.tsx        # Source attribution display
        │   └── LoadingSpinner.tsx        # Loading indicator
        │
        ├── hooks/
        │   ├── useChat.ts                # Chat state management
        │   └── useDocuments.ts           # Document state management
        │
        ├── services/
        │   └── api.ts                    # API client functions
        │
        └── types/
            └── index.ts                  # TypeScript interfaces
```

## Technology Stack

| Layer              | Technology          | Package                        |
| ------------------ | ------------------- | ------------------------------ |
| Frontend Framework | React 18            | `react`, `react-dom`           |
| Build Tool         | Vite                | `vite`                         |
| Styling            | Tailwind CSS        | `tailwindcss`                  |
| Backend Framework  | Express.js          | `express`                      |
| Language           | TypeScript          | `typescript`                   |
| PDF Parsing        | LangChain PDFLoader | `@langchain/community`         |
| LLM Framework      | LangChain.js        | `langchain`, `@langchain/core` |
| LLM Provider       | Google Gemini       | `@langchain/google-genai`      |
| Vector Store       | HNSWLib             | `hnswlib-node`                 |
| File Upload        | Multer              | `multer`                       |
| CORS               | cors                | `cors`                         |
| HTTP Client        | Axios               | `axios`                        |
| UUID Generation    | uuid                | `uuid`                         |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Document Processing Completeness

_For any_ valid PDF file uploaded to the system, the Document_Processor SHALL extract all text content and produce at least one chunk, and the total character count of all chunks (minus overlaps) SHALL approximately equal the original document text length.
**Validates: Requirements 1.2, 1.3**

### Property 2: Embedding Storage Integrity

_For any_ document that completes processing successfully, the Vector_Store SHALL contain exactly the number of embeddings equal to the chunk count reported, and each embedding SHALL have valid metadata (source, page, chunkIndex).
**Validates: Requirements 1.4, 1.5**

### Property 3: RAG Retrieval Relevance

_For any_ user question submitted to the RAG_Engine, the retrieved chunks SHALL come only from documents that exist in the Vector_Store, and the source attribution in responses SHALL accurately reflect the actual source documents.
**Validates: Requirements 2.1, 2.4**

### Property 4: Safety Constraint Enforcement

_For any_ question where no relevant documents are found (similarity score below threshold), the LLM_Provider SHALL NOT generate speculative answers and SHALL explicitly indicate insufficient information.
**Validates: Requirements 2.5, 2.6, 5.2**

### Property 5: Document Deletion Completeness

_For any_ document deletion request, the Vector_Store SHALL remove ALL embeddings associated with that document, and subsequent queries SHALL NOT return chunks from the deleted document.
**Validates: Requirements 4.2, 4.3**

### Property 6: Conversation Context Preservation

_For any_ conversation with N messages (where N > 1), the RAG_Engine SHALL include up to the last 5 conversation turns when processing the current question, enabling contextual follow-up questions.
**Validates: Requirements 3.2**

## Error Handling

### System Prompt (Safety-Focused)

The following system prompt enforces medical safety and disclaimer rules:

```typescript
// server/src/prompts/systemPrompt.ts
export const SYSTEM_PROMPT = `You are PharmaRAG, a pharmaceutical information assistant developed for Bayer.

CRITICAL SAFETY RULES - YOU MUST FOLLOW THESE:
1. You may ONLY answer questions based on the provided document context.
2. If the answer is not found in the provided documents, you MUST respond: "I cannot find this information in the uploaded documents. Please consult a healthcare professional or pharmacist."
3. NEVER guess, speculate, or provide information from your training data.
4. NEVER provide medical advice, dosage recommendations, or treatment suggestions.
5. Always remind users to consult healthcare professionals for medical decisions.

RESPONSE FORMAT:
- Provide clear, factual answers based solely on the document context.
- Cite the source document and page number for each piece of information.
- End every response with: "⚠️ This information is for reference only. Always consult a healthcare professional before making medication decisions."

CONTEXT FROM UPLOADED DOCUMENTS:
{context}

CONVERSATION HISTORY:
{history}

USER QUESTION: {question}`;
```

### Backend Error Handling

| Error Type         | HTTP Status | Response Format                                            |
| ------------------ | ----------- | ---------------------------------------------------------- |
| Invalid PDF        | 400         | `{ error: "Invalid PDF file", details: string }`           |
| Processing Failed  | 500         | `{ error: "Document processing failed", details: string }` |
| Document Not Found | 404         | `{ error: "Document not found" }`                          |
| LLM Error          | 503         | `{ error: "AI service unavailable", fallback: string }`    |
| Rate Limit         | 429         | `{ error: "Rate limit exceeded", retryAfter: number }`     |

### Frontend Error Handling

- Display user-friendly error messages via toast notifications
- Retry logic for transient failures (network issues)
- Graceful degradation when backend is unavailable

## Testing Strategy

### Unit Tests

- Document processor: Test PDF parsing with various PDF formats
- Chunking logic: Verify chunk sizes and overlap
- API routes: Test request/response handling
- React components: Test rendering and user interactions

### Property-Based Tests

- **Property 1**: Generate random valid PDFs, verify chunk count > 0
- **Property 2**: After upload, query vector store and verify metadata integrity
- **Property 4**: Submit queries with no matching documents, verify safety response
- **Property 5**: Upload then delete, verify no residual embeddings

### Integration Tests

- End-to-end upload flow: PDF → chunks → embeddings → storage
- End-to-end query flow: Question → retrieval → LLM → response
- Document lifecycle: Upload → query → delete → verify removal

### Testing Framework

- Backend: Jest with `@types/jest`
- Frontend: Vitest with React Testing Library
- Property tests: fast-check for property-based testing
