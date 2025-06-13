import express from 'express';
import {
  getFileSubmissions,
  getFileSubmissionById,
  gradeFileSubmission,
  downloadSubmittedFile
} from '../resources/user/controllers/admin/fileUpload.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult, param, body } from 'express-validator';

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
 *   name: AdminFileUploads
 *   description: Admin file upload challenge management
 */

/**
 * @swagger
 * /admin/file-uploads/submissions/{assignmentNumber}:
 *   get:
 *     summary: Get all file submissions for an assignment
 *     tags: [AdminFileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [graded, pending, all]
 *         description: Filter by grading status
 *     responses:
 *       200:
 *         description: List of file submissions
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/file-uploads/submissions/:assignmentNumber',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    param('assignmentNumber').isInt({ min: 1 }).withMessage('Assignment number must be a positive integer')
  ],
  validate,
  getFileSubmissions
);

/**
 * @swagger
 * /admin/file-uploads/submission/{submissionId}:
 *   get:
 *     summary: Get a specific file submission
 *     tags: [AdminFileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: File submission ID
 *     responses:
 *       200:
 *         description: File submission details
 *       404:
 *         description: Submission not found
 */
router.get('/file-uploads/submission/:submissionId',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    param('submissionId').isString().notEmpty().withMessage('Submission ID is required')
  ],
  validate,
  getFileSubmissionById
);

/**
 * @swagger
 * /admin/file-uploads/submission/{submissionId}/grade:
 *   post:
 *     summary: Grade a file submission
 *     tags: [AdminFileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: File submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Score for the submission
 *               feedback:
 *                 type: string
 *                 description: Feedback for the student
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *       400:
 *         description: Invalid score or feedback
 *       404:
 *         description: Submission not found
 */
router.post('/file-uploads/submission/:submissionId/grade',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    param('submissionId').isString().notEmpty().withMessage('Submission ID is required'),
    body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be a number between 0 and 100'),
    body('feedback').optional().isString().withMessage('Feedback must be a string')
  ],
  validate,
  gradeFileSubmission
);

/**
 * @swagger
 * /admin/file-uploads/submission/{submissionId}/download:
 *   get:
 *     summary: Download a submitted file
 *     tags: [AdminFileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: File submission ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Submission or file not found
 */
router.get('/file-uploads/submission/:submissionId/download',
  isAuthenticated,
  roleBasedAccess(['tutor']),
  [
    param('submissionId').isString().notEmpty().withMessage('Submission ID is required')
  ],
  validate,
  downloadSubmittedFile
);

export default router;
