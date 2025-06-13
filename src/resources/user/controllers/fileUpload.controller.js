// File Upload Challenge Controller
import Challenge from '../models/challenge.js';
import FileSubmission from '../models/fileSubmission.js';
import Student from '../models/student.js';
import ChallengeSelection from '../models/challengeSelection.js';
import { successResMsg, errorResMsg } from '../../../utils/lib/response.js';
import logger from '../../../utils/log/logger.js';
import { challengeEvents } from '../../../utils/helper/websocketEvents.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

/**
 * Get all file submissions for the current student
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getStudentFileSubmissions = async (req, res) => {
  try {
    const { assignmentNumber } = req.query;
    
    // Find the student record for the current user
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Build query
    const query = { studentId: student._id };
    
    // Filter by assignment if provided
    if (assignmentNumber) {
      query.assignmentNumber = parseInt(assignmentNumber);
    }
    
    // Get all submissions for this student
    const submissions = await FileSubmission.find(query)
      .sort({ submittedAt: -1 });
    
    // Get challenges for detailed information
    const challengeIds = [...new Set(submissions.map(s => s.challengeId))];
    const challenges = await Challenge.find({ id: { $in: challengeIds } });
    
    // Map challenges by ID for quick lookup
    const challengeMap = {};
    challenges.forEach(c => {
      challengeMap[c.id] = {
        title: c.title,
        description: c.description,
        assignmentNumber: c.assignmentNumber,
        maxScore: c.maxScore
      };
    });
    
    // Format response
    const formattedSubmissions = submissions.map(submission => ({
      id: submission._id,
      challengeId: submission.challengeId,
      challengeDetails: challengeMap[submission.challengeId] || { title: 'Unknown Challenge' },
      assignmentNumber: submission.assignmentNumber,
      fileName: submission.fileOriginalName,
      fileType: submission.fileType,
      fileSize: submission.fileSize,
      comments: submission.comments,
      score: submission.score,
      status: submission.score !== null ? 'graded' : 'pending',
      feedback: submission.feedback,
      submittedAt: submission.submittedAt,
      gradedAt: submission.gradedAt
    }));
    
    return successResMsg(res, 200, {
      totalSubmissions: formattedSubmissions.length,
      submissions: formattedSubmissions
    });
  } catch (error) {
    logger.error(`Error fetching student file submissions: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching file submissions');
  }
};

/**
 * Get file upload challenge details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFileUploadChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    // Find the challenge
    const challenge = await Challenge.findOne({ 
      id: challengeId,
      type: 'file_upload',
      active: true
    });
    
    if (!challenge) {
      return errorResMsg(res, 404, 'File upload challenge not found');
    }
    
    // Find the student record for the current user
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Check if student has selected this challenge
    const selection = await ChallengeSelection.findOne({
      studentId: student._id,
      assignmentNumber: challenge.assignmentNumber,
      challengeIds: { $in: [challengeId] }
    });
    
    if (!selection) {
      return errorResMsg(res, 400, 'You have not selected this challenge');
    }
    
    // Check if student has already submitted this challenge
    const existingSubmission = await FileSubmission.findOne({
      studentId: student._id,
      challengeId
    });
    
    // Emit WebSocket event that user joined this challenge
    challengeEvents.joinChallenge(req, challengeId, req.user.userId);
    
    return successResMsg(res, 200, { 
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        maxScore: challenge.maxScore,
        assignmentNumber: challenge.assignmentNumber
      },
      hasSubmission: !!existingSubmission,
      submission: existingSubmission ? {
        id: existingSubmission._id,
        fileName: existingSubmission.fileOriginalName,
        submittedAt: existingSubmission.submittedAt,
        score: existingSubmission.score,
        feedback: existingSubmission.feedback,
        gradedAt: existingSubmission.gradedAt
      } : null
    });
  } catch (error) {
    logger.error(`Error fetching file upload challenge: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching file upload challenge');
  }
};

/**
 * Submit file for upload challenge
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const submitFileUploadChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { comments } = req.body;
    
    // Ensure file was uploaded via middleware
    if (!req.file || !req.body.fileSecurePath) {
      return errorResMsg(res, 400, 'File upload is required');
    }
    
    // Find the challenge
    const challenge = await Challenge.findOne({ 
      id: challengeId,
      type: 'file_upload',
      active: true
    });
    
    if (!challenge) {
      // Remove the uploaded file if challenge doesn't exist
      try {
        fs.unlinkSync(req.body.fileSecurePath);
      } catch (error) {
        logger.error(`Error removing file: ${error.message}`);
      }
      return errorResMsg(res, 404, 'File upload challenge not found');
    }
    
    // Find the student record for the current user
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student) {
      // Remove the uploaded file if student doesn't exist
      try {
        fs.unlinkSync(req.body.fileSecurePath);
      } catch (error) {
        logger.error(`Error removing file: ${error.message}`);
      }
      return errorResMsg(res, 404, 'Student record not found');
    }
    
    // Check if student has selected this challenge
    const selection = await ChallengeSelection.findOne({
      studentId: student._id,
      assignmentNumber: challenge.assignmentNumber,
      challengeIds: { $in: [challengeId] }
    });
    
    if (!selection) {
      // Remove the uploaded file if challenge not selected
      try {
        fs.unlinkSync(req.body.fileSecurePath);
      } catch (error) {
        logger.error(`Error removing file: ${error.message}`);
      }
      return errorResMsg(res, 400, 'You have not selected this challenge');
    }
    
    // Check if student has already submitted this challenge
    const existingSubmission = await FileSubmission.findOne({
      studentId: student._id,
      challengeId
    });
    
    // If a previous submission exists, update it
    if (existingSubmission) {
      // Remove the old file
      try {
        if (fs.existsSync(existingSubmission.filePath)) {
          fs.unlinkSync(existingSubmission.filePath);
        }
      } catch (error) {
        logger.error(`Error removing old file: ${error.message}`);
      }
      
      // Update the submission
      existingSubmission.fileName = req.body.fileSecureName;
      existingSubmission.fileOriginalName = req.body.fileOriginalName;
      existingSubmission.fileType = req.body.fileType;
      existingSubmission.fileSize = req.body.fileSize;
      existingSubmission.filePath = req.body.fileSecurePath;
      existingSubmission.comments = comments || '';
      existingSubmission.submittedAt = new Date();
      existingSubmission.score = null;
      existingSubmission.feedback = '';
      existingSubmission.gradedAt = null;
      existingSubmission.gradedBy = null;
      
      await existingSubmission.save();
      
      // Emit WebSocket event about the new file submission
      challengeEvents.fileUploaded(
        req, 
        challengeId, 
        req.user.userId, 
        req.body.fileOriginalName
      );
      
      return successResMsg(res, 200, { 
        message: 'File submission updated successfully',
        submission: {
          id: existingSubmission._id,
          fileName: existingSubmission.fileOriginalName,
          submittedAt: existingSubmission.submittedAt
        }
      });
    }
    
    // Create a new submission
    const newSubmission = await FileSubmission.create({
      studentId: student._id,
      challengeId,
      assignmentNumber: challenge.assignmentNumber,
      fileName: req.body.fileSecureName,
      fileOriginalName: req.body.fileOriginalName,
      fileType: req.body.fileType,
      fileSize: req.body.fileSize,
      filePath: req.body.fileSecurePath,
      comments: comments || ''
    });
    
    // Emit WebSocket event about the new file submission
    challengeEvents.fileUploaded(
      req, 
      challengeId, 
      req.user.userId, 
      req.body.fileOriginalName
    );
    
    return successResMsg(res, 201, { 
      message: 'File submitted successfully',
      submission: {
        id: newSubmission._id,
        fileName: newSubmission.fileOriginalName,
        submittedAt: newSubmission.submittedAt
      }
    });
  } catch (error) {
    // Remove the uploaded file if there was an error
    try {
      if (req.body.fileSecurePath) {
        fs.unlinkSync(req.body.fileSecurePath);
      }
    } catch (removeError) {
      logger.error(`Error removing file: ${removeError.message}`);
    }
    
    logger.error(`Error submitting file upload: ${error.message}`);
    return errorResMsg(res, 500, 'Error submitting file upload');
  }
};

/**
 * Get file submission details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getSubmissionDetails = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Find the submission
    const submission = await FileSubmission.findById(submissionId)
      .populate('studentId', 'fullName email')
      .populate('gradedBy', 'fullName email');
    
    if (!submission) {
      return errorResMsg(res, 404, 'Submission not found');
    }
    
    // For students, verify it's their own submission
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.userId });
      
      if (!student || !student._id.equals(submission.studentId._id)) {
        return errorResMsg(res, 403, 'You do not have permission to view this submission');
      }
        // Track student viewing their submission
      try {
        const FileAccess = mongoose.model('FileAccess');
        await FileAccess.findOneAndUpdate(
          { 
            studentId: student._id, 
            submissionId: submission._id,
            accessType: 'view'
          },
          { accessedAt: new Date() },
          { upsert: true, new: true }
        );
        
        // Emit WebSocket event for real-time analytics
        challengeEvents.fileViewed(req, submission._id, student._id);
      } catch (trackError) {
        // Non-critical error, just log it
        logger.error(`Error tracking file access: ${trackError.message}`);
      }
    }
    
    // Get challenge details for context
    const challenge = await Challenge.findOne({ id: submission.challengeId });
    
    return successResMsg(res, 200, { 
      submission: {
        id: submission._id,
        student: submission.studentId,
        challengeId: submission.challengeId,
        challengeDetails: challenge ? {
          title: challenge.title,
          description: challenge.description,
          maxScore: challenge.maxScore
        } : null,
        assignmentNumber: submission.assignmentNumber,
        fileName: submission.fileOriginalName,
        fileType: submission.fileType,
        fileSize: submission.fileSize,
        comments: submission.comments,
        score: submission.score,
        feedback: submission.feedback,
        status: submission.score !== null ? 'graded' : 'pending',
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy
      }
    });
  } catch (error) {
    logger.error(`Error fetching submission details: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching submission details');
  }
};

/**
 * Download a student's own submitted file
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const downloadOwnSubmittedFile = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Find the submission
    const submission = await FileSubmission.findById(submissionId);
    
    if (!submission) {
      return errorResMsg(res, 404, 'Submission not found');
    }
    
    // Verify ownership
    const student = await Student.findOne({ userId: req.user.userId });
    
    if (!student || !student._id.equals(submission.studentId)) {
      return errorResMsg(res, 403, 'You do not have permission to download this file');
    }
    
    // Check if file exists
    const filePath = submission.filePath;
    if (!fs.existsSync(filePath)) {
      return errorResMsg(res, 404, 'File not found');
    }
      // Log the download for analytics
    try {
      const FileAccess = mongoose.model('FileAccess');
      await FileAccess.findOneAndUpdate(
        { 
          studentId: student._id, 
          submissionId: submission._id,
          accessType: 'download'
        },
        { accessedAt: new Date() },
        { upsert: true, new: true }
      );
      
      // Emit WebSocket event for real-time analytics
      challengeEvents.fileDownloaded(req, submission._id, student._id);
    } catch (trackError) {
      logger.error(`Error tracking file download: ${trackError.message}`);
    }
    
    // Return file for download
    return res.download(filePath, submission.fileOriginalName, (err) => {
      if (err) {
        logger.error(`Error downloading file: ${err.message}`);
        return errorResMsg(res, 500, 'Error downloading file');
      }
    });
  } catch (error) {
    logger.error(`Error downloading file: ${error.message}`);
    return errorResMsg(res, 500, 'Error downloading file');  }
};

// These functions are already exported with 'export const' at their definitions
// No need for additional exports here
