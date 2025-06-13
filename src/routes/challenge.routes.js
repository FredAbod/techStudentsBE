import express from 'express';
import {
  getAvailableChallenges,
  selectChallenges,
  getMCQQuestions as startMCQQuiz,
  submitQuiz as submitMCQQuiz,
  getCodingProblem,
  submitCode as submitCodeChallenge,
  runTests as runTestCase,
  getStudentCompletionStatus
} from '../resources/user/controllers/challenge.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult, body } from 'express-validator';
import { 
  challengeSelectionValidation, 
  mcqSubmissionValidation, 
  codeSubmissionValidation 
} from '../utils/validation/challengeValidation.js';

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
 *   name: Challenges
 *   description: Student challenge interactions
 */

/**
 * @swagger
 * /challenges/assignment/{number}:
 *   get:
 *     summary: Get available challenges for an assignment
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *     responses:
 *       200:
 *         description: Available challenges and selection status
 */
router.get('/challenges/assignment/:number', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  getAvailableChallenges
);

/**
 * @swagger
 * /challenges/assignment/{number}/select:
 *   post:
 *     summary: Submit challenge selection for an assignment
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challengeIds
 *             properties:
 *               challengeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of challenge IDs
 *     responses:
 *       200:
 *         description: Challenge selection submitted
 */
router.post('/challenges/assignment/:number/select', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  challengeSelectionValidation,
  validate,
  selectChallenges
);

/**
 * @swagger
 * /challenges/mcq/{challengeId}/start:
 *   get:
 *     summary: Start an MCQ quiz challenge
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: MCQ quiz challenge ID
 *     responses:
 *       200:
 *         description: MCQ quiz questions
 *       400:
 *         description: Quiz already completed or not selected
 */
router.get('/challenges/mcq/:challengeId/start', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  startMCQQuiz
);

/**
 * @swagger
 * /challenges/mcq/{challengeId}/submit:
 *   post:
 *     summary: Submit answers for an MCQ quiz
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: MCQ quiz challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedAnswer:
 *                       type: integer
 *               timeTaken:
 *                 type: number
 *                 description: Time taken in seconds
 *     responses:
 *       200:
 *         description: Quiz results and score
 */
router.post('/challenges/mcq/:challengeId/submit', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  mcqSubmissionValidation,
  validate,
  submitMCQQuiz
);

/**
 * @swagger
 * /challenges/code/{challengeId}:
 *   get:
 *     summary: Get a coding challenge
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Coding challenge ID
 *     responses:
 *       200:
 *         description: Coding challenge details
 *       404:
 *         description: Challenge not found or not selected
 */
router.get('/challenges/code/:challengeId', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  getCodingProblem
);

/**
 * @swagger
 * /challenges/code/{challengeId}/run:
 *   post:
 *     summary: Run a single test case for coding challenge
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Coding challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - testCaseIndex
 *             properties:
 *               code:
 *                 type: string
 *               testCaseIndex:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Test case execution result
 */
router.post('/challenges/code/:challengeId/run', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  [
    ...codeSubmissionValidation,
    body('testCaseIndex').isInt({ min: 0 }).withMessage('Test case index must be a non-negative integer')
  ],
  validate,
  runTestCase
);

/**
 * @swagger
 * /challenges/code/{challengeId}/submit:
 *   post:
 *     summary: Submit solution for a coding challenge
 *     tags: [Challenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Coding challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *               timeTaken:
 *                 type: number
 *                 description: Time taken in seconds
 *     responses:
 *       200:
 *         description: Submission results
 */
router.post('/challenges/code/:challengeId/submit', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  codeSubmissionValidation,
  validate,
  submitCodeChallenge
);

/**
 * @swagger
 * /challenges/status/{assignmentNumber}:
 *   get:
 *     summary: Get student's challenge completion status for an assignment
 *     tags: [Challenges]
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
 *         description: Challenge completion status
 */
router.get('/challenges/status/:assignmentNumber', 
  isAuthenticated, 
  roleBasedAccess(['student']), 
  getStudentCompletionStatus
);

export default router;
