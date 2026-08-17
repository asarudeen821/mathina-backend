/**
 * Conversation Memory Manager
 * Stores short-term conversation history for context-aware responses
 * Uses in-memory storage with automatic cleanup
 */

const SESSIONS = new Map();
const MAX_HISTORY_LENGTH = 10;
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get conversation history for a user
 * @param {string} userId - User identifier
 * @returns {Array} Array of message objects {role, content, timestamp}
 */
export const getHistory = (userId) => {
  const session = SESSIONS.get(userId);
  
  if (!session) {
    return [];
  }

  // Check if session has expired
  if (Date.now() - session.lastActive > SESSION_TTL) {
    SESSIONS.delete(userId);
    return [];
  }

  return session.history || [];
};

/**
 * Save a message to conversation history
 * @param {string} userId - User identifier
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 */
export const saveMessage = (userId, role, content) => {
  let session = SESSIONS.get(userId);

  if (!session) {
    session = {
      history: [],
      lastActive: Date.now(),
      metadata: {
        startedAt: Date.now(),
        messageCount: 0,
      },
    };
  }

  // Add message with timestamp
  session.history.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  // Limit history length
  if (session.history.length > MAX_HISTORY_LENGTH) {
    session.history = session.history.slice(-MAX_HISTORY_LENGTH);
  }

  // Update session metadata
  session.lastActive = Date.now();
  session.metadata.messageCount += 1;

  SESSIONS.set(userId, session);
};

/**
 * Clear conversation history for a user
 * @param {string} userId - User identifier
 */
export const clearHistory = (userId) => {
  SESSIONS.delete(userId);
};

/**
 * Get session metadata
 * @param {string} userId - User identifier
 * @returns {Object|null} Session metadata or null if no session
 */
export const getSessionMetadata = (userId) => {
  const session = SESSIONS.get(userId);
  return session ? session.metadata : null;
};

/**
 * Get active session count (for monitoring)
 * @returns {number} Number of active sessions
 */
export const getActiveSessionCount = () => {
  const now = Date.now();
  let count = 0;

  SESSIONS.forEach((session) => {
    if (now - session.lastActive < SESSION_TTL) {
      count++;
    }
  });

  return count;
};

/**
 * Cleanup expired sessions (run periodically)
 */
export const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleaned = 0;

  SESSIONS.forEach((session, userId) => {
    if (now - session.lastActive > SESSION_TTL) {
      SESSIONS.delete(userId);
      cleaned++;
    }
  });

  if (cleaned > 0) {
    console.log(`[AI Memory] Cleaned up ${cleaned} expired sessions`);
  }
};

// Auto-cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

export default {
  getHistory,
  saveMessage,
  clearHistory,
  getSessionMetadata,
  getActiveSessionCount,
  cleanupExpiredSessions,
};
