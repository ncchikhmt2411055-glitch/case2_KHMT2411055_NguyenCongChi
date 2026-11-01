const Task = require('../models/Task');
const { accessFilter } = require('../services/accessFilter');

const DAY = 24 * 60 * 60 * 1000;

async function taskStats(req, res) {
  const filter = await accessFilter(req.user._id);
  const rows = await Task.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byStatus = { todo: 0, in_progress: 0, completed: 0 };
  let total = 0;
  for (const r of rows) {
    byStatus[r._id] = r.count;
    total += r.count;
  }
  res.json({ total, byStatus });
}

async function assignmentStats(req, res) {
  const me = req.user._id;
  const [assignedToMe, primaryForMe, createdByMe] = await Promise.all([
    Task.countDocuments({ $or: [{ assigneeIds: me }, { primaryAssigneeId: me }] }),
    Task.countDocuments({ primaryAssigneeId: me }),
    Task.countDocuments({ createdBy: me }),
  ]);
  res.json({ assignedToMe, primaryForMe, createdByMe });
}

async function deadlineStats(req, res) {
  const filter = await accessFilter(req.user._id);
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * DAY);
  const base = { ...filter, status: { $ne: 'completed' } };

  const [upcoming, overdue] = await Promise.all([
    Task.find({ ...base, dueDate: { $gte: now, $lte: weekLater } }).sort({ dueDate: 1 }).limit(10),
    Task.find({ ...base, dueDate: { $lt: now } }).sort({ dueDate: 1 }).limit(10),
  ]);

  const fmt = (t) => ({
    id: String(t._id),
    title: t.title,
    dueDate: t.dueDate,
    status: t.status,
  });

  res.json({ upcoming: upcoming.map(fmt), overdue: overdue.map(fmt) });
}

module.exports = { taskStats, assignmentStats, deadlineStats };