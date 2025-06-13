import express from 'express';
import {
  getAllMCQQuestions,
  getMCQQuestionsByAssignment,
  getMCQQuestionById,
  createMCQQuestion,
  updateMCQQuestion,
  deleteMCQQuestion
} from '../resources/user/controllers/admin/mcq.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult } from 'express-validator';
import { mcqQuestionValidation } from '../utils/validation/challengeValidation.js';

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
 *   name: AdminMCQs
 *   description: Admin MCQ question management
 */

/**
 * @swagger
 * /admin/mcq:
 *   get:
 *     summary: Get all MCQ questions with optional filtering
 *     tags: [AdminMCQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentNumber
 *         schema:
 *           type: integer
 *         description: Filter by assignment number
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
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
 *         description: List of MCQ questions
 */
router.get('/mcq', isAuthenticated, roleBasedAccess(['tutor']), getAllMCQQuestions);

/**
 * @swagger
 * /admin/mcq/{id}:
 *   get:
 *     summary: Get MCQ question by ID
 *     tags: [AdminMCQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MCQ question ID
 *     responses:
 *       200:
 *         description: MCQ question details
 *       404:
 *         description: Question not found
 */
router.get('/mcq/:id', isAuthenticated, roleBasedAccess(['tutor']), getMCQQuestionById);

/**
 * @swagger
 * /admin/mcq/assignment/{number}:
 *   get:
 *     summary: Get all MCQ questions for a specific assignment
 *     tags: [AdminMCQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assignment number
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *     responses:
 *       200:
 *         description: List of MCQ questions for the specified assignment
 */
router.get('/mcq/assignment/:number', isAuthenticated, roleBasedAccess(['tutor']), getMCQQuestionsByAssignment);

/**
 * @swagger
 * /admin/mcq:
 *   post:
 *     summary: Create a new MCQ question
 *     tags: [AdminMCQs]
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
 *               - question
 *               - options
 *               - correctAnswer
 *             properties:
 *               assignmentNumber:
 *                 type: integer
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: integer
 *                 description: Index of the correct option
 *               explanation:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *     responses:
 *       201:
 *         description: MCQ question created successfully
 */
router.post('/mcq', 
  isAuthenticated, 
  roleBasedAccess(['tutor']), 
  mcqQuestionValidation,
  validate,
  createMCQQuestion
);

/**
 * @swagger
 * /admin/mcq/{id}:
 *   patch:
 *     summary: Update an MCQ question
 *     tags: [AdminMCQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MCQ question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignmentNumber:
 *                 type: integer
 *               question:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 type: integer
 *               explanation:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *     responses:
 *       200:
 *         description: MCQ question updated successfully
 *       404:
 *         description: Question not found
 */
router.patch('/mcq/:id', isAuthenticated, roleBasedAccess(['tutor']), updateMCQQuestion);

/**
 * @swagger
 * /admin/mcq/{id}:
 *   delete:
 *     summary: Delete an MCQ question
 *     tags: [AdminMCQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MCQ question ID
 *     responses:
 *       200:
 *         description: MCQ question deleted successfully
 *       404:
 *         description: Question not found
 */
router.delete('/mcq/:id', isAuthenticated, roleBasedAccess(['tutor']), deleteMCQQuestion);

export default router;
