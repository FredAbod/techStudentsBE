import express from 'express';
import {
  getAllAssignments,
  getAssignmentById,
  gradeAssignment,
  getSubmissionsByAssignmentNumber
} from '../resources/user/controllers/admin/assignment.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AdminAssignments
 *   description: Admin/Tutor assignment management
 */

/**
 * @swagger
 * /admin/assignments:
 *   get:
 *     summary: Get all student assignments
 *     tags: [AdminAssignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: graded
 *         schema:
 *           type: boolean
 *         description: Filter by graded status
 *     responses:
 *       200:
 *         description: List of assignments
 */
router.get('/assignments', isAuthenticated, roleBasedAccess(['tutor']), getAllAssignments);

/**
 * @swagger
 * /admin/assignments/{id}:
 *   get:
 *     summary: Get specific assignment details
 *     tags: [AdminAssignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assignment details
 */
router.get('/assignments/:id', isAuthenticated, roleBasedAccess(['tutor']), getAssignmentById);

/**
 * @swagger
 * /admin/assignments/{id}/grade:
 *   patch:
 *     summary: Grade an assignment
 *     tags: [AdminAssignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment graded
 */
router.patch('/assignments/:id/grade', isAuthenticated, roleBasedAccess(['tutor']), gradeAssignment);

/**
 * @swagger
 * /admin/assignments/submissions/{assignmentNumber}:
 *   get:
 *     summary: Get all submissions for a specific assignment number
 *     tags: [AdminAssignments]
 *     parameters:
 *       - in: path
 *         name: assignmentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment number (1, 2, etc.)
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of submissions for the assignment
 */
router.get('/assignments/submissions/:assignmentNumber', isAuthenticated, roleBasedAccess(['tutor']), getSubmissionsByAssignmentNumber);

export default router;
