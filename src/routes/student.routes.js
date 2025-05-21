import express from 'express';
import { 
  getAllStudents, 
  getStudentById, 
  getCurrentStudent, 
  updateStudent, 
  importStudents 
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

// Student routes
router.get('/', isAuthenticated, roleBasedAccess(['tutor']), getAllStudents);
router.get('/me', isAuthenticated, roleBasedAccess(['student']), getCurrentStudent);
router.get('/:id', isAuthenticated, getStudentById);
router.patch('/:id', isAuthenticated, studentUpdateValidation, validate, updateStudent);
router.post('/import', isAuthenticated, roleBasedAccess(['tutor']), handleCSVUpload, importStudents);

export default router;
