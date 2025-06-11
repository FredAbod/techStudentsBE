import express from 'express';
import {
  getDashboardStats,
  generateCertifiedStudentsReport,
  generateAllStudentsReport,
  getAttendanceDates,
  bulkUpdateAttendance,
  importUsers,
  getAttendanceStats,
  getClassAttendanceSummary,
  getStudentAttendanceByDate,
  getGroupAttendanceStats,
  getGroupAttendanceDetail,
  getStudentAttendanceComparison,
  getAttendanceTrends
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

/**
 * @swagger
 * /admin/attendance/stats:
 *   get:
 *     summary: Get comprehensive attendance statistics
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance statistics
 */
router.get('/attendance/stats', isAuthenticated, roleBasedAccess(['tutor']), getAttendanceStats);

/**
 * @swagger
 * /admin/attendance/classes:
 *   get:
 *     summary: Get attendance summary for all classes
 *     tags: [AdminDashboard]
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
 *     responses:
 *       200:
 *         description: List of classes with attendance data
 */
router.get('/attendance/classes', isAuthenticated, roleBasedAccess(['tutor']), getClassAttendanceSummary);

/**
 * @swagger
 * /admin/attendance/class/{date}:
 *   get:
 *     summary: Get attendance breakdown by students for a specific class date
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Class date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Student attendance for the specified class
 */
router.get('/attendance/class/:date', isAuthenticated, roleBasedAccess(['tutor']), getStudentAttendanceByDate);

/**
 * @swagger
 * /admin/attendance/groups:
 *   get:
 *     summary: Get attendance statistics for all student groups
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group attendance statistics
 */
router.get('/attendance/groups', isAuthenticated, roleBasedAccess(['tutor']), getGroupAttendanceStats);

/**
 * @swagger
 * /admin/attendance/group/{groupId}:
 *   get:
 *     summary: Get detailed attendance information for a specific group
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the student group
 *     responses:
 *       200:
 *         description: Detailed group attendance information
 *       404:
 *         description: Group not found
 */
router.get('/attendance/group/:groupId', isAuthenticated, roleBasedAccess(['tutor']), getGroupAttendanceDetail);

/**
 * @swagger
 * /admin/attendance/compare:
 *   post:
 *     summary: Compare attendance patterns between selected students
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
 *               - studentIds
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of student IDs to compare (minimum 2)
 *     responses:
 *       200:
 *         description: Student attendance comparison with pattern analysis
 *       400:
 *         description: Invalid input - at least two valid student IDs required
 */
router.post('/attendance/compare', isAuthenticated, roleBasedAccess(['tutor']), getStudentAttendanceComparison);

/**
 * @swagger
 * /admin/attendance/trends:
 *   get:
 *     summary: Get attendance trends over time
 *     tags: [AdminDashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance trends grouped by time periods (weekly or monthly)
 */
router.get('/attendance/trends', isAuthenticated, roleBasedAccess(['tutor']), getAttendanceTrends);

export default router;
