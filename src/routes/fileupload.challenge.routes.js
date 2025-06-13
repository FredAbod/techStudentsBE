import express from 'express';
import {
  getFileUploadChallenge,
  submitFileUploadChallenge,
  getSubmissionDetails,
  getStudentFileSubmissions,
  downloadOwnSubmittedFile
} from '../resources/user/controllers/fileUpload.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { handleChallengeFileUpload } from '../middleware/secureFileUpload.js';
import { validationResult, param, query } from 'express-validator';

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
 *   name: FileUploads
 *   description: File upload challenge endpoints
 */

/**
 * @swagger
 * /uploads/challenge/{challengeId}:
 *   get:
 *     summary: Get file upload challenge details
 *     tags: [FileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: File upload challenge ID
 *     responses:
 *       200:
 *         description: Challenge details
 *       404:
 *         description: Challenge not found
 */
router.get('/challenge/:challengeId',
  isAuthenticated, 
  roleBasedAccess(['student']),
  [
    param('challengeId').isString().notEmpty().withMessage('Challenge ID is required')
  ],
  validate,
  getFileUploadChallenge
);

/**
 * @swagger
 * /uploads/challenge/{challengeId}/submit:
 *   post:
 *     summary: Submit file for upload challenge
 *     tags: [FileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: File upload challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or missing required data
 *       404:
 *         description: Challenge not found
 */
router.post('/challenge/:challengeId/submit',
  isAuthenticated, 
  roleBasedAccess(['student']),
  [
    param('challengeId').isString().notEmpty().withMessage('Challenge ID is required')
  ],
  validate,
  handleChallengeFileUpload,
  submitFileUploadChallenge
);

/**
 * @swagger
 * /uploads/submission/{submissionId}:
 *   get:
 *     summary: Get file upload submission details
 *     tags: [FileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission details
 *       404:
 *         description: Submission not found
 */
router.get('/submission/:submissionId',
  isAuthenticated,
  [
    param('submissionId').isString().notEmpty().withMessage('Submission ID is required')
  ],  validate,
  getSubmissionDetails
);

/**
 * @swagger
 * /uploads/submissions:
 *   get:
 *     summary: Get all file submissions for the current student
 *     tags: [FileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Filter by assignment number
 *     responses:
 *       200:
 *         description: List of student's own file submissions
 *       404:
 *         description: Student record not found
 */
router.get('/submissions',
  isAuthenticated,
  roleBasedAccess(['student']),
  [
    query('assignmentNumber').optional().isInt({ min: 1 }).withMessage('Assignment number must be a positive integer')
  ],
  validate,
  getStudentFileSubmissions
);

/**
 * @swagger
 * /uploads/submission/{submissionId}/download:
 *   get:
 *     summary: Download a student's own submitted file
 *     tags: [FileUploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Submission or file not found
 */
router.get('/submission/:submissionId/download',
  isAuthenticated,
  roleBasedAccess(['student']),
  [
    param('submissionId').isString().notEmpty().withMessage('Submission ID is required')
  ],
  validate,
  downloadOwnSubmittedFile
);

export default router;
