import express from 'express';
import { 
  markAttendance, 
  getAttendanceRecords, 
  deleteAttendanceRecord 
} from '../resources/user/controllers/attendance.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';

const router = express.Router();

// Attendance routes
router.post('/', isAuthenticated, roleBasedAccess(['tutor']), markAttendance);
router.get('/', isAuthenticated, getAttendanceRecords);
router.delete('/:id', isAuthenticated, roleBasedAccess(['tutor']), deleteAttendanceRecord);

export default router;
