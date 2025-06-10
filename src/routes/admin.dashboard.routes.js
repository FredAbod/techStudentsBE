import express from 'express';
import {
  getDashboardStats,
  generateCertifiedStudentsReport,
  generateAllStudentsReport,
  getAttendanceDates,
  bulkUpdateAttendance,
  importUsers
} from '../resources/user/controllers/admin/dashboard.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { handleCSVUpload } from '../middleware/fileUpload.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AdminDashboard
 *   description: Admin/Tutor dashboard and reporting
 */

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard/stats', isAuthenticated, roleBasedAccess(['tutor']), getDashboardStats);

/**
 * @swagger
 * /admin/reports/certified-students:
 *   get:
 *     summary: Generate CSV report of certified students
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV report
 *         content:
 *           application/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/reports/certified-students', isAuthenticated, roleBasedAccess(['tutor']), generateCertifiedStudentsReport);

/**
 * @swagger
 * /admin/reports/all-students:
 *   get:
 *     summary: Generate comprehensive CSV report
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV report
 *         content:
 *           application/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/reports/all-students', isAuthenticated, roleBasedAccess(['tutor']), generateAllStudentsReport);

/**
 * @swagger
 * /admin/attendance/dates:
 *   get:
 *     summary: Get all class dates for attendance management
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attendance dates
 */
router.get('/attendance/dates', isAuthenticated, roleBasedAccess(['tutor']), getAttendanceDates);

/**
 * @swagger
 * /admin/attendance/bulk-update:
 *   post:
 *     summary: Bulk update attendance for multiple students
 *     tags: [AdminDashboard]
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
 *               - students
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - studentId
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     present:
 *                       type: boolean
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Attendance updated
 */
router.post('/attendance/bulk-update', isAuthenticated, roleBasedAccess(['tutor']), bulkUpdateAttendance);

/**
 * @swagger
 * /admin/import/users:
 *   post:
 *     summary: Import users from CSV file
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Users imported
 */
router.post('/import/users', isAuthenticated, roleBasedAccess(['tutor']), handleCSVUpload, importUsers);

export default router;
