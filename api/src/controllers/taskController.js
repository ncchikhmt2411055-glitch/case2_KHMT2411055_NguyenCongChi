const Task = require('../models/Task');
const TaskShare = require('../models/TaskShare');
const TaskActivity = require('../models/TaskActivity');
const {
  formatTask,
  person,
  loadTask,
  reloadTask,
  canEdit,
  canManage,
  logActivity,
  usersExist,
} = require('../services/taskService');
const { validateTaskInput } = require('../validators/taskValidator');

const SCOPES = ['all', 'created', 'assigned', 'shared'];

// GET /api/tasks?scope=all|created|assigned|shared
async function listTasks(req, res) {
  const userId = req.user._id;
  const scope = SCOPES.includes(req.query.scope) ? req.query.scope : 'all';

  const sharedRows = await TaskShare.find({ userId }).select('taskId');
  const sharedIds = sharedRows.map((s) => s.taskId);

  const conditions = [];
  if (scope === 'all' || scope === 'created') {
    conditions.push({ createdBy: userId });
  }
  if (scope === 'all' || scope === 'assigned') {
    conditions.push({ $or: [{ assigneeIds: userId }, { primaryAssigneeId: userId }] });
  }
  if (scope === 'all' || scope === 'shared') {
    conditions.push({ _id: { $in: sharedIds } });
  }

  const tasks = await Task.find({ $or: conditions })
    .populate('createdBy', 'fullName email')
    .populate('assigneeIds', 'fullName email')
    .populate('primaryAssigneeId', 'fullName email')
    .sort({ dueDate: 1, createdAt: -1 });

  res.json({ tasks: tasks.map((t) => formatTask(t)) });
}

// GET /api/tasks/:id
async function getTask(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  res.json({ task: formatTask(task, role) });
}

// POST /api/tasks
async function createTask(req, res) {
  const body = req.body || {};
  const { data, error } = validateTaskInput(body);
  if (error) return res.status(400).json({ message: error });

  if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
    return res.status(400).json({ message: 'Hạn hoàn thành phải sau ngày bắt đầu' });
  }

  let assigneeIds = Array.isArray(body.assigneeIds) ? body.assigneeIds.map(String) : [];
  const primary = body.primaryAssigneeId ? String(body.primaryAssigneeId) : null;
  if (primary && !assigneeIds.includes(primary)) assigneeIds.push(primary);
  assigneeIds = [...new Set(assigneeIds)];

  if (assigneeIds.length && !(await usersExist(assigneeIds))) {
    return res.status(400).json({ message: 'Có người dùng không tồn tại' });
  }

  const task = await Task.create({
    ...data,
    createdBy: req.user._id,
    assigneeIds,
    primaryAssigneeId: primary || assigneeIds[0] || null,
  });

  await logActivity(task._id, req.user._id, 'created', { title: task.title });
  const full = await reloadTask(task._id);
  res.status(201).json({ task: formatTask(full, 'creator') });
}

// PUT /api/tasks/:id
async function updateTask(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canEdit(role)) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa công việc này' });
  }

  const { data, error: vError } = validateTaskInput(req.body || {}, true);
  if (vError) return res.status(400).json({ message: vError });
  if (!Object.keys(data).length) {
    return res.status(400).json({ message: 'Không có dữ liệu cần cập nhật' });
  }

  const start = data.startDate !== undefined ? data.startDate : task.startDate;
  const due = data.dueDate !== undefined ? data.dueDate : task.dueDate;
  if (start && due && due < start) {
    return res.status(400).json({ message: 'Hạn hoàn thành phải sau ngày bắt đầu' });
  }

  await Task.updateOne({ _id: task._id }, { $set: data }, { runValidators: true });
  await logActivity(task._id, req.user._id, 'updated', { fields: Object.keys(data) });

  const full = await reloadTask(task._id);
  res.json({ task: formatTask(full, role) });
}

// PATCH /api/tasks/:id/status
async function updateStatus(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canEdit(role)) {
    return res.status(403).json({ message: 'Bạn không có quyền đổi trạng thái' });
  }

  const { data } = validateTaskInput({ status: req.body?.status }, true);
  if (!data || !data.status) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }

  const from = task.status;
  await Task.updateOne({ _id: task._id }, { $set: { status: data.status } });
  await logActivity(task._id, req.user._id, 'status_changed', { from, to: data.status });

  const full = await reloadTask(task._id);
  res.json({ task: formatTask(full, role) });
}

// DELETE /api/tasks/:id (chỉ người tạo)
async function deleteTask(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được xóa công việc' });
  }

  await Promise.all([
    Task.deleteOne({ _id: task._id }),
    TaskShare.deleteMany({ taskId: task._id }),
    TaskActivity.deleteMany({ taskId: task._id }),
  ]);
  res.json({ message: 'Đã xóa công việc' });
}

// GET /api/tasks/:id/activities
async function listActivities(req, res) {
  const { task, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });

  const items = await TaskActivity.find({ taskId: task._id })
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    activities: items.map((a) => ({
      id: String(a._id),
      action: a.action,
      details: a.details,
      createdAt: a.createdAt,
      user: person(a.userId),
    })),
  });
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateStatus,
  deleteTask,
  listActivities,
};