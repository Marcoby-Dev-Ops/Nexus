/**
 * Socket.IO Service
 * 
 * Provides real-time communication capabilities for the Nexus application.
 * Handles actionable insights, notifications, and other real-time features.
 */

const { logger } = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize the Socket.IO service with the io instance
   * @param {Server} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;
    logger.info('Socket.IO service initialized');
  }

  /**
   * Emit actionable insights to subscribed clients
   * @param {Object} insight - The insight data to emit
   * @param {string} insight.type - Type of insight (e.g., 'at-risk-deal-detected')
   * @param {Object} insight.data - The insight payload
   */
  emitActionableInsight(insight) {
    if (!this.io) {
      logger.warn('Socket.IO service not initialized, cannot emit insight');
      return;
    }

    try {
      logger.info('Emitting actionable insight', { 
        type: insight.type, 
        data: insight.data 
      });

      // Emit to all clients subscribed to insights
      this.io.to('insights').emit(insight.type, insight.data);

      // Also emit to specific user if userId is provided
      if (insight.userId) {
        this.io.to(`user:${insight.userId}`).emit(insight.type, insight.data);
      }

    } catch (error) {
      logger.error('Failed to emit actionable insight', { 
        error: error.message, 
        insight 
      });
    }
  }

  /**
   * Emit a notification to a specific user
   * @param {string} userId - Target user ID
   * @param {Object} notification - Notification data
   */
  emitUserNotification(userId, notification) {
    if (!this.io) {
      logger.warn('Socket.IO service not initialized, cannot emit notification');
      return;
    }

    try {
      logger.info('Emitting user notification', { userId, notification });

      this.io.to(`user:${userId}`).emit('notification', notification);

    } catch (error) {
      logger.error('Failed to emit user notification', { 
        error: error.message, 
        userId, 
        notification 
      });
    }
  }

  /**
   * Emit a broadcast message to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitBroadcast(event, data) {
    if (!this.io) {
      logger.warn('Socket.IO service not initialized, cannot emit broadcast');
      return;
    }

    try {
      logger.info('Emitting broadcast message', { event, data });

      this.io.emit(event, data);

    } catch (error) {
      logger.error('Failed to emit broadcast message', { 
        error: error.message, 
        event, 
        data 
      });
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection stats
   */
  getConnectionStats() {
    if (!this.io) {
      return { connected: 0, rooms: 0 };
    }

    const sockets = Array.from(this.io.sockets.sockets.values());
    const rooms = Array.from(this.io.sockets.adapter.rooms.keys());

    return {
      connected: sockets.length,
      rooms: rooms.length,
      sockets: sockets.map(socket => ({
        id: socket.id,
        userId: socket.userId,
        rooms: Array.from(socket.rooms)
      }))
    };
  }

  /**
   * Disconnect a specific user
   * @param {string} userId - User ID to disconnect
   */
  disconnectUser(userId) {
    if (!this.io) {
      logger.warn('Socket.IO service not initialized, cannot disconnect user');
      return;
    }

    try {
      const sockets = Array.from(this.io.sockets.sockets.values());
      const userSockets = sockets.filter(socket => socket.userId === userId);

      userSockets.forEach(socket => {
        socket.disconnect(true);
        logger.info('Disconnected user socket', { userId, socketId: socket.id });
      });

    } catch (error) {
      logger.error('Failed to disconnect user', { 
        error: error.message, 
        userId 
      });
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;

