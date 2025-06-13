import express from 'express';
import {
  getAllCodingProblems,
  getCodingProblemsByAssignment,
  getCodingProblemById,
  createCodingProblem,
  updateCodingProblem,
  deleteCodingProblem
} from '../resources/user/controllers/admin/codingProblem.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { validationResult } from 'express-validator';
import { codingProblemValidation } from '../utils/validation/challengeValidation.js';

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
 *   name: AdminCodingProblems
 *   description: Admin coding problem management
 */

/**
 * @swagger
 * /admin/coding:
 *   get:
 *     summary: Get all coding problems with optional filtering
 *     tags: [AdminCodingProblems]
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
 *         description: List of coding problems
 */
router.get('/coding', isAuthenticated, roleBasedAccess(['tutor']), getAllCodingProblems);

/**
 * @swagger
 * /admin/coding/{id}:
 *   get:
 *     summary: Get coding problem by ID
 *     tags: [AdminCodingProblems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coding problem ID
 *     responses:
 *       200:
 *         description: Coding problem details
 *       404:
 *         description: Problem not found
 */
router.get('/coding/:id', isAuthenticated, roleBasedAccess(['tutor']), getCodingProblemById);

/**
 * @swagger
 * /admin/coding/assignment/{number}:
 *   get:
 *     summary: Get all coding problems for a specific assignment
 *     tags: [AdminCodingProblems]
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
 *         description: List of coding problems for the specified assignment
 */
router.get('/coding/assignment/:number', isAuthenticated, roleBasedAccess(['tutor']), getCodingProblemsByAssignment);

/**
 * @swagger
 * /admin/coding:
 *   post:
 *     summary: Create a new coding problem
 *     tags: [AdminCodingProblems]
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
 *               - title
 *               - description
 *               - testCases
 *             properties:
 *               assignmentNumber:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               timeLimit:
 *                 type: integer
 *                 description: Time limit in minutes
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *                     isHidden:
 *                       type: boolean
 *               starterCode:
 *                 type: string
 *               constraints:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Coding problem created successfully
 */
router.post('/coding', 
  isAuthenticated, 
  roleBasedAccess(['tutor']), 
  codingProblemValidation,
  validate,
  createCodingProblem
);

/**
 * @swagger
 * /admin/coding/{id}:
 *   patch:
 *     summary: Update a coding problem
 *     tags: [AdminCodingProblems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coding problem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignmentNumber:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               timeLimit:
 *                 type: integer
 *               testCases:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     output:
 *                       type: string
 *                     isHidden:
 *                       type: boolean
 *               starterCode:
 *                 type: string
 *               constraints:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coding problem updated successfully
 *       404:
 *         description: Problem not found
 */
router.patch('/coding/:id', isAuthenticated, roleBasedAccess(['tutor']), updateCodingProblem);

/**
 * @swagger
 * /admin/coding/{id}:
 *   delete:
 *     summary: Delete a coding problem
 *     tags: [AdminCodingProblems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coding problem ID
 *     responses:
 *       200:
 *         description: Coding problem deleted successfully
 *       404:
 *         description: Problem not found
 */
router.delete('/coding/:id', isAuthenticated, roleBasedAccess(['tutor']), deleteCodingProblem);

export default router;
