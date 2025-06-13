// File Upload Analytics Controller
import { successResMsg, errorResMsg } from '../../../../utils/lib/response.js';
import logger from '../../../../utils/log/logger.js';
import { 
  getSubmissionStats, 
  getFileAccessAnalytics,
  getStudentEngagementMetrics
} from '../../../../utils/helper/fileAnalytics.js';
import FileSubmission from '../../models/fileSubmission.js';
import FileAccess from '../../models/fileAccess.js';
import Student from '../../models/student.js';
import Challenge from '../../models/challenge.js';

/**
 * Get submission statistics for file upload challenges
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFileSubmissionStats = async (req, res) => {
  try {
    const { assignmentNumber } = req.query;
    
    // Convert assignmentNumber to integer if provided
    const assignmentNum = assignmentNumber ? parseInt(assignmentNumber) : null;
    
    const stats = await getSubmissionStats(assignmentNum);
    
    return successResMsg(res, 200, {
      assignmentNumber: assignmentNum,
      stats
    });
  } catch (error) {
    logger.error(`Error getting file submission stats: ${error.message}`);
    return errorResMsg(res, 500, 'Error getting file submission statistics');
  }
};

/**
 * Get file access analytics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFileAccessStats = async (req, res) => {
  try {
    const { assignmentNumber, startDate, endDate } = req.query;
    
    // Convert assignmentNumber to integer if provided
    const assignmentNum = assignmentNumber ? parseInt(assignmentNumber) : null;
    
    const analytics = await getFileAccessAnalytics(assignmentNum, startDate, endDate);
    
    return successResMsg(res, 200, {
      filters: {
        assignmentNumber: assignmentNum,
        startDate: startDate || 'all time',
        endDate: endDate || 'all time'
      },
      analytics
    });
  } catch (error) {
    logger.error(`Error getting file access analytics: ${error.message}`);
    return errorResMsg(res, 500, 'Error getting file access analytics');
  }
};

/**
 * Get student engagement metrics for file upload challenges
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getStudentEngagement = async (req, res) => {
  try {
    const { assignmentNumber } = req.query;
    
    // Convert assignmentNumber to integer if provided
    const assignmentNum = assignmentNumber ? parseInt(assignmentNumber) : null;
    
    const metrics = await getStudentEngagementMetrics(assignmentNum);
    
    return successResMsg(res, 200, {
      assignmentNumber: assignmentNum,
      metrics
    });
  } catch (error) {
    logger.error(`Error getting student engagement metrics: ${error.message}`);
    return errorResMsg(res, 500, 'Error getting student engagement metrics');
  }
};

/**
 * Get submission rate over time
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getSubmissionTrends = async (req, res) => {
  try {
    const { assignmentNumber, interval = 'day' } = req.query;
    
    // Build base match query
    const matchQuery = {};
    if (assignmentNumber) {
      matchQuery.assignmentNumber = parseInt(assignmentNumber);
    }
    
    // Format date based on interval
    let dateFormat;
    if (interval === 'hour') {
      dateFormat = "%Y-%m-%d-%H";
    } else if (interval === 'day') {
      dateFormat = "%Y-%m-%d";
    } else if (interval === 'week') {
      dateFormat = "%G-%V"; // ISO week year and week number
    } else if (interval === 'month') {
      dateFormat = "%Y-%m";
    } else {
      return errorResMsg(res, 400, 'Invalid interval. Use hour, day, week, or month');
    }
    
    // Get submission count by date interval
    const submissionsByDate = await FileSubmission.aggregate([
      { $match: matchQuery },
      { $project: {
        dateInterval: { $dateToString: { format: dateFormat, date: "$submittedAt" } }
      }},
      { $group: {
        _id: "$dateInterval",
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // Get student count for submission rate calculation
    const studentCount = await Student.countDocuments();
    
    // Format response
    const trends = {
      interval,
      submissionsByInterval: submissionsByDate.map(item => ({
        interval: item._id,
        count: item.count,
        submissionRate: studentCount ? (item.count / studentCount * 100).toFixed(1) : 0
      }))
    };
    
    return successResMsg(res, 200, {
      assignmentNumber: assignmentNumber ? parseInt(assignmentNumber) : 'all',
      trends
    });
  } catch (error) {
    logger.error(`Error getting submission trends: ${error.message}`);
    return errorResMsg(res, 500, 'Error getting submission trends');
  }
};

/**
 * Get grading insights
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getGradingInsights = async (req, res) => {
  try {
    const { assignmentNumber } = req.query;
    
    // Build base match query for graded submissions
    const matchQuery = { score: { $ne: null } };
    if (assignmentNumber) {
      matchQuery.assignmentNumber = parseInt(assignmentNumber);
    }
    
    // Get score distribution
    const scoreDistribution = await FileSubmission.aggregate([
      { $match: matchQuery },
      { $bucket: {
        groupBy: "$score",
        boundaries: [0, 60, 70, 80, 90, 101],  // 101 to include 100
        default: "Other",
        output: { count: { $sum: 1 } }
      }}
    ]);
    
    // Format score distribution
    const formattedScoreDistribution = [
      { range: '0-59', count: (scoreDistribution.find(s => s._id === 0) || { count: 0 }).count },
      { range: '60-69', count: (scoreDistribution.find(s => s._id === 60) || { count: 0 }).count },
      { range: '70-79', count: (scoreDistribution.find(s => s._id === 70) || { count: 0 }).count },
      { range: '80-89', count: (scoreDistribution.find(s => s._id === 80) || { count: 0 }).count },
      { range: '90-100', count: (scoreDistribution.find(s => s._id === 90) || { count: 0 }).count }
    ];
    
    // Get average grading time (time between submission and grading)
    const gradingTimeData = await FileSubmission.find(matchQuery, 'submittedAt gradedAt');
    const gradingTimes = gradingTimeData.map(sub => {
      const submittedAt = new Date(sub.submittedAt);
      const gradedAt = new Date(sub.gradedAt);
      return (gradedAt - submittedAt) / (1000 * 60 * 60); // Hours
    });
    
    const avgGradingTime = gradingTimes.length ? 
      gradingTimes.reduce((sum, time) => sum + time, 0) / gradingTimes.length : 0;
    
    // Get feedback metrics - average feedback length
    const feedbackData = await FileSubmission.find(
      { ...matchQuery, feedback: { $ne: "" } }, 
      'feedback'
    );
    
    const avgFeedbackLength = feedbackData.length ? 
      feedbackData.reduce((sum, sub) => sum + sub.feedback.length, 0) / feedbackData.length : 0;
    
    return successResMsg(res, 200, {
      assignmentNumber: assignmentNumber ? parseInt(assignmentNumber) : 'all',
      insights: {
        scoreDistribution: formattedScoreDistribution,
        avgGradingTimeHours: avgGradingTime.toFixed(2),
        feedbackMetrics: {
          submissionsWithFeedback: feedbackData.length,
          submissionsWithoutFeedback: gradingTimeData.length - feedbackData.length,
          averageFeedbackLength: Math.round(avgFeedbackLength)
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting grading insights: ${error.message}`);
    return errorResMsg(res, 500, 'Error getting grading insights');
  }
};
