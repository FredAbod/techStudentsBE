import express from 'express';
import { 
  getAllStudents, 
  getStudentById, 
  getCurrentStudent, 
  updateStudent, 
  importStudents,
  updateStudentProfile 
} from '../resources/user/controllers/student.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { handleCSVUpload } from '../middleware/fileUpload.js';
import { studentUpdateValidation } from '../utils/validation/studentValidation.js';
import { validationResult } from 'express-validator';

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
 *   name: Students
 *   description: Student management
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students (tutor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *   post:
 *     summary: Bulk import students from CSV (tutor only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Students imported
 */

/**
 * @swagger
 * /students/me:
 *   get:
 *     summary: Get current student's own record
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student record
 */

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student data
 *   patch:
 *     summary: Update student data
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               certificationStatus:
 *                 type: boolean
 *               totalPoints:
 *                 type: number
 *     responses:
 *       200:
 *         description: Student updated
 */

/**
 * @swagger
 * /students/profile:
 *   put:
 *     summary: Update student profile fields (WhatsApp, Telegram, GitHub, profile picture)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               whatsapp:
 *                 type: string
 *               telegram:
 *                 type: string
 *               github:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 description: Cloudinary URL
 *     responses:
 *       200:
 *         description: Profile updated
 */

// Student routes
router.get('/', isAuthenticated, roleBasedAccess(['tutor']), getAllStudents);
router.get('/me', isAuthenticated, roleBasedAccess(['student']), getCurrentStudent);
router.get('/:id', isAuthenticated, getStudentById);
router.patch('/:id', isAuthenticated, studentUpdateValidation, validate, updateStudent);
router.post('/import', isAuthenticated, roleBasedAccess(['tutor']), handleCSVUpload, importStudents);
router.put('/profile', isAuthenticated, updateStudentProfile);

export default router;
