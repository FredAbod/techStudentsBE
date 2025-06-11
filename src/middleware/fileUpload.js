import { uploadSingle, uploadAssignment, uploadAvatar, uploadCSV } from '../utils/image/multer.js';
import { uploadToCloudinary } from '../utils/helper/cloudinaryUploader.js';
import { errorResMsg } from '../utils/lib/response.js';
import logger from '../utils/log/logger.js';

/**
 * Middleware to handle assignment file uploads (accepts 'file' or 'assignment' field)
 */
export const handleAssignmentUpload = (req, res, next) => {
  // Try 'file' field first
  const singleFile = uploadSingle;
  const singleAssignment = uploadAssignment;

  singleFile(req, res, async (err) => {
    if (err && err.message !== 'Unexpected field') {
      logger.error(`Assignment upload error: ${err.message}`);
      return errorResMsg(res, 400, err.message);
    }
    // Debug log after singleFile
    console.log('[handleAssignmentUpload] After singleFile:', { file: req.file, body: req.body });
    if (req.file) {
      try {
        // Upload to Cloudinary as raw file
        const result = await uploadToCloudinary(req.file.path, 'assignments', true);
        req.body.fileUrl = result.url;
        req.body.fileName = req.file.originalname;
        return next();
      } catch (error) {
        logger.error(`Cloudinary upload error: ${error.message}`);
        return errorResMsg(res, 500, 'Error uploading file to cloud storage');
      }
    }
    // If not found, try 'assignment' field
    singleAssignment(req, res, async (err2) => {
      if (err2) {
        logger.error(`Assignment upload error: ${err2.message}`);
        return errorResMsg(res, 400, err2.message);
      }
      // Debug log after singleAssignment
      console.log('[handleAssignmentUpload] After singleAssignment:', { file: req.file, body: req.body });
      if (!req.file) {
        return errorResMsg(res, 400, 'Please upload an assignment file');
      }
      try {
        // Upload to Cloudinary as raw file
        const result = await uploadToCloudinary(req.file.path, 'assignments', true);
        req.body.fileUrl = result.url;
        req.body.fileName = req.file.originalname;
        next();
      } catch (error) {
        logger.error(`Cloudinary upload error: ${error.message}`);
        return errorResMsg(res, 500, 'Error uploading file to cloud storage');
      }
    });
  });
};

/**
 * Middleware to handle avatar uploads
 */
export const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) {
      logger.error(`Avatar upload error: ${err.message}`);
      return errorResMsg(res, 400, err.message);
    }
    
    // Avatar is optional, so continue if no file
    if (!req.file) {
      return next();
    }
    
    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.path, 'avatars');
      
      // Add avatar URL to request body
      req.body.avatar = result.url;
      
      next();
    } catch (error) {
      logger.error(`Cloudinary upload error: ${error.message}`);
      return errorResMsg(res, 500, 'Error uploading avatar to cloud storage');
    }
  });
};

/**
 * Middleware to handle CSV file uploads for student import
 */
export const handleCSVUpload = (req, res, next) => {
  uploadCSV(req, res, async (err) => {
    if (err) {
      logger.error(`CSV upload error: ${err.message}`);
      return errorResMsg(res, 400, err.message);
    }
    
    if (!req.file) {
      return errorResMsg(res, 400, 'Please upload a CSV file');
    }
    
    // CSV is processed directly, no need to upload to Cloudinary
    next();
  });
};
