const Notification = require('../models/Notification');

const createNotification = async ({
  userId,
  type,
  title,
  message,
  referenceId,
  referenceType,
}) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      message,
      referenceId,
      referenceType,
    });
  } catch (error) {
    console.error('Notification creation failed:', error.message);
  }
};

module.exports = { createNotification };
