import Student from '../models/student.js';
import User from '../models/auth.js';
import Profile from '../models/profile.js';
import { passwordHash } from '../../../middleware/hashing.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';
import { processCSV, validateStudentCSV } from '../../../utils/helper/csvProcessor.js';
import crypto from 'crypto';
import fs from 'fs';

export const getAllStudents = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search query
    const searchQuery = req.query.search 
      ? {
          $or: [
            { fullName: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
            { serialNumber: { $regex: req.query.search, $options: 'i' } }
          ]
        } 
      : {};
    
    // Certification filter
    if (req.query.certified === 'true') {
      searchQuery.certificationStatus = true;
    } else if (req.query.certified === 'false') {
      searchQuery.certificationStatus = false;
    }
    
    // Query with pagination
    const students = await Student.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalStudents = await Student.countDocuments(searchQuery);
    
    return successResMsg(res, 200, { 
      students,
      pagination: {
        total: totalStudents,
        page,
        limit,
        pages: Math.ceil(totalStudents / limit)
      }
    });
  } catch (error) {
    logger.error(`Get all students error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching students');
  }
};

export const getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return errorResMsg(res, 404, 'Student not found');
    }
    
    return successResMsg(res, 200, { student });
  } catch (error) {
    logger.error(`Get student by ID error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching student');
  }
};

export const getCurrentStudent = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const student = await Student.findOne({ userId });
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    return successResMsg(res, 200, { student });
  } catch (error) {
    logger.error(`Get current student error: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching student record');
  }
};

export const updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { fullName, certificationStatus, totalPoints } = req.body;
    
    // Check if the record exists
    const student = await Student.findById(studentId);
    if (!student) {
      return errorResMsg(res, 404, 'Student not found');
    }
    
    // For security, only allow tutors to update certain fields
    const updateData = {};
    
    if (fullName) {
      updateData.fullName = fullName;
    }
    
    // Only tutors can update these fields
    if (req.user.role === 'tutor') {
      if (certificationStatus !== undefined) {
        updateData.certificationStatus = certificationStatus;
      }
      
      if (totalPoints !== undefined) {
        updateData.totalPoints = totalPoints;
      }
    }
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return errorResMsg(res, 400, 'No valid fields to update');
    }
    
    // Update the student record
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true }
    );
    
    // If fullName was updated, also update it in the profile
    if (fullName) {
      await Profile.findOneAndUpdate(
        { userId: updatedStudent.userId },
        { fullName }
      );
    }
    
    return successResMsg(res, 200, { 
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    logger.error(`Update student error: ${error.message}`);
    return errorResMsg(res, 500, 'Error updating student');
  }
};

export const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return errorResMsg(res, 400, 'Please upload a CSV file');
    }
    
    // Process CSV file
    const csvData = await processCSV(req.file.path);
    
    // Validate the data
    const { validData, errors } = validateStudentCSV(csvData);
    
    if (validData.length === 0) {
      return errorResMsg(res, 400, 'No valid student data found in the CSV file', { errors });
    }
    
    // Results tracking
    const results = {
      success: [],
      failures: [],
      total: validData.length
    };
    
    // Process each valid record
    for (const data of validData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: data.email });
        
        if (existingUser) {
          results.failures.push({
            email: data.email,
            reason: 'User already exists with this email'
          });
          continue;
        }
        
        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        
        // Hash the password
        const hashedPassword = await passwordHash(tempPassword);
        
        // Create user
        const newUser = await User.create({
          email: data.email,
          password: hashedPassword,
          fullName: data.fullName,
          role: 'student'
        });
        
        // Create profile
        await Profile.create({
          userId: newUser._id,
          fullName: data.fullName,
          role: 'student'
        });
        
        // Create student record
        const newStudent = await Student.create({
          userId: newUser._id,
          fullName: data.fullName,
          email: data.email
        });
        
        results.success.push({
          email: data.email,
          serialNumber: newStudent.serialNumber,
          tempPassword
        });
      } catch (error) {
        results.failures.push({
          email: data.email,
          reason: 'Error creating student: ' + error.message
        });
      }
    }
    
    return successResMsg(res, 201, {
      message: `Successfully imported ${results.success.length} out of ${results.total} students`,
      results
    });
  } catch (error) {
    // Clean up file if still exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.error(`Import students error: ${error.message}`);
    return errorResMsg(res, 500, 'Error importing students');
  }
};
