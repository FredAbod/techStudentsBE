// Admin File Upload Analytics Routes
import express from 'express';
import {
  getFileSubmissionStats,
  getFileAccessStats,
  getStudentEngagement,
  getSubmissionTrends,
  getGradingInsights
} from '../resources/user/controllers/admin/fileUploadAnalytics.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: FileUploadAnalytics
 *   description: File upload analytics and reporting
 */

/**
 * @swagger
 * /admin/analytics/file-uploads/stats:
 *   get:
 *     summary: Get submission statistics for file uploads
 *     tags: [FileUploadAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Optional assignment number to filter by
 *     responses:
 *       200:
 *         description: Submission statistics
 *       500:
 *         description: Server error
 */
router.get('/analytics/file-uploads/stats',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    query('assignmentNumber').optional().isInt({ min: 1 }).withMessage('Assignment number must be a positive integer')
  ],
  validate,
  getFileSubmissionStats
);

/**
 * @swagger
 * /admin/analytics/file-uploads/access:
 *   get:
 *     summary: Get file access analytics
 *     tags: [FileUploadAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Optional assignment number to filter by
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: File access analytics
 *       500:
 *         description: Server error
 */
router.get('/analytics/file-uploads/access',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    query('assignmentNumber').optional().isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
    query('startDate').optional().isDate().withMessage('Start date must be in YYYY-MM-DD format'),
    query('endDate').optional().isDate().withMessage('End date must be in YYYY-MM-DD format')
  ],
  validate,
  getFileAccessStats
);

/**
 * @swagger
 * /admin/analytics/file-uploads/engagement:
 *   get:
 *     summary: Get student engagement metrics for file uploads
 *     tags: [FileUploadAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Optional assignment number to filter by
 *     responses:
 *       200:
 *         description: Student engagement metrics
 *       500:
 *         description: Server error
 */
router.get('/analytics/file-uploads/engagement',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    query('assignmentNumber').optional().isInt({ min: 1 }).withMessage('Assignment number must be a positive integer')
  ],
  validate,
  getStudentEngagement
);

/**
 * @swagger
 * /admin/analytics/file-uploads/trends:
 *   get:
 *     summary: Get submission trends over time
 *     tags: [FileUploadAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Optional assignment number to filter by
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Time interval for grouping (default is day)
 *     responses:
 *       200:
 *         description: Submission trends
 *       400:
 *         description: Invalid interval
 *       500:
 *         description: Server error
 */
router.get('/analytics/file-uploads/trends',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    query('assignmentNumber').optional().isInt({ min: 1 }).withMessage('Assignment number must be a positive integer'),
    query('interval').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Interval must be hour, day, week, or month')
  ],
  validate,
  getSubmissionTrends
);

/**
 * @swagger
 * /admin/analytics/file-uploads/grading:
 *   get:
 *     summary: Get grading insights
 *     tags: [FileUploadAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Optional assignment number to filter by
 *     responses:
 *       200:
 *         description: Grading insights
 *       500:
 *         description: Server error
 */
router.get('/analytics/file-uploads/grading',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    query('assignmentNumber').optional().isInt({ min: 1 }).withMessage('Assignment number must be a positive integer')
  ],
  validate,
  getGradingInsights
);

export default router;
