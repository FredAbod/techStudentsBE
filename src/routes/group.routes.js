import express from 'express';
import { getMyGroup, getAllGroups } from '../resources/user/controllers/group.controller.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import roleBasedAccess from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Student group management
 */

/**
 * @swagger
 * /groups/my-group:
 *   get:
 *     summary: Get the group of the authenticated student
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's group
 */
router.get('/my-group', isAuthenticated, getMyGroup);

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups (admin/tutor only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get('/', isAuthenticated, roleBasedAccess(['tutor']), getAllGroups);

export default router;
