const Task = require('../models/Task');
const TaskShare = require('../models/TaskShare');
const TaskActivity = require('../models/TaskActivity');
const User = require('../models/User');

const POPULATE = [
  { path: 'createdBy', select: 'fullName email' },
  { path: 'assigneeIds', select: 'fullName email' },
  { path: 'primaryAssigneeId', select: 'fullName email' },
];

function rawId(value) {
  return value && value._id ? value._id : value;
}

function person(u) {
  if (!u) return null;
  if (u.fullName) return { id: String(u._id), fullName: u.fullName, email: u.email };
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
    assignees: task.assigneeIds.filter(Boolean).map((u) => person(u)),
    myRole,
  };
}

// Trả về 'creator', 'assignee', 'viewer', 'editor' hoặc null
async function getAccess(task, userId) {
  const uid = String(userId);
  if (String(rawId(task.createdBy)) === uid) return 'creator';

  const isAssignee =
    task.assigneeIds.some((a) => a && String(rawId(a)) === uid) ||
    (task.primaryAssigneeId && String(rawId(task.primaryAssigneeId)) === uid);
  if (isAssignee) return 'assignee';

  const share = await TaskShare.findOne({ taskId: task._id, userId });
  return share ? share.permission : null;
}

// Tìm công việc và kiểm tra quyền xem. Trả về { task, role } hoặc { error, message }
async function loadTask(id, userId) {
  const task = await Task.findById(id).populate(POPULATE);
  if (!task) return { error: 404, message: 'Không tìm thấy công việc' };

  const role = await getAccess(task, userId);
  if (!role) return { error: 403, message: 'Bạn không có quyền truy cập công việc này' };

  return { task, role };
}

async function reloadTask(id) {
  return Task.findById(id).populate(POPULATE);
}

function canEdit(role) {
  return ['creator', 'assignee', 'editor'].includes(role);
}

function canManage(role) {
  return role === 'creator';
}

async function logActivity(taskId, userId, action, details = {}) {
  await TaskActivity.create({ taskId, userId, action, details });
}

// Kiểm tra tất cả id có tồn tại trong bảng users không
async function usersExist(ids) {
  const unique = [...new Set(ids.map(String))];
  const count = await User.countDocuments({ _id: { $in: unique } });
  return count === unique.length;
}

module.exports = {
  formatTask,
  person,
  getAccess,
  loadTask,
  reloadTask,
  canEdit,
  canManage,
  logActivity,
  usersExist,
};