import express from 'express';
import {
  getAllStudents,
  getStudentById,
  updateStudentAttendance
} from '../resources/user/controllers/admin/student.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AdminStudents
 *   description: Admin/Tutor student management
 */

/**
 * @swagger
 * /admin/students:
 *   get:
 *     summary: Get all students with their data
 *     tags: [AdminStudents]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email or serial number
 *       - in: query
 *         name: certified
 *         schema:
 *           type: boolean
 *         description: Filter by certification status
 *     responses:
 *       200:
 *         description: List of students with their data
 */
router.get('/students', isAuthenticated, roleBasedAccess(['tutor']), getAllStudents);

/**
 * @swagger
 * /admin/students/{id}:
 *   get:
 *     summary: Get specific student details
 *     tags: [AdminStudents]
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
 *         description: Student details
 */
router.get('/students/:id', isAuthenticated, roleBasedAccess(['tutor']), getStudentById);

/**
 * @swagger
 * /admin/students/{id}/attendance:
 *   patch:
 *     summary: Update student attendance for a specific date
 *     tags: [AdminStudents]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               present:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated
 */
router.patch('/students/:id/attendance', isAuthenticated, roleBasedAccess(['tutor']), updateStudentAttendance);

export default router;
