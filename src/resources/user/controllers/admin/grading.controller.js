import AutoGradingConfig from '../../models/autoGradingConfig.js';
import Assignment from '../../models/assignment.js';
import QuizSubmission from '../../models/quizSubmission.js';
import CodeSubmission from '../../models/codeSubmission.js';
import ChallengeSelection from '../../models/challengeSelection.js';
import Challenge from '../../models/challenge.js';
import Student from '../../models/student.js';
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import logger from '../../../../utils/log/logger.js';

// Configure auto-grading parameters
export const configureAutoGrading = async (req, res) => {
  try {
    const { 
      assignmentNumber, 
      challengeType, 
      gradingCriteria,
      enabled
    } = req.body;
    
    // Validate required fields
    if (!assignmentNumber || !challengeType) {
      return errorResMsg(res, 400, 'Assignment number and challenge type are required');
    }
    
    // Check if configuration already exists
    let config = await AutoGradingConfig.findOne({
      assignmentNumber,
      challengeType
    });
    
    if (config) {
      // Update existing configuration
      if (gradingCriteria) config.gradingCriteria = gradingCriteria;
      if (enabled !== undefined) config.enabled = enabled;
      config.updatedAt = new Date();
      await config.save();
    } else {
      // Create new configuration
      config = await AutoGradingConfig.create({
        assignmentNumber,
        challengeType,
        gradingCriteria: gradingCriteria || {
          passingScore: 60,
          timeWeighting: 0.1,
          penaltyForIncorrect: 0.25
        },
        enabled: enabled !== undefined ? enabled : true,
        createdBy: req.user.userId
      });
    }
    
    return successResMsg(res, 200, {
      message: 'Auto-grading configuration updated successfully',
      config
    });
  } catch (error) {
    logger.error(`Error configuring auto-grading: ${error.message}`);
    return errorResMsg(res, 500, 'Error configuring auto-grading');
  }
};

