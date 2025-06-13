// Enhanced WebSocket middleware for the platform
import logger from '../utils/log/logger.js';

/**
 * Create WebSocket middleware for Express
 * @param {Object} io - Socket.io instance
 * @returns {Function} Express middleware function
 */
export const createWebSocketMiddleware = (io) => {
  return function(req, res, next) {
    // Add event emitter functions to the request object
    
    // Emit to a specific challenge channel
    req.emitToChallenge = (challengeId, eventType, data) => {
      try {
        const channelName = `challenge-${challengeId}`;
        io.to(channelName).emit(eventType, { ...data, timestamp: new Date() });
        return true;
      } catch (error) {
        logger.error(`Error emitting to challenge channel: ${error.message}`);
        return false;
      }
    };
    
    // Emit to a specific assignment channel
    req.emitToAssignment = (assignmentNumber, eventType, data) => {
      try {
        const channelName = `assignment-${assignmentNumber}`;
        io.to(channelName).emit(eventType, { ...data, timestamp: new Date() });
        return true;
      } catch (error) {
        logger.error(`Error emitting to assignment channel: ${error.message}`);
        return false;
      }
    };
    
    // Emit to a specific user's personal channel
    req.emitToUser = (userId, eventType, data) => {
      try {
        const channelName = `user-${userId}`;
        io.to(channelName).emit(eventType, { ...data, timestamp: new Date() });
        return true;
      } catch (error) {
        logger.error(`Error emitting to user channel: ${error.message}`);
        return false;
      }
    };
    
    // Emit to the admin channel for monitoring and analytics
    req.emitToAdmin = (eventType, data) => {
      try {
        const channelName = 'admin-channel';
        io.to(channelName).emit(eventType, { ...data, timestamp: new Date() });
        return true;
      } catch (error) {
        logger.error(`Error emitting to admin channel: ${error.message}`);
        return false;
      }
    };
    
    next();
  };
};

/**
 * Setup WebSocket server and event handlers
 * @param {Object} io - Socket.io instance
 */
export const setupWebSocketServer = (io) => {
  // Handle connection events
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);
    
    // Get connection parameters from query string
    const channelType = socket.handshake.query.type;
    const channelId = socket.handshake.query.id;
    
    // Join appropriate channels based on the connection parameters
    if (channelType && channelId) {
      let channelName;
      
      switch (channelType) {
        case 'challenge':
          channelName = `challenge-${channelId}`;
          break;
        case 'assignment':
          channelName = `assignment-${channelId}`;
          break;
        case 'user':
          channelName = `user-${channelId}`;
          break;
        case 'admin':
          if (channelId === 'file-activity') {
            channelName = 'admin-file-activity';
          } else {
            channelName = 'admin-channel';
          }
          break;
        default:
          channelName = 'general';
      }
      
      socket.join(channelName);
      logger.info(`Client ${socket.id} joined channel: ${channelName}`);
      
      // Notify the client they've joined successfully
      socket.emit('channel-joined', {
        channel: channelName,
        timestamp: new Date()
      });
    } else {
      // If no specific channel is requested, join the general channel
      socket.join('general');
    }
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });
};
