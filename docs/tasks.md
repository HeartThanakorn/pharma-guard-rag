# Implementation Plan: PharmaRAG

## Overview

This implementation plan breaks down PharmaRAG into atomic, sequential tasks optimized for AI coding tools (Cursor, Copilot, Windsurf). Each task is self-contained and builds on previous tasks. The monorepo structure separates `/server` (Node.js/Express) and `/client` (React/Vite).

## Tasks

- [x] 1. Initialize monorepo and project structure

  - [x] 1.1 Create root package.json with monorepo scripts

    - Create `package.json` with scripts: `"server": "npm run dev --prefix server"`, `"client": "npm run dev --prefix client"`, `"dev": "concurrently \"npm run server\" \"npm run client\""`
    - Add `concurrently` as dev dependency
    - _Requirements: Project setup_

  - [x] 1.2 Create server package with dependencies

    - Create `server/package.json` with dependencies: `express`, `cors`, `multer`, `uuid`, `dotenv`, `langchain`, `@langchain/core`, `@langchain/google-genai`, `@langchain/community`, `hnswlib-node`, `pdf-parse`
    - Add dev dependencies: `typescript`, `ts-node`, `nodemon`, `@types/express`, `@types/cors`, `@types/multer`, `@types/uuid`, `@types/node`
    - Add scripts: `"dev": "nodemon src/index.ts"`, `"build": "tsc"`
    - _Requirements: 1.1, 1.2_

  - [x] 1.3 Create server TypeScript configuration

    - Create `server/tsconfig.json` with target ES2020, module NodeNext, strict mode enabled
    - Set outDir to `./dist`, rootDir to `./src`
    - _Requirements: Project setup_

  - [x] 1.4 Create client package with Vite + React + Tailwind

    - Create `client/package.json` with dependencies: `react`, `react-dom`, `axios`
    - Add dev dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `@types/react`, `@types/react-dom`
    - _Requirements: Frontend setup_

  - [x] 1.5 Create environment configuration files
    - Create `.env.example` with: `GOOGLE_API_KEY=your_api_key_here`, `PORT=3001`, `CLIENT_URL=http://localhost:5173`
    - Create `server/.env` (gitignored) with same variables
    - _Requirements: Configuration_

