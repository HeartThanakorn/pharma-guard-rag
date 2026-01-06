# Requirements Document

## Introduction

PharmaRAG is an end-to-end AI application for Bayer Pharmaceuticals that enables patients and pharmacists to upload PDF drug leaflets and ask questions about drug interactions and safety. The system uses RAG (Retrieval-Augmented Generation) methodology to provide accurate, document-grounded answers, enhancing patient safety and reducing medication errors.

## Glossary

- **PharmaRAG_System**: The complete web application including frontend, backend, and AI components
- **Document_Processor**: Component responsible for PDF parsing, text extraction, and chunking
- **Embedding_Service**: Service that converts text chunks into vector embeddings using LangChain.js
- **Vector_Store**: In-memory vector store using HNSWLib (`hnswlib-node`) via LangChain.js for self-contained demo without external DB dependencies
- **RAG_Engine**: The retrieval-augmented generation pipeline that retrieves relevant chunks and generates answers
- **Chat_Interface**: React frontend component for user interaction
- **Drug_Leaflet**: PDF document containing drug information (dosage, interactions, warnings, etc.)
- **LLM_Provider**: Configurable AI service (Deepseek or Google Gemini 3 Flash) used to generate answers. Configured via `AI_PROVIDER` environment variable.

## Requirements

### Requirement 1: PDF Drug Leaflet Upload and Processing

**User Story:** As a pharmacist, I want to upload PDF drug leaflets, so that I can build a knowledge base for answering drug-related questions.

**Business Value:** Digitizes healthcare information, enabling Bayer to demonstrate innovation in pharmaceutical information management and patient safety tools.

#### Acceptance Criteria

1. WHEN a user selects a PDF file and clicks upload, THE Document_Processor SHALL accept the file and store it temporarily for processing
2. WHEN a PDF is uploaded, THE Document_Processor SHALL extract text content using pdf-parse library
3. WHEN text is extracted, THE Document_Processor SHALL split the content into chunks of 1000 characters with 200 character overlap
4. WHEN chunking is complete, THE Embedding_Service SHALL generate vector embeddings for each chunk using LangChain.js
5. WHEN embeddings are generated, THE Vector_Store SHALL store the embeddings with metadata including source filename, page number, and chunk index
6. IF a PDF upload fails or is corrupted, THEN THE PharmaRAG_System SHALL return a descriptive error message to the user
7. WHEN upload processing completes successfully, THE PharmaRAG_System SHALL display a confirmation with the document name and chunk count

### Requirement 2: Drug Information Q&A with RAG

**User Story:** As a patient, I want to ask questions about my medications, so that I can understand drug interactions and safety information from official leaflets.

**Business Value:** Enhances patient safety by providing accurate, document-grounded answers rather than hallucinated information, reducing medication errors and liability.

#### Acceptance Criteria

1. WHEN a user submits a question via the Chat_Interface, THE RAG_Engine SHALL retrieve the top 4 most relevant document chunks from the Vector_Store
2. WHEN relevant chunks are retrieved, THE RAG_Engine SHALL construct a prompt with the chunks as context and the user question
3. WHEN the prompt is constructed, THE LLM_Provider SHALL generate an answer strictly based on the provided context
4. WHEN an answer is generated, THE Chat_Interface SHALL display the response with source attribution including document name and page number (e.g., "Source: Aspirin Leaflet.pdf, Page 2")
5. IF no relevant documents are found, THEN THE RAG_Engine SHALL respond indicating insufficient information in the knowledge base
6. WHEN generating answers, THE LLM_Provider SHALL refuse to answer questions outside the scope of uploaded documents
7. WHILE processing a question, THE Chat_Interface SHALL display a loading indicator

### Requirement 3: Conversation History and Context

**User Story:** As a user, I want to have a continuous conversation about drugs, so that I can ask follow-up questions without repeating context.

**Business Value:** Improves user experience and demonstrates sophisticated AI capabilities, positioning Bayer as a leader in AI-powered healthcare tools.

#### Acceptance Criteria

1. WHEN a user sends a message, THE Chat_Interface SHALL append it to the visible conversation history
2. WHEN the RAG_Engine processes a question, THE RAG_Engine SHALL include the last 5 conversation turns as context
3. WHEN a new session starts, THE Chat_Interface SHALL display a welcome message explaining the system's capabilities
4. WHEN a user clicks "New Chat", THE PharmaRAG_System SHALL clear the conversation history and start fresh
5. WHILE a conversation is active, THE Chat_Interface SHALL maintain scroll position at the latest message

### Requirement 4: Document Management Dashboard

**User Story:** As a pharmacist, I want to view and manage uploaded documents, so that I can maintain an accurate and up-to-date knowledge base.

**Business Value:** Provides transparency and control over the AI's knowledge source, building trust and enabling compliance with pharmaceutical information standards.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard, THE PharmaRAG_System SHALL display a list of all uploaded documents with names and upload dates
2. WHEN a user clicks delete on a document, THE PharmaRAG_System SHALL remove the document and its embeddings from the Vector_Store
3. WHEN a document is deleted, THE PharmaRAG_System SHALL confirm the deletion and update the document list
4. WHEN the dashboard loads, THE PharmaRAG_System SHALL display the total number of documents and chunks in the knowledge base
5. IF no documents are uploaded, THEN THE PharmaRAG_System SHALL display a prompt encouraging the user to upload their first document

### Requirement 5: Safety Disclaimers and Responsible AI

**User Story:** As a patient, I want to see clear medical disclaimers, so that I understand the AI's limitations and seek professional medical advice when needed.

**Business Value:** Demonstrates Bayer's commitment to patient safety, reduces liability, and builds trust by being transparent about AI limitations in healthcare contexts.

#### Acceptance Criteria

1. WHEN the application loads, THE Chat_Interface SHALL display a prominent medical disclaimer stating "AI can make mistakes. This tool is for informational purposes only. Always consult a healthcare professional for medical advice."
2. WHEN the RAG_Engine cannot find relevant information in uploaded documents, THE LLM_Provider SHALL explicitly state "I cannot find this information in the uploaded documents" rather than generating speculative answers
3. WHEN generating any response, THE LLM_Provider SHALL include a reminder that users should verify information with healthcare professionals
4. THE PharmaRAG_System SHALL configure the LLM system prompt to strictly prohibit answering questions outside the scope of uploaded documents
5. WHEN a user asks about drug dosage or critical safety information, THE RAG_Engine SHALL include a warning to consult a pharmacist or doctor before making medication decisions
