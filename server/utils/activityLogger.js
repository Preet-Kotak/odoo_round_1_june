const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({
  userId,
  userName,
  userRole,
  action,
  recordType,
  recordId,
  recordReference,
  details,
  ipAddress,
}) => {
  try {
    await ActivityLog.create({
      userId,
      userName,
      userRole,
      action,
      recordType,
      recordId,
      recordReference,
      details,
      ipAddress,
    });
  } catch (error) {
    // Logging should never break the main flow
    console.error('Activity log failed:', error.message);
  }
};

module.exports = { logActivity };
