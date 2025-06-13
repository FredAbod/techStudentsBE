// WebSocket event simulation routes
import express from 'express';
import { successResMsg, errorResMsg } from '../utils/lib/response.js';
import logger from '../utils/log/logger.js';
import { challengeEvents } from '../utils/helper/websocketEvents.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WebSocketSimulation
 *   description: WebSocket event simulation for testing
 */

/**
 * @swagger
 * /simulate-event:
 *   post:
 *     summary: Simulate a WebSocket event
 *     tags: [WebSocketSimulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelType
 *               - channelId
 *               - eventType
 *               - data
 *             properties:
 *               channelType:
 *                 type: string
 *                 enum: [challenge, assignment, user, admin]
 *                 description: Type of channel to emit to
 *               channelId:
 *                 type: string
 *                 description: ID of the channel
 *               eventType:
 *                 type: string
 *                 description: Event type to emit
 *               data:
 *                 type: object
 *                 description: Event data payload
 *     responses:
 *       200:
 *         description: Event simulated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/simulate-event', (req, res) => {
  try {
    const { channelType, channelId, eventType, data } = req.body;
    
    if (!channelType || !channelId || !eventType || !data) {
      return errorResMsg(res, 400, 'Missing required fields');
    }
    
    // Create an emitter function based on channel type
    const emitter = {
      challenge: (id, event, payload) => {
        if (!req.emitToChallenge) {
          return { success: false, reason: 'WebSocket emitter not available' };
        }
        req.emitToChallenge(id, event, payload);
        return { success: true };
      },
      assignment: (id, event, payload) => {
        if (!req.emitToAssignment) {
          return { success: false, reason: 'WebSocket emitter not available' };
        }
        req.emitToAssignment(id, event, payload);
        return { success: true };
      },
      user: (id, event, payload) => {
        if (!req.emitToUser) {
          return { success: false, reason: 'WebSocket emitter not available' };
        }
        req.emitToUser(id, event, payload);
        return { success: true };
      },
      admin: (event, payload) => {
        if (!req.emitToAdmin) {
          return { success: false, reason: 'WebSocket emitter not available' };
        }
        req.emitToAdmin(event, payload);
        return { success: true };
      }
    };
    
    // Emit the event
    let result;
    if (channelType === 'admin') {
      result = emitter.admin(eventType, data);
    } else {
      result = emitter[channelType](channelId, eventType, data);
    }
    
    if (!result.success) {
      return errorResMsg(res, 500, `Failed to emit event: ${result.reason}`);
    }
    
    logger.info(`Simulated ${eventType} event on ${channelType}:${channelId}`);
    
    return successResMsg(res, 200, {
      message: 'Event simulated successfully',
      details: {
        channelType,
        channelId,
        eventType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error simulating event: ${error.message}`);
    return errorResMsg(res, 500, 'Error simulating event');
  }
});

/**
 * @swagger
 * /simulate-file-access:
 *   post:
 *     summary: Simulate a file access event
 *     tags: [WebSocketSimulation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessType
 *               - submissionId
 *               - studentId
 *             properties:
 *               accessType:
 *                 type: string
 *                 enum: [view, download]
 *                 description: Type of access
 *               submissionId:
 *                 type: string
 *                 description: ID of the submission
 *               studentId:
 *                 type: string
 *                 description: ID of the student
 *     responses:
 *       200:
 *         description: File access event simulated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/simulate-file-access', (req, res) => {
  try {
    const { accessType, submissionId, studentId } = req.body;
    
    if (!accessType || !submissionId || !studentId) {
      return errorResMsg(res, 400, 'Missing required fields');
    }
    
    if (accessType !== 'view' && accessType !== 'download') {
      return errorResMsg(res, 400, 'Access type must be "view" or "download"');
    }
    
    // Simulate the appropriate WebSocket event
    if (accessType === 'view') {
      challengeEvents.fileViewed(req, submissionId, studentId);
    } else {
      challengeEvents.fileDownloaded(req, submissionId, studentId);
    }
    
    logger.info(`Simulated ${accessType} access event for submission ${submissionId} by student ${studentId}`);
    
    return successResMsg(res, 200, {
      message: 'File access event simulated successfully',
      details: {
        accessType,
        submissionId,
        studentId,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error simulating file access event: ${error.message}`);
    return errorResMsg(res, 500, 'Error simulating file access event');
  }
});

export default router;
