const Task = require('../models/Task');
const TaskShare = require('../models/TaskShare');
const { formatTask, getAccess } = require('../services/taskService');

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
    conditions.push({
      $or: [{ assigneeIds: userId }, { primaryAssigneeId: userId }],
    });
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
  const task = await Task.findById(req.params.id)
    .populate('createdBy', 'fullName email')
    .populate('assigneeIds', 'fullName email')
    .populate('primaryAssigneeId', 'fullName email');

  if (!task) {
    return res.status(404).json({ message: 'Không tìm thấy công việc' });
  }

  const role = await getAccess(task, req.user._id);
  if (!role) {
    return res.status(403).json({ message: 'Bạn không có quyền xem công việc này' });
  }

  res.json({ task: formatTask(task, role) });
}

module.exports = { listTasks, getTask };