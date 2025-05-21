import express from 'express';
import { 
  submitAssignment, 
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

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

// Assignment routes
router.post('/', isAuthenticated, assignmentSubmitValidation, validate, handleAssignmentUpload, submitAssignment);
router.get('/', isAuthenticated, getAssignments);
router.get('/:id', isAuthenticated, getAssignmentById);
router.patch('/:id', isAuthenticated, roleBasedAccess(['tutor']), updateAssignment);

export default router;
