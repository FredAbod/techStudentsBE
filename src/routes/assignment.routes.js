import express from 'express';
import { 
  submitAndGradeAssignment, 
  getAssignments, 
  getAssignmentById, 
  updateAssignment 
} from '../resources/user/controllers/assignment.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { handleAssignmentUpload } from '../middleware/fileUpload.js';
import { assignmentSubmitValidation } from '../utils/validation/assignmentValidation.js';
import { validationResult } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Assignment management
 */

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Submit new assignment (file upload)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Assignment submitted
 *   get:
 *     summary: Get all assignments (filter by student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments
 */

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     summary: Get specific assignment
 *     tags: [Assignments]
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
 *         description: Assignment data
 *   patch:
 *     summary: Update assignment (for grading)
 *     tags: [Assignments]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment updated
 */

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

// Assignment routes
router.post('/', isAuthenticated, handleAssignmentUpload, submitAndGradeAssignment);
router.get('/', isAuthenticated, getAssignments);
router.get('/:id', isAuthenticated, getAssignmentById);
router.patch('/:id', isAuthenticated, roleBasedAccess(['tutor']), updateAssignment);

export default router;
