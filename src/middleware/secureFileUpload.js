import { uploadSingle } from '../utils/image/multer.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { errorResMsg } from '../utils/lib/response.js';
import logger from '../utils/log/logger.js';
import crypto from 'crypto';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed file types for challenge uploads
const ALLOWED_EXTENSIONS = new Map([
  // Documents
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.txt', 'text/plain'],
  ['.md', 'text/markdown'],
  
  // Code files
  ['.js', 'text/javascript'],
  ['.html', 'text/html'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.py', 'text/x-python'],
  ['.java', 'text/x-java-source'],
  
  // Archives (for submissions with multiple files)
  ['.zip', 'application/zip'],
]);

// File size limit in bytes (10MB)
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

/**
 * Validates file extension and content type security
 * @param {object} file - The uploaded file object
 * @returns {boolean} - True if file is valid, false otherwise
 */
export const validateFileSecurely = (file) => {
  // Check if file exists
  if (!file) return false;
  
  // Check file size
  if (file.size > FILE_SIZE_LIMIT) return false;
  
  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check if extension is allowed
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  
  // Check if mimetype matches the expected one for this extension
  // This helps prevent disguised files
  const expectedMimeType = ALLOWED_EXTENSIONS.get(ext);
  if (file.mimetype !== expectedMimeType) return false;
  
  // Generate a secure filename with random component
  const randomStr = crypto.randomBytes(8).toString('hex');
  const secureFilename = `${Date.now()}-${randomStr}${ext}`;
  
  // Update the file object with secure filename
  file.secureFilename = secureFilename;
  
  return true;
};

/**
 * Middleware to handle challenge file uploads securely
 */
export const handleChallengeFileUpload = (req, res, next) => {
  // Use the single upload middleware
  uploadSingle(req, res, async (err) => {
    if (err) {
      logger.error(`Challenge file upload error: ${err.message}`);
      return errorResMsg(res, 400, err.message);
    }
    
    if (!req.file) {
      return errorResMsg(res, 400, 'Please upload a file for this challenge');
    }
    
    // Validate file security
    if (!validateFileSecurely(req.file)) {
      // Remove the invalid file
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        logger.error(`Error removing invalid file: ${error.message}`);
      }
      
      return errorResMsg(res, 400, 'Invalid file type or size. Please check allowed file types and size limits.');
    }
    
    // Store file metadata in request body
    req.body.fileSecurePath = req.file.path;
    req.body.fileOriginalName = req.file.originalname;
    req.body.fileSecureName = req.file.secureFilename;
    req.body.fileSize = req.file.size;
    req.body.fileType = req.file.mimetype;
    
    next();
  });
};

/**
 * Validates a ZIP file and ensures it doesn't contain malicious files
 * @param {string} zipPath - Path to the ZIP file
 * @returns {Promise<boolean>} - True if ZIP is valid, false otherwise
 */
export const validateZipFile = async (zipPath) => {
  // This would typically use a library like AdmZip or unzipper to:
  // 1. Check for zip bombs (unusually high compression ratio)
  // 2. Validate all files within the archive against ALLOWED_EXTENSIONS
  // 3. Check for directory traversal attacks ("../../../etc/passwd")
  // 4. Limit the number of files and total size
  
  // For now, return true as a placeholder
  // In a real implementation, this would perform actual validation
  return true;
};

// Export existing functions
export * from '../utils/image/multer.js';
