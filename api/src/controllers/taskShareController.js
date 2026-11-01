const TaskShare = require('../models/TaskShare');
const { loadTask, canManage, logActivity, usersExist } = require('../services/taskService');

const PERMISSIONS = ['viewer', 'editor'];

async function sharesOf(taskId) {
  const shares = await TaskShare.find({ taskId })
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });

  return shares
    .filter((s) => s.userId)
    .map((s) => ({
      id: String(s._id),
      permission: s.permission,
      user: {
        id: String(s.userId._id),
        fullName: s.userId.fullName,
        email: s.userId.email,
      },
    }));
}

// GET /api/tasks/:id/shares
async function listShares(req, res) {
  const { task, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  res.json({ shares: await sharesOf(task._id) });
}

// POST /api/tasks/:id/shares  body: { userIds: [], permission: 'viewer'|'editor' }
async function createShares(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được chia sẻ công việc' });
  }

  const permission = req.body?.permission;
  if (!PERMISSIONS.includes(permission)) {
    return res.status(400).json({ message: 'Quyền chia sẻ phải là viewer hoặc editor' });
  }

  const ids = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : [];
  if (!ids.length) return res.status(400).json({ message: 'Hãy chọn ít nhất một người' });
  if (!(await usersExist(ids))) {
    return res.status(400).json({ message: 'Có người dùng không tồn tại' });
  }

  const creatorId = String(task.createdBy?._id ?? task.createdBy);
  const targets = [...new Set(ids)].filter((id) => id !== creatorId);
  if (!targets.length) {
    return res.status(400).json({ message: 'Không thể chia sẻ cho chính người tạo' });
  }

  // Nếu đã chia sẻ trước đó thì cập nhật quyền, không tạo bản ghi trùng
  await TaskShare.bulkWrite(
    targets.map((uid) => ({
      updateOne: {
        filter: { taskId: task._id, userId: uid },
        update: { $set: { permission, sharedBy: req.user._id } },
        upsert: true,
      },
    }))
  );

  await logActivity(task._id, req.user._id, 'shared', { userIds: targets, permission });
  res.status(201).json({ shares: await sharesOf(task._id) });
}

// PATCH /api/tasks/:id/shares/:shareId  body: { permission }
async function updateShare(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được đổi quyền chia sẻ' });
  }

  const permission = req.body?.permission;
  if (!PERMISSIONS.includes(permission)) {
    return res.status(400).json({ message: 'Quyền chia sẻ phải là viewer hoặc editor' });
  }

  const share = await TaskShare.findOneAndUpdate(
    { _id: req.params.shareId, taskId: task._id },
    { $set: { permission } },
    { new: true }
  );
  if (!share) return res.status(404).json({ message: 'Không tìm thấy quyền chia sẻ' });

  await logActivity(task._id, req.user._id, 'share_changed', {
    userId: String(share.userId),
    permission,
  });
  res.json({ shares: await sharesOf(task._id) });
}

// DELETE /api/tasks/:id/shares/:shareId
async function revokeShare(req, res) {
  const { task, role, error, message } = await loadTask(req.params.id, req.user._id);
  if (error) return res.status(error).json({ message });
  if (!canManage(role)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới được thu hồi quyền chia sẻ' });
  }

  const result = await TaskShare.deleteOne({ _id: req.params.shareId, taskId: task._id });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Không tìm thấy quyền chia sẻ' });
  }

  await logActivity(task._id, req.user._id, 'share_revoked', { shareId: req.params.shareId });
  res.json({ shares: await sharesOf(task._id) });
}

module.exports = { listShares, createShares, updateShare, revokeShare };