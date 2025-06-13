// File Upload Analytics Utilities
import FileSubmission from '../../resources/user/models/fileSubmission.js';
import FileAccess from '../../resources/user/models/fileAccess.js';
import Challenge from '../../resources/user/models/challenge.js';
import Student from '../../resources/user/models/student.js';
import mongoose from 'mongoose';
import logger from '../log/logger.js';

/**
 * Calculate submission statistics for assignments
 * @param {Number} assignmentNumber - Optional assignment number to filter by
 * @returns {Object} Statistics about submissions
 */
export const getSubmissionStats = async (assignmentNumber = null) => {
  try {
    const query = assignmentNumber ? { assignmentNumber } : {};
    
    // Get basic submission counts
    const totalSubmissions = await FileSubmission.countDocuments(query);
    const gradedSubmissions = await FileSubmission.countDocuments({ 
      ...query, 
      score: { $ne: null } 
    });
    const pendingSubmissions = await FileSubmission.countDocuments({ 
      ...query, 
      score: null 
    });
    
    // Get average score for graded submissions
    const scoreStats = await FileSubmission.aggregate([
      { $match: { ...query, score: { $ne: null } } },
      { $group: {
        _id: null,
        avgScore: { $avg: '$score' },
        maxScore: { $max: '$score' },
        minScore: { $min: '$score' }
      }}
    ]);
    
    // Get submission time distribution
    const submissionTimes = await FileSubmission.aggregate([
      { $match: query },
      { $project: {
        hour: { $hour: "$submittedAt" }
      }},
      { $group: {
        _id: "$hour",
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    return {
      totalSubmissions,
      gradedSubmissions,
      pendingSubmissions,
      completionRate: totalSubmissions ? (gradedSubmissions / totalSubmissions * 100).toFixed(1) : 0,
      scoreStats: scoreStats.length ? scoreStats[0] : { avgScore: 0, maxScore: 0, minScore: 0 },
      submissionTimeDistribution: submissionTimes.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };
  } catch (error) {
    logger.error(`Error calculating submission stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get file access analytics
 * @param {Number} assignmentNumber - Optional assignment number to filter by
 * @param {String} startDate - Optional start date for filtering (YYYY-MM-DD)
 * @param {String} endDate - Optional end date for filtering (YYYY-MM-DD)
 * @returns {Object} File access statistics
 */
export const getFileAccessAnalytics = async (assignmentNumber = null, startDate = null, endDate = null) => {
  try {
    // Build match query
    const matchQuery = {};
    
    // Add date range if provided
    if (startDate && endDate) {
      matchQuery.accessedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get submissions for assignment if provided
    if (assignmentNumber) {
      const submissions = await FileSubmission.find({ assignmentNumber });
      const submissionIds = submissions.map(s => s._id);
      matchQuery.submissionId = { $in: submissionIds };
    }
    
    // Count access by type
    const accessByType = await FileAccess.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: "$accessType",
        count: { $sum: 1 }
      }}
    ]);
    
    // Count access by date
    const accessByDate = await FileAccess.aggregate([
      { $match: matchQuery },
      { $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$accessedAt" } }
      }},
      { $group: {
        _id: "$date",
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // Get top accessed submissions
    const topAccessedSubmissions = await FileAccess.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: "$submissionId",
        accessCount: { $sum: 1 }
      }},
      { $sort: { accessCount: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: "filesubmissions",
        localField: "_id",
        foreignField: "_id",
        as: "submission"
      }},
      { $unwind: "$submission" },
      { $lookup: {
        from: "students",
        localField: "submission.studentId",
        foreignField: "_id",
        as: "student"
      }},
      { $unwind: "$student" },
      { $project: {
        submissionId: "$_id",
        challengeId: "$submission.challengeId",
        studentName: "$student.fullName",
        accessCount: 1
      }}
    ]);

    // Get top active students (students with most file views/downloads)
    const topActiveStudents = await FileAccess.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: "$studentId",
        accessCount: { $sum: 1 }
      }},
      { $sort: { accessCount: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student"
      }},
      { $unwind: "$student" },
      { $project: {
        studentId: "$_id",
        studentName: "$student.fullName",
        accessCount: 1
      }}
    ]);
    
    return {
      accessByType: accessByType.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      accessByDate: accessByDate.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      topAccessedSubmissions,
      topActiveStudents,
      totalAccessEvents: Object.values(accessByType.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})).reduce((sum, count) => sum + count, 0)
    };
  } catch (error) {
    logger.error(`Error calculating file access analytics: ${error.message}`);
    throw error;
  }
};

/**
 * Get student engagement metrics for file upload challenges
 * @param {Number} assignmentNumber - Optional assignment number to filter by 
 * @returns {Object} Student engagement metrics
 */
export const getStudentEngagementMetrics = async (assignmentNumber = null) => {
  try {
    // Build base query
    const query = assignmentNumber ? { assignmentNumber } : {};
    
    // Total number of students
    const totalStudents = await Student.countDocuments();
    
    // Students who submitted at least one file
    const studentsWithSubmissions = await FileSubmission.aggregate([
      { $match: query },
      { $group: { _id: "$studentId" }},
      { $count: "count" }
    ]);
    
    // Students who had their file submissions graded
    const studentsWithGradedSubmissions = await FileSubmission.aggregate([
      { $match: { ...query, score: { $ne: null } } },
      { $group: { _id: "$studentId" }},
      { $count: "count" }
    ]);
    
    // Get submission to feedback view ratio
    const submissionCount = await FileSubmission.countDocuments(query);
    const feedbackViewCount = await FileAccess.countDocuments({
      accessType: 'view',
      submissionId: {
        $in: await FileSubmission.find({ ...query, score: { $ne: null } }).distinct('_id')
      }
    });
    
    return {
      totalStudents,
      studentsWithSubmissions: studentsWithSubmissions.length ? studentsWithSubmissions[0].count : 0,
      studentsWithGradedSubmissions: studentsWithGradedSubmissions.length ? studentsWithGradedSubmissions[0].count : 0,
      participationRate: totalStudents ? 
        ((studentsWithSubmissions.length ? studentsWithSubmissions[0].count : 0) / totalStudents * 100).toFixed(1) : 0,
      feedbackViewRatio: submissionCount ? (feedbackViewCount / submissionCount).toFixed(2) : 0
    };
  } catch (error) {
    logger.error(`Error calculating student engagement metrics: ${error.message}`);
    throw error;
  }
};
