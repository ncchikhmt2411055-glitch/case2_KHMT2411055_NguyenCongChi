const Task = require('../models/Task');
const { notifyEvent } = require('../services/notificationService');
const {
  formatTask,
  loadTask,
  reloadTask,
  canManage,
  logActivity,
  usersExist,
} = require('../services/taskService');

// GET /api/tasks/:id/assignees
async function listAssignees(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });

  const t = formatTask(task, role);
  res.json({ assignees: t.assignees, primaryAssignee: t.primaryAssignee });
}

// POST /api/tasks/:id/assignees  body: { userIds: [], primaryAssigneeId? }
async function assignUsers(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được giao việc' });
  }

  const ids = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : [];
  if (!ids.length) return res.status(400).json({ message: 'Hãy chọn ít nhất một người' });
  if (!(await usersExist(ids))) {
    return res.status(400).json({ message: 'Có người dùng không tồn tại' });
  }

  const update = { $addToSet: { assigneeIds: { $each: ids } } };
  const primary = req.body.primaryAssigneeId ? String(req.body.primaryAssigneeId) : null;

  if (primary) {
    const alreadyAssigned = task.assigneeIds.some((a) => a && String(a._id) === primary);
    if (!ids.includes(primary) && !alreadyAssigned) {
      return res.status(400).json({ message: 'Người phụ trách phải nằm trong danh sách được giao' });
    }
    update.$set = { primaryAssigneeId: primary };
  } else if (!task.primaryAssigneeId) {
    update.$set = { primaryAssigneeId: ids[0] };
  }

  await Task.updateOne({ _id: task._id }, update);
  await logActivity(task._id, req.user._id, 'assigned', { userIds: ids });
  notifyEvent({ userIds: ids, actor: req.user, task, eventType: 'assigned' })
    .catch((e) => console.error('Lỗi thông báo:', e.message));

  const full = await reloadTask(task._id);
  res.json({ task: formatTask(full, role) });
}

// PATCH /api/tasks/:id/assignees/:userId  body: { isPrimary: true }
async function setPrimaryAssignee(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được đổi người phụ trách' });
  }

  const uid = req.params.userId;
  const isAssignee = task.assigneeIds.some((a) => a && String(a._id) === uid);
  if (!isAssignee) return res.status(404).json({ message: 'Người này chưa được giao việc' });
  if (req.body?.isPrimary !== true) {
    return res.status(400).json({ message: 'Chỉ hỗ trợ isPrimary: true' });
  }

  await Task.updateOne({ _id: task._id }, { $set: { primaryAssigneeId: uid } });
  await logActivity(task._id, req.user._id, 'primary_changed', { userId: uid });

  const full = await reloadTask(task._id);
  res.json({ task: formatTask(full, role) });
}

// DELETE /api/tasks/:id/assignees/:userId
async function removeAssignee(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được hủy giao việc' });
  }

  const uid = req.params.userId;
  await Task.updateOne({ _id: task._id }, { $pull: { assigneeIds: uid } });
  await Task.updateOne(
    { _id: task._id, primaryAssigneeId: uid },
    { $set: { primaryAssigneeId: null } }
  );
  await logActivity(task._id, req.user._id, 'unassigned', { userId: uid });

  const full = await reloadTask(task._id);
  res.json({ task: formatTask(full, role) });
}

module.exports = { listAssignees, assignUsers, setPrimaryAssignee, removeAssignee };