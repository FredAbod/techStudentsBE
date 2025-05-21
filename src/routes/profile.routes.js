import express from 'express';
import { 
  getProfileById, 
  updateProfile, 
  getAllProfiles 
} from '../resources/user/controllers/profile.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';
import { handleAvatarUpload } from '../middleware/fileUpload.js';

const router = express.Router();

// Profile routes
router.get('/:id', isAuthenticated, getProfileById);
router.patch('/:id', isAuthenticated, handleAvatarUpload, updateProfile);
router.get('/', isAuthenticated, roleBasedAccess(['tutor']), getAllProfiles);

export default router;
