const TaskShare = require('../models/TaskShare');

function rawId(value) {
  return value && value._id ? value._id : value;
}

function person(u) {
  if (!u) return null;
  if (u.fullName) {
    return { id: String(u._id), fullName: u.fullName, email: u.email };
  }
  return { id: String(u) };
}

function formatTask(task, myRole = null) {
  return {
    id: String(task._id),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdBy: person(task.createdBy),
    primaryAssignee: person(task.primaryAssigneeId),
    assignees: task.assigneeIds.map((u) => person(u)).filter(Boolean),
    myRole,
  };
}

// Trả về 'creator', 'assignee', 'viewer', 'editor' hoặc null nếu không có quyền
async function getAccess(task, userId) {
  const uid = String(userId);

  if (String(rawId(task.createdBy)) === uid) return 'creator';

  const isAssignee =
    task.assigneeIds.some((a) => String(rawId(a)) === uid) ||
    (task.primaryAssigneeId && String(rawId(task.primaryAssigneeId)) === uid);
  if (isAssignee) return 'assignee';

  const share = await TaskShare.findOne({ taskId: task._id, userId });
  return share ? share.permission : null;
}

module.exports = { formatTask, getAccess };