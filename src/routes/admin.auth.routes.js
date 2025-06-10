import express from 'express';
import { 
  login, 
  logout, 
  getCurrentTutor 
} from '../resources/user/controllers/admin/auth.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AdminAuth
 *   description: Admin/Tutor authentication endpoints
 */

/**
 * @swagger
 * /auth/tutor/login:
 *   post:
 *     summary: Tutor login with email/password
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/tutor/logout:
 *   post:
 *     summary: Tutor logout
 *     tags: [AdminAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', isAuthenticated, logout);

/**
 * @swagger
 * /auth/tutor/me:
 *   get:
 *     summary: Get current tutor profile
 *     tags: [AdminAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current tutor data
 */
router.get('/me', isAuthenticated, roleBasedAccess(['tutor']), getCurrentTutor);

export default router;
