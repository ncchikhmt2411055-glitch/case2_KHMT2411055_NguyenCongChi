const Notification = require('../models/Notification');

function fmt(n) {
  return {
    id: String(n._id),
    type: n.type,
    title: n.title,
    message: n.message,
    taskId: n.taskId ? String(n.taskId) : null,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

// GET /api/notifications
async function listNotifications(req, res) {
  const items = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications: items.map(fmt) });
}

// GET /api/notifications/unread-count
async function unreadCount(req, res) {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json({ count });
}

// PATCH /api/notifications/:id/read
async function markRead(req, res) {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!n) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
  res.json({ notification: fmt(n) });
}

// PATCH /api/notifications/read-all
async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
}

module.exports = { listNotifications, unreadCount, markRead, markAllRead };