import fs from 'fs';
import { createReadStream } from 'fs';
import { parse } from 'csv-parser';
import logger from '../log/logger.js';

/**
 * Process a CSV file and convert it to an array of objects
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Array of objects from the CSV
 */
export const processCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    createReadStream(filePath)
      .pipe(parse())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Delete the temporary file
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Error deleting temporary CSV file: ${err.message}`);
          }
        });
        
        resolve(results);
      })
      .on('error', (error) => {
        // Delete the temporary file in case of error
        fs.unlink(filePath, (err) => {
          if (err) {
            logger.error(`Error deleting temporary CSV file: ${err.message}`);
          }
        });
        
        reject(error);
      });
  });
};

/**
 * Validate CSV data for student import
 * @param {Array} data - Array of student data objects from CSV
 * @returns {Object} - Validation result with valid data and errors
 */
export const validateStudentCSV = (data) => {
  const validData = [];
  const errors = [];
  
  data.forEach((row, index) => {
    // Required fields
    const requiredFields = ['email', 'fullName'];
    const missingFields = requiredFields.filter(field => !row[field]);
    
    if (missingFields.length > 0) {
      errors.push({
        row: index + 1,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push({
        row: index + 1,
        error: 'Invalid email address'
      });
      return;
    }
    
    // Add valid record
    validData.push({
      email: row.email.trim(),
      fullName: row.fullName.trim(),
      role: 'student'
    });
  });
  
  return { validData, errors };
};
