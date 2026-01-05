/**
 * Upload Route for PharmaRAG
 * Handles PDF file uploads with Multer
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processUpload } from '../services/documentProcessor';
import { ValidationError } from '../middleware/errorHandler';
import { config } from '../config/index';
import { UploadResponse } from '../types/index';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// File filter: only allow PDFs
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ValidationError('Only PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize, // 10MB default
  },
});

/**
 * POST /api/upload
 * Upload and process a PDF drug leaflet
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new ValidationError('No file uploaded. Please upload a PDF file.');
      }

      const filePath = req.file.path;
      const originalFilename = req.file.originalname;

      console.log(`📤 Received upload: ${originalFilename}`);

      // Process the PDF
      const result = await processUpload(filePath, originalFilename);

      // Delete temp file after processing
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to clean up temp file: ${filePath}`);
      }

      // Return success response
      const response: UploadResponse = {
        success: true,
        documentId: result.id,
        filename: result.filename,
        chunkCount: result.chunks.length,
      };

      res.status(201).json(response);
    } catch (error) {
      // Clean up file on error if it exists
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // Ignore cleanup errors
        }
      }
      next(error);
    }
  }
);

export default router;