// Get auto-grading configuration for assignment
export const getAutoGradingConfig = async (req, res) => {
  try {
    const { assignmentNumber } = req.params;
    
    if (!assignmentNumber) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Get all configurations for this assignment
    const configs = await AutoGradingConfig.find({
      assignmentNumber: parseInt(assignmentNumber)
    }).populate('createdBy', 'fullName email');
    
    return successResMsg(res, 200, {
      assignmentNumber: parseInt(assignmentNumber),
      configurations: configs
    });
  } catch (error) {
    logger.error(`Error fetching auto-grading config: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching auto-grading configuration');
  }
};

// Trigger bulk auto-grading for assignment
export const bulkGradeAssignment = async (req, res) => {
  try {
    const { assignmentNumber } = req.params;
    
    if (!assignmentNumber) {
      return errorResMsg(res, 400, 'Assignment number is required');
    }
    
    // Find file-upload submissions without scores
    const pendingFileUploads = await Assignment.countDocuments({
      assignmentNumber,
      score: null
    });
    
    // Find quiz submissions without scores
    const pendingQuizSubmissions = await QuizSubmission.countDocuments({
      assignmentNumber: parseInt(assignmentNumber),
      score: null
    });
    
    // Find code submissions without scores
    const pendingCodeSubmissions = await CodeSubmission.countDocuments({
      assignmentNumber: parseInt(assignmentNumber),
      score: null
    });
    
    const totalPending = pendingFileUploads + pendingQuizSubmissions + pendingCodeSubmissions;
    
    if (totalPending === 0) {
      return successResMsg(res, 200, { 
        message: 'No pending submissions to grade',
        assignmentNumber: parseInt(assignmentNumber),
        submissionsToGrade: 0
      });
    }
    
    // In a real implementation, we would start a background job here
    // For now, we'll just return the job info
    const jobId = `bulk-grade-${assignmentNumber}-${Date.now()}`;
    
    // This would typically be saved in a job queue
    
    return successResMsg(res, 202, { 
      jobId,
      assignmentNumber: parseInt(assignmentNumber),
      submissionsToGrade: totalPending,
      estimatedTime: totalPending < 10 ? "1-2 minutes" : "2-5 minutes",
      status: "processing"
    });
  } catch (error) {
    logger.error(`Error starting bulk grading: ${error.message}`);
    return errorResMsg(res, 500, 'Error starting bulk grading');
  }
};

// Check bulk grading job status
export const getBulkGradeStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // In a real implementation, we would check the job status in a queue
    // For now, simulate a completed job
    
    // Parse assignmentNumber from jobId
    const assignmentNumber = parseInt(jobId.split('-')[2]);
    
    // Get some statistics
    const fileUploadsGraded = await Assignment.countDocuments({
      assignmentNumber: assignmentNumber.toString(),
      score: { $ne: null }
    });
    
    const quizzesGraded = await QuizSubmission.countDocuments({
      assignmentNumber,
      score: { $ne: null }
    });
    
    const codeSubmissionsGraded = await CodeSubmission.countDocuments({
      assignmentNumber,
      score: { $ne: null }
    });
    
    return successResMsg(res, 200, { 
      jobId,
      status: "completed",
      results: {
        fileUploadsGraded,
        quizzesGraded,
        codeSubmissionsGraded,
        totalGraded: fileUploadsGraded + quizzesGraded + codeSubmissionsGraded
      },
      completedAt: new Date()
    });
  } catch (error) {
    logger.error(`Error checking bulk grade status: ${error.message}`);
    return errorResMsg(res, 500, 'Error checking bulk grade status');
  }
};

// Get student's progress on assignment challenges
export const getStudentAssignmentProgress = async (req, res) => {
  try {
    const { studentId, number } = req.params;
    
    if (!studentId || !number) {
      return errorResMsg(res, 400, 'Student ID and assignment number are required');
    }
    
    // Check if requesting user has permission to view this student's progress
    const isOwnProgress = req.user.role === 'student' && 
      await Student.exists({ _id: studentId, userId: req.user.userId });
    
    if (req.user.role !== 'tutor' && !isOwnProgress) {
      return errorResMsg(res, 403, 'You do not have permission to view this student\'s progress');
    }
    
    // Get challenge selection
    const selection = await ChallengeSelection.findOne({
      studentId,
      assignmentNumber: parseInt(number)
    });
    
    if (!selection) {
      return successResMsg(res, 200, {
        assignmentNumber: parseInt(number),
        selectedChallenges: [],
        completedChallenges: [],
        totalScore: 0,
        maxPossibleScore: 0,
        isComplete: false
      });
    }
    
    // Get completed challenges
    const completedChallenges = [];
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Check for file upload submissions
    const fileUploads = await Assignment.find({
      studentId,
      assignmentNumber: number
    }).lean();
    
    for (const upload of fileUploads) {
      if (upload.score !== null) {
        completedChallenges.push({
          challengeId: 'file-upload-' + number,
          type: 'file_upload',
          score: upload.score,
          maxScore: 30, // Assuming traditional max score
          completedAt: upload.gradedAt || upload.submittedAt
        });
        
        totalScore += upload.score;
        maxPossibleScore += 30;
      }
    }
    
    // Check for quiz submissions
    for (const challengeId of selection.challengeIds) {
      // Skip if not an MCQ quiz challenge
      if (!challengeId.includes('mcq-quiz')) continue;
      
      const quizSubmission = await QuizSubmission.findOne({
        studentId,
        challengeId
      }).lean();
      
      if (quizSubmission) {
        completedChallenges.push({
          challengeId,
          type: 'mcq_quiz',
          score: quizSubmission.score,
          maxScore: quizSubmission.maxScore,
          completedAt: quizSubmission.submittedAt
        });
        
        totalScore += quizSubmission.score;
        maxPossibleScore += quizSubmission.maxScore;
      } else {
        // Challenge selected but not completed
        const challenge = await Challenge.findOne({ id: challengeId });
        if (challenge) {
          maxPossibleScore += challenge.maxScore;
        }
      }
    }
    
    // Check for code submissions
    for (const challengeId of selection.challengeIds) {
      // Skip if not a coding challenge
      if (!challengeId.includes('coding-challenge')) continue;
      
      const codeSubmission = await CodeSubmission.findOne({
        studentId,
        challengeId
      }).lean();
      
      if (codeSubmission) {
        completedChallenges.push({
          challengeId,
          type: 'coding_challenge',
          score: codeSubmission.score,
          maxScore: codeSubmission.maxScore,
          completedAt: codeSubmission.submittedAt
        });
        
        totalScore += codeSubmission.score;
        maxPossibleScore += codeSubmission.maxScore;
      } else {
        // Challenge selected but not completed
        const challenge = await Challenge.findOne({ id: challengeId });
        if (challenge) {
          maxPossibleScore += challenge.maxScore;
        }
      }
    }
    
    // Determine if assignment is complete
    const isComplete = completedChallenges.length === selection.challengeIds.length;
    
    return successResMsg(res, 200, {
      assignmentNumber: parseInt(number),
      selectedChallenges: selection.challengeIds,
      completedChallenges,
      totalScore,
      maxPossibleScore,
      isComplete
    });
  } catch (error) {
    logger.error(`Error fetching student assignment progress: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching student assignment progress');
  }
};

// Get comprehensive assignment statistics
export const getAssignmentStatistics = async (req, res) => {
  try {
    // Calculate overview statistics
    const totalSubmissions = await Assignment.countDocuments();
    const gradedAssignments = await Assignment.countDocuments({ score: { $ne: null } });
    const pendingAssignments = totalSubmissions - gradedAssignments;
    
    const scores = await Assignment.find({ score: { $ne: null } })
      .select('score')
      .lean();
    
    const avgScore = scores.length > 0
      ? scores.reduce((sum, item) => sum + item.score, 0) / scores.length
      : 0;
    
    // Get statistics by assignment number
    const assignmentNumbers = await Assignment.distinct('assignmentNumber');
    
    const byAssignment = {};
    
    for (const assignmentNumber of assignmentNumbers) {
      // File upload submissions
      const fileUploads = await Assignment.find({
        assignmentNumber
      }).lean();
      
      const fileUploadScores = fileUploads
        .filter(a => a.score !== null)
        .map(a => a.score);
      
      const fileUploadAvg = fileUploadScores.length > 0
        ? fileUploadScores.reduce((sum, score) => sum + score, 0) / fileUploadScores.length
        : 0;
      
      // Quiz submissions
      const quizSubmissions = await QuizSubmission.find({
        assignmentNumber: parseInt(assignmentNumber)
      }).lean();
      
      // Code submissions
      const codeSubmissions = await CodeSubmission.find({
        assignmentNumber: parseInt(assignmentNumber)
      }).lean();
      
      // Challenge popularity
      const challengePopularity = {
        file_upload: fileUploads.length,
        mcq_quiz: quizSubmissions.length,
        coding_challenge: codeSubmissions.length
      };
      
      // Combined average score
      const allScores = [
        ...fileUploadScores,
        ...quizSubmissions.map(q => q.score),
        ...codeSubmissions.map(c => c.score)
      ].filter(score => score !== null);
      
      const avgAssignmentScore = allScores.length > 0
        ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
        : 0;
      
      byAssignment[assignmentNumber] = {
        submissions: fileUploads.length + quizSubmissions.length + codeSubmissions.length,
        averageScore: Math.round(avgAssignmentScore * 10) / 10,
        challengePopularity
      };
    }
    
    // Calculate challenge performance statistics
    const mcqSubmissions = await QuizSubmission.find().lean();
    const mcqScores = mcqSubmissions.map(q => q.score).filter(score => score !== null);
    const mcqAvgScore = mcqScores.length > 0
      ? mcqScores.reduce((sum, score) => sum + score, 0) / mcqScores.length
      : 0;
      
    const codeSubmissions = await CodeSubmission.find().lean();
    const codeScores = codeSubmissions.map(c => c.score).filter(score => score !== null);
    const codeAvgScore = codeScores.length > 0
      ? codeScores.reduce((sum, score) => sum + score, 0) / codeScores.length
      : 0;
    
    // Calculate completion rates
    const mcqCompletionRate = mcqSubmissions.length > 0
      ? mcqSubmissions.filter(q => q.score !== null).length / mcqSubmissions.length
      : 0;
      
    const codeCompletionRate = codeSubmissions.length > 0
      ? codeSubmissions.filter(c => c.score !== null).length / codeSubmissions.length
      : 0;
      
    const fileUploadCompletionRate = totalSubmissions > 0
      ? gradedAssignments / totalSubmissions
      : 0;
    
    const challengePerformance = {
      mcq_quiz: {
        averageScore: Math.round(mcqAvgScore * 10) / 10,
        completionRate: Math.round(mcqCompletionRate * 100) / 100
      },
      coding_challenge: {
        averageScore: Math.round(codeAvgScore * 10) / 10,
        completionRate: Math.round(codeCompletionRate * 100) / 100
      },
      file_upload: {
        averageScore: Math.round(fileUploadAvg * 10) / 10,
        completionRate: Math.round(fileUploadCompletionRate * 100) / 100
      }
    };
    
    return successResMsg(res, 200, {
      overview: {
        totalSubmissions,
        gradedAssignments,
        pendingAssignments,
        averageScore: Math.round(avgScore * 10) / 10
      },
      byAssignment,
      challengePerformance
    });
  } catch (error) {
    logger.error(`Error fetching assignment statistics: ${error.message}`);
    return errorResMsg(res, 500, 'Error fetching assignment statistics');
  }
};
