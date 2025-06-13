// Admin File Upload Challenge Controller
import FileSubmission from '../../models/fileSubmission.js';
import Challenge from '../../models/challenge.js';
import Student from '../../models/student.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import logger from '../../../../utils/log/logger.js';
import { challengeEvents } from '../../../../utils/helper/websocketEvents.js';

/**
 * Get all file submissions for a specific assignment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFileSubmissions = async (req, res) => {
  try {
    const { assignmentNumber } = req.params;
    const { status } = req.query;
    
    if (!assignmentNumber) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Build query
    const query = { assignmentNumber: parseInt(assignmentNumber) };
    
    // Filter by grading status if provided
    if (status === 'graded') {
      query.score = { $ne: null };
    } else if (status === 'pending') {
      query.score = null;
    }
    
    // Get submissions with student details
    const submissions = await FileSubmission.find(query)
      .populate('studentId', 'fullName email userId serialNumber')
      .populate('gradedBy', 'fullName email userId')
      .sort({ submittedAt: -1 });
    
    // Get challenges for this assignment to enrich the response
    const challenges = await Challenge.find({ 
      assignmentNumber: parseInt(assignmentNumber),
      type: 'file_upload'
    });
    
    // Map challenges by ID for easy lookup
    const challengeMap = {};
    challenges.forEach(challenge => {
      challengeMap[challenge.id] = {
        title: challenge.title,
        description: challenge.description,
        maxScore: challenge.maxScore
      };
    });
    
    // Format response
    const formattedSubmissions = submissions.map(submission => ({
      id: submission._id,
      student: submission.studentId,
      challengeId: submission.challengeId,
      challengeDetails: challengeMap[submission.challengeId] || { title: 'Unknown Challenge' },
      fileName: submission.fileOriginalName,
      fileType: submission.fileType,
      fileSize: submission.fileSize,
      comments: submission.comments,
      submittedAt: submission.submittedAt,
      score: submission.score,
      feedback: submission.feedback,
      isGraded: submission.score !== null,
      gradedAt: submission.gradedAt,
      gradedBy: submission.gradedBy
    }));
    
    return successResMsg(res, 200, {
      assignmentNumber: parseInt(assignmentNumber),
      totalSubmissions: formattedSubmissions.length,
      submissions: formattedSubmissions
    });
  } catch (error) {
    logger.error(`Error fetching file submissions: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching file submissions');
  }
};

/**
 * Get a specific file submission by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFileSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Find the submission with populated references
    const submission = await FileSubmission.findById(submissionId)
      .populate('studentId', 'fullName email userId serialNumber')
      .populate('gradedBy', 'fullName email userId');
    
    if (!submission) {
      return errorResMsg(res, 404, 'Submission not found');
    }
    
    // Get challenge details
    const challenge = await Challenge.findOne({ id: submission.challengeId });
    
    return successResMsg(res, 200, {
      submission: {
        id: submission._id,
        student: submission.studentId,
        challenge: challenge ? {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          maxScore: challenge.maxScore
        } : { id: submission.challengeId, title: 'Unknown Challenge' },
        fileName: submission.fileOriginalName,
        fileType: submission.fileType,
        fileSize: submission.fileSize,
        comments: submission.comments,
        submittedAt: submission.submittedAt,
        score: submission.score,
        feedback: submission.feedback,
        isGraded: submission.score !== null,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy
      }
    });
  } catch (error) {
    logger.error(`Error fetching file submission: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching file submission');
  }
};

/**
 * Grade a file submission
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const gradeFileSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    
    // Validate required fields
    if (score === undefined) {
      return errorResMsg(res, 400, 'Score is required');
    }
    
    // Validate score is a number between 0 and 100
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return errorResMsg(res, 400, 'Score must be a number between 0 and 100');
    }
    
    // Find the submission
    const submission = await FileSubmission.findById(submissionId);
    
    if (!submission) {
      return errorResMsg(res, 404, 'Submission not found');
    }
    
    // Update submission with grading information
    submission.score = numScore;
    submission.feedback = feedback || '';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.userId;
    
    await submission.save();
    
    // Emit WebSocket event for real-time notifications
    challengeEvents.submissionGraded(
      req,
      submission.challengeId,
      submission.studentId,
      numScore,
      feedback
    );
    
    // Get challenge and student details for the response
    const [challenge, student] = await Promise.all([
      Challenge.findOne({ id: submission.challengeId }),
      Student.findById(submission.studentId)
    ]);
    
    return successResMsg(res, 200, {
      message: 'File submission graded successfully',
      submission: {
        id: submission._id,
        challengeId: submission.challengeId,
        challengeTitle: challenge ? challenge.title : 'Unknown Challenge',
        studentName: student ? student.fullName : 'Unknown Student',
        fileName: submission.fileOriginalName,
        score: submission.score,
        feedback: submission.feedback,
        gradedAt: submission.gradedAt
      }
    });
  } catch (error) {
    logger.error(`Error grading file submission: ${error.message}`);
    return errorResMsg(res, 500, 'Error grading file submission');
  }
};

/**
 * Download a submitted file
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const downloadSubmittedFile = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Find the submission
    const submission = await FileSubmission.findById(submissionId);
    
    if (!submission) {
      return errorResMsg(res, 404, 'Submission not found');
    }
    
    // Check if file exists
    const filePath = submission.filePath;
    
    // Return file for download
    return res.download(filePath, submission.fileOriginalName, (err) => {
      if (err) {
        logger.error(`Error downloading file: ${err.message}`);
        return errorResMsg(res, 500, 'Error downloading file');
      }
    });
  } catch (error) {
    logger.error(`Error downloading file: ${error.message}`);
    return errorResMsg(res, 500, 'Error downloading file');
  }
};
