# PharmaRAG

PharmaRAG is a Retrieval-Augmented Generation (RAG) assistant designed for pharmaceutical use cases. It allows users to upload PDF drug leaflets and ask questions about them, receiving accurate answers with source citations.

## 🚀 Features

- **Document Parsing**: Upload PDF drug leaflets and automatically extract text and metadata.
- **RAG Engine**: Retrieves relevant chunks from uploaded documents to ground LLM responses.
- **Source Citations**: Answers include specific citations (Document Name, Page Number).
- **Safety First**: System prompts ensure the assistant declines unrelated queries and provides medical disclaimers.
- **Hybrid AI**: 
  - **LLM**: DeepSeek (via OpenRouter)
  - **Embeddings**: Google Gemini (`embedding-001`)
- **Vector Search**: In-memory HNSW vector store for fast retrieval.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, LangChain
- **AI/ML**: LangChain.js, Google Generative AI Embeddings, DeepSeek LLM
- **Storage**: In-memory stores (Vector Store + Document Store)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm
- Google AI API Key (for Embeddings)
- OpenRouter API Key (for LLM)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd pharma-guard-rag
    ```

2.  **Install dependencies** (Root, Server, and Client)
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Environment Setup**
    Create `.env` file in `server/` directory:
    ```env
    PORT=3001
    CLIENT_URL=http://localhost:5173
    
    # AI Keys
    GOOGLE_API_KEY=your_google_api_key
    OPENROUTER_API_KEY=your_openrouter_api_key
    
    # Models
    AI_PROVIDER=DEEPSEEK
    EMBEDDING_MODEL=embedding-001
    ```

## 🏃‍♂️ Running the Application

To run both backend and frontend concurrently from the root directory:

```bash
# From project root
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 🧪 Testing

The backend includes a suite of property tests to verify core RAG functionality (Processing, Integrity, Safety, Deletion).

```bash
cd server
npm test
```

## 📂 Project Structure

```
pharma-guard-rag/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Chat, Upload, etc.)
│   │   ├── hooks/          # Custom Hooks (useChat, useDocuments)
│   │   └── services/       # API Integration
│   └── vite.config.ts
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # App Configuration
│   │   ├── services/       # Core Logic (RAG, Processor, Vectors)
│   │   ├── routes/         # API Routes and Controllers
│   │   └── __tests__/      # Integration/Property Tests
│   └── jest.config.js
└── docs/                   # Documentation
```

## ⚠️ Disclaimer

This tool is for informational purposes only. Always consult a healthcare professional for medical advice. AI can make mistakes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
