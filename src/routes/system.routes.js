// System routes for providing system information
import express from 'express';
import { successResMsg } from '../utils/lib/response.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System information and status
 */

/**
 * @swagger
 * /system-info:
 *   get:
 *     summary: Get system information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System information
 */
router.get('/system-info', (req, res) => {
  const systemInfo = {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    platform: process.platform
  };
  
  return successResMsg(res, 200, systemInfo);
});

export default router;
