import cloudinary, { cloudinaryV2 } from '../image/cloudinary.js';
import fs from 'fs';
import logger from '../log/logger.js';

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} folder - Cloudinary folder to store the file
 * @param {boolean} isRaw - Whether to upload as resource_type 'raw'
 * @returns {Promise<Object>} - Cloudinary response with file details
 */
export const uploadToCloudinary = async (filePath, folder, isRaw = false) => {
  try {
    // Debug: log resource_type and filePath
    console.log('[uploadToCloudinary] Uploading', filePath, 'to', folder, 'as', isRaw ? 'raw' : 'auto');
    let result;
    if (isRaw) {
      result = await cloudinaryV2.uploader.upload(filePath, {
        folder: folder || 'class-spark-achieve-certify',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
    } else {
      result = await cloudinary.uploader.upload(filePath, {
        folder: folder || 'class-spark-achieve-certify',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
    }
    // Do NOT delete the file here; let the controller handle cleanup after grading
    // fs.unlink(filePath, (err) => {
    //   if (err) {
    //     logger.error(`Error deleting temporary file: ${err.message}`);
    //   }
    // });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format
    };
  } catch (error) {
    // Debug: log full error object
    console.error('[uploadToCloudinary] Cloudinary error:', error, error?.response?.body);
    // fs.unlink(filePath, (err) => {
    //   if (err) {
    //     logger.error(`Error deleting temporary file after failed upload: ${err.message}`);
    //   }
    // });
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
