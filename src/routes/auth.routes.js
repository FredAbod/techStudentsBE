import express from 'express';
import { 
  signup,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword
} from '../resources/user/controllers/auth.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', isAuthenticated, getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
