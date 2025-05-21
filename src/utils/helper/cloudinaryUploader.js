import cloudinary from '../image/cloudinary.js';
import fs from 'fs';
import logger from '../log/logger.js';

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} folder - Cloudinary folder to store the file
 * @returns {Promise<Object>} - Cloudinary response with file details
 */
export const uploadToCloudinary = async (filePath, folder) => {
  try {
    // Upload the file to cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder || 'class-spark-achieve-certify',
      resource_type: 'auto' // Auto-detect the file type
    });
    
    // Delete the file from local storage
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`Error deleting temporary file: ${err.message}`);
      }
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format
    };
  } catch (error) {
    // Delete the file if upload failed
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`Error deleting temporary file after failed upload: ${err.message}`);
      }
    });
    
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw new Error('Failed to upload file to cloud storage');
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file
 * @returns {Promise<Object>} - Cloudinary response
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw new Error('Failed to delete file from cloud storage');
  }
};
