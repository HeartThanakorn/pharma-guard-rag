/**
 * Document Processor Service for PharmaRAG
 * Handles PDF loading, text extraction, chunking, and embedding generation
 */

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';
import { ProcessedDocument, DocumentChunk } from '../types/index';
import { addDocument } from '../store/documentStore';
import * as vectorStore from './vectorStore';

// Text splitter configuration per requirements
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

/**
 * Process an uploaded PDF file
 * 1. Load PDF with page extraction
 * 2. Split into chunks
 * 3. Add to vector store
 * 4. Store metadata
 */
export async function processUpload(
  filePath: string,
  filename: string
): Promise<ProcessedDocument> {
  const documentId = uuidv4();
  
  console.log(`📄 Processing document: ${filename}`);
  
  // Step 1: Load PDF with PDFLoader (automatically extracts page numbers)
  const loader = new PDFLoader(filePath, {
    splitPages: true, // Each page as separate document
  });
  const pdfDocs = await loader.load();
  
  if (pdfDocs.length === 0) {
    throw new Error('PDF file is empty or could not be read');
  }
  
  console.log(`  📖 Loaded ${pdfDocs.length} pages`);
  
  // Step 2: Split into chunks with RecursiveCharacterTextSplitter
  const splitDocs = await textSplitter.splitDocuments(pdfDocs);
  
  console.log(`  ✂️ Split into ${splitDocs.length} chunks`);
  
  // Step 3: Add metadata to each chunk
  const chunks: DocumentChunk[] = [];
  const langhchainDocs: Document[] = [];
  
  splitDocs.forEach((doc, index) => {
    // Extract page number from PDFLoader metadata (1-indexed)
    const pageNumber = doc.metadata.loc?.pageNumber || 1;
    
    const chunk: DocumentChunk = {
      content: doc.pageContent,
      metadata: {
        source: filename,
        page: pageNumber,
        chunkIndex: index,
        documentId: documentId,
      },
    };
    chunks.push(chunk);
    
    // Create LangChain Document for vector store
    langhchainDocs.push(
      new Document({
        pageContent: doc.pageContent,
        metadata: {
          source: filename,
          page: pageNumber,
          chunkIndex: index,
          documentId: documentId,
        },
      })
    );
  });
  
  // Step 4: Add chunks to vector store
  await vectorStore.addDocuments(langhchainDocs);
  
  // Step 5: Store document metadata
  const processedDocument: ProcessedDocument = {
    id: documentId,
    filename: filename,
    chunks: chunks,
    uploadedAt: new Date(),
    pageCount: pdfDocs.length,
  };
  
  addDocument({
    id: documentId,
    filename: filename,
    uploadedAt: new Date(),
    chunkCount: chunks.length,
    pageCount: pdfDocs.length,
  });
  
  console.log(`  ✅ Document processed: ${documentId}`);
  
  return processedDocument;
}

/**
 * Get page count from a PDF file without full processing
 */
export async function getPageCount(filePath: string): Promise<number> {
  const loader = new PDFLoader(filePath, { splitPages: true });
  const docs = await loader.load();
  return docs.length;
}
