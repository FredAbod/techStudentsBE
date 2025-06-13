// WebSocket event helper for challenge controllers
import logger from '../log/logger.js';

/**
 * Emits WebSocket events for challenge-related actions
 */
export const challengeEvents = {
  /**
   * Emit when a student joins a challenge
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID
   */
  joinChallenge: (req, challengeId, userId) => {
    if (!req.emitToChallenge) return;
    
    req.emitToChallenge(challengeId, 'user-joined', { 
      userId, 
      timestamp: new Date() 
    });
    
    logger.info(`User ${userId} joined challenge ${challengeId}`);
  },
  
  /**
   * Emit when a quiz is submitted
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID
   * @param {number} score - Quiz score
   * @param {number} totalQuestions - Total number of questions
   */
  quizSubmitted: (req, challengeId, userId, score, totalQuestions) => {
    if (!req.emitToChallenge) return;
    
    req.emitToChallenge(challengeId, 'submission-update', { 
      type: 'quiz',
      userId,
      score,
      totalQuestions,
      timestamp: new Date()
    });
    
    logger.info(`Quiz submission by ${userId} for challenge ${challengeId}, score: ${score}`);
  },
  
  /**
   * Emit when code is submitted
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID
   * @param {string} status - Submission status
   * @param {number} passedTests - Number of passed tests
   * @param {number} totalTests - Total number of tests
   */
  codeSubmitted: (req, challengeId, userId, status, passedTests, totalTests) => {
    if (!req.emitToChallenge) return;
    
    req.emitToChallenge(challengeId, 'submission-update', { 
      type: 'code',
      userId,
      status,
      passedTests,
      totalTests,
      timestamp: new Date()
    });
    
    logger.info(`Code submission by ${userId} for challenge ${challengeId}, status: ${status}`);
  },
  
  /**
   * Emit when a test case is run
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID
   * @param {number} testIndex - Test case index
   * @param {boolean} passed - Whether the test passed
   */
  testCaseRun: (req, challengeId, userId, testIndex, passed) => {
    if (!req.emitToChallenge) return;
    
    req.emitToChallenge(challengeId, 'test-result', { 
      userId,
      testIndex,
      passed,
      timestamp: new Date()
    });
    
    logger.info(`Test case ${testIndex} run by ${userId} for challenge ${challengeId}, passed: ${passed}`);
  },
  
  /**
   * Emit when a file is uploaded for a challenge
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User ID
   * @param {string} fileName - Uploaded file name
   */  fileUploaded: (req, challengeId, userId, fileName) => {
    if (!req.emitToChallenge) return;
    
    req.emitToChallenge(challengeId, 'submission-update', { 
      type: 'file',
      userId,
      fileName,
      timestamp: new Date()
    });
    
    logger.info(`File uploaded by ${userId} for challenge ${challengeId}: ${fileName}`);
  },
  
  /**
   * Emit when a submission is graded
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} challengeId - Challenge ID
   * @param {string} studentId - Student ID
   * @param {number} score - Submission score
   * @param {string} feedback - Feedback for submission
   */
  submissionGraded: (req, challengeId, studentId, score, feedback) => {
    if (!req.emitToChallenge) return;
    
    req.emitToChallenge(challengeId, 'submission-graded', { 
      studentId,
      score,
      hasFeedback: !!feedback,
      timestamp: new Date()
    });
    
    // Also emit to the student's personal channel if available
    if (req.emitToUser) {
      req.emitToUser(studentId, 'grade-notification', {
        challengeId,
        score,
        hasFeedback: !!feedback,
        timestamp: new Date()
      });
    }
    
    logger.info(`Submission graded for student ${studentId} in challenge ${challengeId}, score: ${score}`);
  },
  
  /**
   * Emit when auto-grading starts for an assignment
   * @param {Object} req - Request object with WebSocket emitter
   * @param {number} assignmentNumber - Assignment number
   */
  gradingStarted: (req, assignmentNumber) => {
    if (!req.emitToAssignment) return;
    
    req.emitToAssignment(assignmentNumber, 'grading-update', { 
      status: 'started',
      assignmentNumber,
      timestamp: new Date()
    });
    
    logger.info(`Auto-grading started for assignment ${assignmentNumber}`);
  },
  
  /**
   * Emit auto-grading progress updates
   * @param {Object} req - Request object with WebSocket emitter
   * @param {number} assignmentNumber - Assignment number
   * @param {number} progress - Current progress count
   * @param {number} total - Total items to grade
   */
  gradingProgress: (req, assignmentNumber, progress, total) => {
    if (!req.emitToAssignment) return;
    
    req.emitToAssignment(assignmentNumber, 'grading-update', { 
      status: 'in-progress',
      assignmentNumber,
      progress,
      total,
      timestamp: new Date()
    });
    
    logger.info(`Auto-grading progress for assignment ${assignmentNumber}: ${progress}/${total}`);
  },
  
  /**
   * Emit when auto-grading completes for an assignment
   * @param {Object} req - Request object with WebSocket emitter
   * @param {number} assignmentNumber - Assignment number
   * @param {Object} results - Grading results summary
   */  gradingComplete: (req, assignmentNumber, results) => {
    if (!req.emitToAssignment) return;
    
    req.emitToAssignment(assignmentNumber, 'grading-update', { 
      status: 'completed',
      assignmentNumber,
      results,
      timestamp: new Date()
    });
    
    logger.info(`Auto-grading completed for assignment ${assignmentNumber}`);
  },

  /**
   * Emit when a student views a submission
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} submissionId - Submission ID
   * @param {string} studentId - Student ID
   */
  fileViewed: (req, submissionId, studentId) => {
    if (!req.emitToAdmin) return;
    
    req.emitToAdmin('file-activity', {
      type: 'view',
      submissionId,
      studentId,
      timestamp: new Date()
    });
    
    logger.info(`File submission ${submissionId} viewed by student ${studentId}`);
  },
  
  /**
   * Emit when a student downloads a submission
   * @param {Object} req - Request object with WebSocket emitter
   * @param {string} submissionId - Submission ID
   * @param {string} studentId - Student ID
   */
  fileDownloaded: (req, submissionId, studentId) => {
    if (!req.emitToAdmin) return;
    
    req.emitToAdmin('file-activity', {
      type: 'download',
      submissionId,
      studentId,
      timestamp: new Date()
    });
    
    logger.info(`File submission ${submissionId} downloaded by student ${studentId}`);
  },
  
  /**
   * Emit submission analytics update
   * @param {Object} req - Request object with WebSocket emitter
   * @param {number} assignmentNumber - Assignment number
   * @param {string} metricType - Type of metric being updated
   * @param {Object} data - Analytics data
   */
  analyticsUpdate: (req, assignmentNumber, metricType, data) => {
    if (!req.emitToAdmin) return;
    
    req.emitToAdmin('analytics-update', {
      assignmentNumber,
      metricType,
      data,
      timestamp: new Date()
    });
    
    logger.info(`Analytics update for assignment ${assignmentNumber}, metric: ${metricType}`);
  }
};