- [x] 2. Set up server foundation with Express and CORS

  - [x] 2.1 Create TypeScript interfaces

    - Create `server/src/types/index.ts`
    - Define interfaces: `ProcessedDocument`, `DocumentChunk`, `DocumentMetadata`, `Message`, `Source`, `ChatRequest`, `ChatResponse`
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 2.2 Create configuration loader

    - Create `server/src/config/index.ts`
    - Load environment variables with dotenv
    - Export config object with `googleApiKey`, `port`, `clientUrl`
    - _Requirements: Configuration_

  - [x] 2.3 Create Express app entry point with CORS

    - Create `server/src/index.ts`
    - Initialize Express app with JSON body parser
    - Configure CORS to allow requests from `CLIENT_URL` (http://localhost:5173)
    - Set up route placeholders for `/api/upload`, `/api/chat`, `/api/documents`
    - Add health check endpoint at `/api/health`
    - Start server on configured PORT
    - _Requirements: API setup_

  - [x] 2.4 Create error handling middleware
    - Create `server/src/middleware/errorHandler.ts`
    - Implement global error handler that returns JSON errors with appropriate status codes
    - Handle specific error types: ValidationError (400), NotFoundError (404), default (500)
    - _Requirements: 1.6, Error handling_

- [x] 3. Checkpoint - Verify server starts

  - Run `npm install` in server directory
  - Run `npm run dev` and verify server starts on port 3001
  - Test `/api/health` endpoint returns `{ status: "ok" }`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement document storage and vector store (Singleton)

  - [x] 4.1 Create in-memory document metadata store

    - Create `server/src/store/documentStore.ts`
    - Implement Map-based storage for `DocumentMetadata`
    - Export functions: `addDocument`, `getDocument`, `getAllDocuments`, `deleteDocument`, `getStats`
    - _Requirements: 4.1, 4.4_

  - [x] 4.2 Create embedding service

    - Create `server/src/services/embeddingService.ts`
    - Initialize `GoogleGenerativeAIEmbeddings` with model `gemini-embedding-1.0`
    - Export singleton embeddings instance
    - _Requirements: 1.4_

  - [x] 4.3 Create vector store manager as Singleton
    - Create `server/src/services/vectorStore.ts`
    - Implement Singleton pattern with private `vectorStoreInstance` variable
    - Use `HNSWLib` from `@langchain/community/vectorstores/hnswlib`
    - Implement `getInstance()` that initializes on first call using embeddings service
    - Implement `addDocuments(docs)` that adds LangChain Documents with metadata
    - Implement `similaritySearch(query, k)` that returns top k results
    - Implement `deleteByDocumentId(documentId)` that filters out documents by metadata
    - _Requirements: 1.5, 4.2_

- [x] 5. Implement PDF document processor

  - [x] 5.1 Create document processor service

    - Create `server/src/services/documentProcessor.ts`
    - Use `PDFLoader` from `@langchain/community/document_loaders/fs/pdf`
    - Use `RecursiveCharacterTextSplitter` with chunkSize=1000, chunkOverlap=200
    - Implement `processUpload(filePath, filename)`:
      1. Load PDF with PDFLoader (automatically extracts page numbers)
      2. Split into chunks with RecursiveCharacterTextSplitter
      3. Add metadata: source (filename), page, chunkIndex, documentId (uuid)
      4. Add chunks to vector store via singleton
      5. Store document metadata in documentStore
      6. Return ProcessedDocument with id, filename, chunkCount
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 5.2 Create upload route
    - Create `server/src/routes/upload.ts`
    - Configure Multer for PDF file uploads (single file, max 10MB)
    - Store uploaded file temporarily in `uploads/` directory
    - Call `documentProcessor.processUpload()` with file path
    - Delete temp file after processing
    - Return JSON: `{ success: true, documentId, filename, chunkCount }`
    - Handle errors: invalid file type (400), processing failure (500)
    - _Requirements: 1.1, 1.6, 1.7_

- [x] 6. Checkpoint - Test document upload

  - Wire upload route in `index.ts`
  - Test uploading a sample PDF via curl or Postman
  - Verify document appears in documentStore
  - Verify chunks are in vector store
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement RAG engine and chat functionality

  - [x] 7.1 Create safety-focused system prompt

    - Create `server/src/prompts/systemPrompt.ts`
    - Export `SYSTEM_PROMPT` constant with:
      - Role: PharmaRAG pharmaceutical assistant for Bayer
      - Safety rules: Only answer from context, never guess, never give medical advice
      - Response format: Cite sources with page numbers
      - Disclaimer requirement: End with healthcare professional reminder
      - Template placeholders: {context}, {history}, {question}
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 7.2 Create RAG engine service

    - Create `server/src/services/ragEngine.ts`
    - Initialize `ChatGoogleGenerativeAI` with model `gemini-3-flash`
    - Implement `query(question, conversationHistory)`:
      1. Get vector store singleton
      2. Perform similaritySearch with k=4
      3. Format context from retrieved chunks (include source, page)
      4. Format conversation history (last 5 turns)
      5. Build prompt using SYSTEM_PROMPT template
      6. Call LLM with formatted prompt
      7. Extract sources from retrieved chunks
      8. Return ChatResponse with answer, sources, disclaimer
    - Handle case when no relevant documents found (return safety message)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2_

  - [x] 7.3 Create chat route
    - Create `server/src/routes/chat.ts`
    - Accept POST with body: `{ question: string, conversationHistory: Message[] }`
    - Call `ragEngine.query()` with question and history
    - Return JSON: `{ answer, sources, disclaimer }`
    - Handle errors: empty question (400), LLM failure (503)
    - _Requirements: 2.1, 2.7_

- [x] 8. Implement document management routes

  - [x] 8.1 Create documents route
    - Create `server/src/routes/documents.ts`
    - GET `/api/documents`: Return all documents from documentStore with stats
    - DELETE `/api/documents/:id`:
      1. Get document from documentStore
      2. Delete embeddings from vector store by documentId
      3. Delete from documentStore
      4. Return success confirmation
    - Handle not found (404)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Checkpoint - Test complete backend API
  - [x] 9.1 Wire all routes in `index.ts`
  - [x] 9.2 Fix server connection timeouts (Bind 0.0.0.0)
  - [x] 9.3 Test full flow: upload PDF → ask question → get answer with sources
  - [x] 9.4 Test document deletion removes embeddings
  - [x] 9.5 Test safety response when asking unrelated questions
  - [x] 9.6 Ensure all tests pass, ask the user if questions arise.

- [/] 10. Set up React frontend with Vite and Tailwind

  - [x] 10.1 Initialize Vite React project

    - Create `client/vite.config.ts` with React plugin
    - Configure proxy for `/api` to `http://localhost:3001`
    - Create `client/index.html` with root div
    - Create `client/src/main.tsx` with React 18 createRoot
    - _Requirements: Frontend setup_

  - [x] 10.2 Configure Tailwind CSS

    - Create `client/tailwind.config.js` with content paths
    - Create `client/postcss.config.js` with tailwind and autoprefixer
    - Create `client/src/index.css` with Tailwind directives
    - Add custom colors for Bayer brand (blue: #00bcff, green: #66cc33)
    - _Requirements: Styling_

  - [x] 10.3 Create TypeScript interfaces for frontend

    - Create `client/src/types/index.ts`
    - Define interfaces matching backend: `Message`, `Source`, `DocumentInfo`, `ChatResponse`
    - _Requirements: Type safety_

  - [ ] 10.4 Create API service
    - Create `client/src/services/api.ts`
    - Implement functions using axios:
      - `uploadDocument(file: File)`: POST to /api/upload with FormData
      - `sendMessage(question, history)`: POST to /api/chat
      - `getDocuments()`: GET /api/documents
      - `deleteDocument(id)`: DELETE /api/documents/:id
    - _Requirements: API integration_

- [ ] 11. Implement React components

  - [ ] 11.1 Create DisclaimerBanner component

    - Create `client/src/components/DisclaimerBanner.tsx`
    - Display prominent yellow/amber banner at top
    - Text: "⚠️ AI can make mistakes. This tool is for informational purposes only. Always consult a healthcare professional for medical advice."
    - Fixed position, always visible
    - _Requirements: 5.1_

  - [ ] 11.2 Create LoadingSpinner component

    - Create `client/src/components/LoadingSpinner.tsx`
    - Simple animated spinner using Tailwind
    - _Requirements: 2.7_

  - [ ] 11.3 Create SourceCitation component

    - Create `client/src/components/SourceCitation.tsx`
    - Display source document name and page number
    - Format: "📄 Source: {document}, Page {page}"
    - Styled as small badge/pill
    - _Requirements: 2.4_

  - [ ] 11.4 Create MessageBubble component

    - Create `client/src/components/MessageBubble.tsx`
    - Props: message (Message type), isUser (boolean)
    - User messages: right-aligned, blue background
    - Assistant messages: left-aligned, gray background, include SourceCitation if sources exist
    - _Requirements: 3.1_

  - [ ] 11.5 Create FileUpload component

    - Create `client/src/components/FileUpload.tsx`
    - Drag-and-drop zone with dashed border
    - Accept only PDF files
    - Show upload progress/loading state
    - Display success message with chunk count
    - Display error message on failure
    - _Requirements: 1.1, 1.6, 1.7_

  - [ ] 11.6 Create DocumentList component

    - Create `client/src/components/DocumentList.tsx`
    - Display list of uploaded documents with name and date
    - Delete button for each document with confirmation
    - Show total document and chunk count
    - Empty state: "No documents uploaded. Upload a PDF to get started."
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 11.7 Create ChatInterface component
    - Create `client/src/components/ChatInterface.tsx`
    - Message list with auto-scroll to bottom
    - Input field with send button
    - Loading state while waiting for response
    - Welcome message on empty state
    - "New Chat" button to clear history
    - _Requirements: 2.7, 3.1, 3.3, 3.4, 3.5_

- [ ] 12. Implement React hooks for state management

  - [ ] 12.1 Create useChat hook

    - Create `client/src/hooks/useChat.ts`
    - Manage state: messages array, isLoading boolean
    - Implement `sendMessage(question)`:
      1. Add user message to state
      2. Set loading true
      3. Call API with question and last 5 messages
      4. Add assistant response to state
      5. Set loading false
    - Implement `clearChat()` to reset messages
    - Initialize with welcome message
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 12.2 Create useDocuments hook
    - Create `client/src/hooks/useDocuments.ts`
    - Manage state: documents array, isLoading, stats
    - Implement `fetchDocuments()` to load from API
    - Implement `uploadDocument(file)` with loading state
    - Implement `removeDocument(id)` with optimistic update
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 13. Assemble main App component

  - [ ] 13.1 Create App layout
    - Create `client/src/App.tsx`
    - Two-column layout: sidebar (documents) + main (chat)
    - Include DisclaimerBanner at top
    - Sidebar: FileUpload + DocumentList
    - Main: ChatInterface
    - Responsive design for mobile (stack vertically)
    - _Requirements: All UI requirements_

- [ ] 14. Checkpoint - Test complete application

  - Run both server and client with `npm run dev` from root
  - Test full user flow:
    1. See disclaimer banner
    2. Upload a PDF drug leaflet
    3. See document in list
    4. Ask a question about the drug
    5. Receive answer with source citation
    6. Ask follow-up question (context preserved)
    7. Delete document
    8. Verify questions about deleted doc return safety message
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Write property tests for core functionality

  - [ ] 15.1 Write property test for document processing

    - **Property 1: Document Processing Completeness**
    - Test that any valid PDF produces at least one chunk
    - **Validates: Requirements 1.2, 1.3**

  - [ ] 15.2 Write property test for embedding storage

    - **Property 2: Embedding Storage Integrity**
    - Test that chunk count matches stored embeddings count
    - **Validates: Requirements 1.4, 1.5**

  - [ ] 15.3 Write property test for safety constraints

    - **Property 4: Safety Constraint Enforcement**
    - Test that unrelated queries return safety message
    - **Validates: Requirements 2.5, 2.6, 5.2**

  - [ ] 15.4 Write property test for document deletion
    - **Property 5: Document Deletion Completeness**
    - Test that deleted documents don't appear in search results
    - **Validates: Requirements 4.2, 4.3**

- [ ] 16. Final checkpoint and documentation
  - Create `README.md` with:
    - Project description
    - Setup instructions (npm install, env vars)
    - How to run (npm run dev)
    - API documentation
    - Tech stack summary
  - Verify all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The Singleton pattern for vector store is critical - both upload and chat routes must use the same instance
- CORS configuration is essential for frontend-backend communication
- PDFLoader from LangChain handles page extraction automatically
