// WebSocket event middleware for real-time features
import logger from '../utils/log/logger.js';

/**
 * Sets up WebSocket events for challenge-related real-time updates
 * @param {Object} io - Socket.io instance
 */
export const setupChallengeWebSocketEvents = (io) => {
  // Challenge namespace
  const challengeNamespace = io.of('/challenges');
  
  challengeNamespace.on('connection', (socket) => {
    logger.info(`WebSocket client connected to challenges namespace: ${socket.id}`);
    
    // Join rooms for specific challenge types
    socket.on('join-challenge', (data) => {
      const { challengeId, userId } = data;
      if (!challengeId) return;
      
      const room = `challenge-${challengeId}`;
      socket.join(room);
      logger.info(`User ${userId} joined challenge room: ${room}`);
      
      // Notify others that a new participant joined
      socket.to(room).emit('user-joined', { userId, timestamp: new Date() });
    });
    
    // Quiz submission event
    socket.on('quiz-submitted', (data) => {
      const { challengeId, userId, score } = data;
      if (!challengeId) return;
      
      const room = `challenge-${challengeId}`;
      // Broadcast submission to tutors and admin in the room
      socket.to(room).emit('submission-update', { 
        type: 'quiz',
        userId,
        score,
        timestamp: new Date()
      });
    });
    
    // Code submission event
    socket.on('code-submitted', (data) => {
      const { challengeId, userId, status } = data;
      if (!challengeId) return;
      
      const room = `challenge-${challengeId}`;
      // Broadcast submission to tutors and admin in the room
      socket.to(room).emit('submission-update', { 
        type: 'code',
        userId,
        status,
        timestamp: new Date()
      });
    });
    
    // Listen for test execution events
    socket.on('test-case-run', (data) => {
      const { challengeId, userId, testIndex, passed } = data;
      if (!challengeId) return;
      
      const room = `challenge-${challengeId}`;
      // Broadcast test result to the user's room
      socket.to(room).emit('test-result', { 
        userId,
        testIndex,
        passed,
        timestamp: new Date()
      });
    });
    
    // Auto-grading events
    socket.on('grading-started', (data) => {
      const { assignmentNumber } = data;
      if (!assignmentNumber) return;
      
      const room = `assignment-${assignmentNumber}`;
      socket.to(room).emit('grading-update', { 
        status: 'started',
        assignmentNumber,
        timestamp: new Date()
      });
    });
    
    socket.on('grading-progress', (data) => {
      const { assignmentNumber, progress, total } = data;
      if (!assignmentNumber) return;
      
      const room = `assignment-${assignmentNumber}`;
      socket.to(room).emit('grading-update', { 
        status: 'in-progress',
        assignmentNumber,
        progress,
        total,
        timestamp: new Date()
      });
    });
    
    socket.on('grading-complete', (data) => {
      const { assignmentNumber, results } = data;
      if (!assignmentNumber) return;
      
      const room = `assignment-${assignmentNumber}`;
      socket.to(room).emit('grading-update', { 
        status: 'completed',
        assignmentNumber,
        results,
        timestamp: new Date()
      });
    });
    
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected from challenges namespace: ${socket.id}`);
    });
  });
  
  return challengeNamespace;
};

/**
 * Creates middleware to handle WebSocket events from Express routes
 * @param {Object} io - Socket.io instance
 * @returns {Function} Middleware function
 */
export const createWebSocketMiddleware = (io) => {
  return (req, res, next) => {
    // Attach WebSocket emitter functions to the request object
    req.emitChallengeEvent = (event, data) => {
      try {
        const challengeNamespace = io.of('/challenges');
        challengeNamespace.emit(event, data);
      } catch (error) {
        logger.error(`Error emitting WebSocket event: ${error.message}`);
      }
    };
    
    req.emitToChallenge = (challengeId, event, data) => {
      try {
        const challengeNamespace = io.of('/challenges');
        const room = `challenge-${challengeId}`;
        challengeNamespace.to(room).emit(event, data);
      } catch (error) {
        logger.error(`Error emitting to challenge room: ${error.message}`);
      }
    };
    
    req.emitToAssignment = (assignmentNumber, event, data) => {
      try {
        const challengeNamespace = io.of('/challenges');
        const room = `assignment-${assignmentNumber}`;
        challengeNamespace.to(room).emit(event, data);
      } catch (error) {
        logger.error(`Error emitting to assignment room: ${error.message}`);
      }
    };
    
    next();
  };
};
