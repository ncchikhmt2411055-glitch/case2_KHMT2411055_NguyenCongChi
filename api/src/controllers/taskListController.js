const mongoose = require('mongoose');
const Task = require('../models/Task');
const { formatTask } = require('../services/taskService');
const { accessFilter } = require('../services/accessFilter');

const SCOPES = ['all', 'created', 'assigned', 'shared'];
const STATUSES = ['todo', 'in_progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];
const SORTS = ['dueDate', 'priority', 'createdAt'];
const RANK = { low: 1, medium: 2, high: 3 };

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listTasks(req, res) {
  const { scope, status, priority, q, sortBy, order, assigneeId } = req.query;

  const filter = await accessFilter(req.user._id, SCOPES.includes(scope) ? scope : 'all');

  if (STATUSES.includes(status)) filter.status = status;
  if (PRIORITIES.includes(priority)) filter.priority = priority;
  if (q && String(q).trim()) {
    filter.title = { $regex: escapeRegex(String(q).trim()), $options: 'i' };
  }
  if (assigneeId && mongoose.isValidObjectId(assigneeId)) {
    filter.primaryAssigneeId = assigneeId;
  }

  const tasks = await Task.find(filter)
    .populate('createdBy', 'fullName email')
    .populate('assigneeIds', 'fullName email')
    .populate('primaryAssigneeId', 'fullName email');

  const sortKey = SORTS.includes(sortBy) ? sortBy : 'dueDate';
  const dir = order === 'desc' ? -1 : 1;
  const valueOf = (t) => {
    if (sortKey === 'priority') return RANK[t.priority];
    if (sortKey === 'createdAt') return +t.createdAt;
    return t.dueDate ? +t.dueDate : Infinity;
  };

  tasks.sort((a, b) => {
    const x = valueOf(a);
    const y = valueOf(b);
    if (x === y) return 0;
    return (x < y ? -1 : 1) * dir;
  });

  res.json({ tasks: tasks.map((t) => formatTask(t)) });
}

module.exports = { listTasks };