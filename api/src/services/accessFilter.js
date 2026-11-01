const TaskShare = require('../models/TaskShare');

async function accessFilter(userId, scope = 'all') {
  const sharedIds = (await TaskShare.find({ userId }).select('taskId')).map((s) => s.taskId);

  const access = [];
  if (scope === 'all' || scope === 'created') {
    access.push({ createdBy: userId });
  }
  if (scope === 'all' || scope === 'assigned') {
    access.push({ assigneeIds: userId }, { primaryAssigneeId: userId });
  }
  if (scope === 'all' || scope === 'shared') {
    access.push({ _id: { $in: sharedIds } });
  }

  return { $or: access };
}

module.exports = { accessFilter };