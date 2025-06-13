import express from 'express';
import {
  configureAutoGrading,
  getAutoGradingConfig,
  bulkGradeAssignment,
  getStudentAssignmentProgress as getStudentProgress,
  getAssignmentStatistics as getAssignmentAnalytics
} from '../resources/user/controllers/admin/grading.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult } from 'express-validator';
import { gradingConfigValidation } from '../utils/validation/challengeValidation.js';

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
 *   name: AdminGrading
 *   description: Admin grading and analytics
 */

/**
 * @swagger
 * /admin/grading/auto-config:
 *   post:
 *     summary: Configure auto-grading parameters
 *     tags: [AdminGrading]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignmentNumber
 *               - challengeType
 *             properties:
 *               assignmentNumber:
 *                 type: integer
 *               challengeType:
 *                 type: string
 *                 enum: [mcq_quiz, coding_challenge, file_upload]
 *               gradingCriteria:
 *                 type: object
 *                 properties:
 *                   passingScore:
 *                     type: number
 *                   timeWeighting:
 *                     type: number
 *                   penaltyForIncorrect:
 *                     type: number
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Auto-grading configuration updated
 */
router.post('/grading/auto-config', 
  isAuthenticated, 
  roleBasedAccess(['tutor']), 
  gradingConfigValidation,
  validate,
  configureAutoGrading
);

/**
 * @swagger
 * /admin/grading/auto-config/{assignmentNumber}:
 *   get:
 *     summary: Get auto-grading configuration for an assignment
 *     tags: [AdminGrading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *     responses:
 *       200:
 *         description: Auto-grading configurations
 */
router.get('/grading/auto-config/:assignmentNumber', isAuthenticated, roleBasedAccess(['tutor']), getAutoGradingConfig);

/**
 * @swagger
 * /admin/grading/bulk-grade/{assignmentNumber}:
 *   post:
 *     summary: Trigger bulk auto-grading for an assignment
 *     tags: [AdminGrading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *     responses:
 *       200:
 *         description: Bulk grading completed
 */
router.post('/grading/bulk-grade/:assignmentNumber', isAuthenticated, roleBasedAccess(['tutor']), bulkGradeAssignment);

/**
 * @swagger
 * /admin/grading/student-progress/{studentId}:
 *   get:
 *     summary: Get comprehensive progress report for a student
 *     tags: [AdminGrading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Filter by assignment number (optional)
 *     responses:
 *       200:
 *         description: Student progress report
 *       404:
 *         description: Student not found
 */
router.get('/grading/student-progress/:studentId', isAuthenticated, roleBasedAccess(['tutor']), getStudentProgress);

/**
 * @swagger
 * /admin/grading/analytics/{assignmentNumber}:
 *   get:
 *     summary: Get analytics for a specific assignment
 *     tags: [AdminGrading]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *     responses:
 *       200:
 *         description: Assignment analytics
 */
router.get('/grading/analytics/:assignmentNumber', isAuthenticated, roleBasedAccess(['tutor']), getAssignmentAnalytics);

export default router;
