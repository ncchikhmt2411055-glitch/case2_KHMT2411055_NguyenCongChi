const Task = require('../models/Task');
const { notifyEvent, recipientsOf } = require('./notificationService');

const DAY = 24 * 60 * 60 * 1000;

// Công việc chưa xong, đến hạn trong 24 giờ, chưa được nhắc
async function runReminders() {
  const now = new Date();
  const tasks = await Task.find({
    status: { $ne: 'completed' },
    dueDate: { $gt: now, $lte: new Date(now.getTime() + DAY) },
    reminderSentAt: null,
  });

  for (const task of tasks) {
    await notifyEvent({ userIds: recipientsOf(task), task, eventType: 'reminder' });
    await Task.updateOne({ _id: task._id }, { $set: { reminderSentAt: now } });
  }

  if (tasks.length) console.log(`Đã gửi nhắc việc cho ${tasks.length} công việc`);
}

module.exports = { runReminders };