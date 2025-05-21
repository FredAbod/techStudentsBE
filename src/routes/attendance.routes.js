import express from 'express';
import { 
  markAttendance, 
  getAttendanceRecords, 
  deleteAttendanceRecord 
} from '../resources/user/controllers/attendance.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance tracking
 */

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Mark attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               present:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance marked
 *   get:
 *     summary: Get attendance records (filter by student, date)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Student ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: present
 *         schema:
 *           type: boolean
 *         description: Present status
 *     responses:
 *       200:
 *         description: List of attendance records
 */

/**
 * @swagger
 * /attendance/{id}:
 *   delete:
 *     summary: Remove attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance record deleted
 */

// Attendance routes
router.post('/', isAuthenticated, roleBasedAccess(['tutor']), markAttendance);
router.get('/', isAuthenticated, getAttendanceRecords);
router.delete('/:id', isAuthenticated, roleBasedAccess(['tutor']), deleteAttendanceRecord);

export default router;
