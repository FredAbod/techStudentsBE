import express from 'express';
import {
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge
} from '../resources/user/controllers/admin/challenge.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult } from 'express-validator';
import { challengeValidation } from '../utils/validation/challengeValidation.js';

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
 *   name: AdminChallenges
 *   description: Admin challenge management
 */

/**
 * @swagger
 * /admin/challenges:
 *   get:
 *     summary: Get all challenges with optional filtering
 *     tags: [AdminChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Filter by assignment number
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mcq_quiz, coding_challenge, file_upload]
 *         description: Filter by challenge type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of challenges
 */
router.get('/challenges', isAuthenticated, roleBasedAccess(['tutor']), getAllChallenges);

/**
 * @swagger
 * /admin/challenges/{id}:
 *   get:
 *     summary: Get challenge by ID
 *     tags: [AdminChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     responses:
 *       200:
 *         description: Challenge details
 *       404:
 *         description: Challenge not found
 */
router.get('/challenges/:id', isAuthenticated, roleBasedAccess(['tutor']), getChallengeById);

/**
 * @swagger
 * /admin/challenges:
 *   post:
 *     summary: Create a new challenge
 *     tags: [AdminChallenges]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - assignmentNumber
 *               - title
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [mcq_quiz, coding_challenge, file_upload]
 *               assignmentNumber:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               maxScore:
 *                 type: integer
 *               timeLimit:
 *                 type: integer
 *                 nullable: true
 *                 description: Time limit in minutes (null means no limit)
 *               questionCount:
 *                 type: integer
 *                 description: Number of questions for MCQ quiz
 *               problemId:
 *                 type: string
 *                 description: ID of the coding problem (for coding challenges)
 *     responses:
 *       201:
 *         description: Challenge created successfully
 */
router.post('/challenges', 
  isAuthenticated, 
  roleBasedAccess(['tutor']), 
  challengeValidation,
  validate,
  createChallenge
);

/**
 * @swagger
 * /admin/challenges/{id}:
 *   patch:
 *     summary: Update a challenge
 *     tags: [AdminChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               maxScore:
 *                 type: integer
 *               timeLimit:
 *                 type: integer
 *                 nullable: true
 *               active:
 *                 type: boolean
 *               questionCount:
 *                 type: integer
 *               problemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Challenge updated successfully
 *       404:
 *         description: Challenge not found
 */
router.patch('/challenges/:id', isAuthenticated, roleBasedAccess(['tutor']), updateChallenge);

/**
 * @swagger
 * /admin/challenges/{id}:
 *   delete:
 *     summary: Delete a challenge
 *     tags: [AdminChallenges]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge ID
 *     responses:
 *       200:
 *         description: Challenge deleted successfully
 *       404:
 *         description: Challenge not found
 */
router.delete('/challenges/:id', isAuthenticated, roleBasedAccess(['tutor']), deleteChallenge);

export default router;
