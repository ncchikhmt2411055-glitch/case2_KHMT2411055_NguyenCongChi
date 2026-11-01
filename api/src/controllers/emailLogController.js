const EmailLog = require('../models/EmailLog');
const Task = require('../models/Task');
const { attemptSend, MAX_ATTEMPTS } = require('../services/emailService');

// GET /api/tasks/:id/email-logs (chỉ người tạo)
async function listTaskEmailLogs(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Không tìm thấy công việc' });
  if (String(task.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Chỉ người tạo mới xem được lịch sử email' });
  }

  const logs = await EmailLog.find({ taskId: task._id }).sort({ createdAt: -1 }).limit(100);
  res.json({
    emailLogs: logs.map((l) => ({
      id: String(l._id),
      recipientEmail: l.recipientEmail,
      eventType: l.eventType,
      subject: l.subject,
      status: l.status,
      attempts: l.attempts,
      errorMessage: l.errorMessage,
      sentAt: l.sentAt,
      createdAt: l.createdAt,
    })),
  });
}

// POST /api/email-logs/:id/retry (chỉ người tạo, chỉ email lỗi, tối đa 3 lần)
async function retryEmail(req, res) {
  const log = await EmailLog.findById(req.params.id);
  if (!log) return res.status(404).json({ message: 'Không tìm thấy lịch sử email' });

  const task = log.taskId ? await Task.findById(log.taskId) : null;
  if (!task || String(task.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Bạn không có quyền gửi lại email này' });
  }
  if (log.status !== 'failed') {
    return res.status(400).json({ message: 'Chỉ gửi lại được email đã thất bại' });
  }
  if (log.attempts >= MAX_ATTEMPTS) {
    return res.status(400).json({ message: 'Đã vượt quá số lần thử gửi lại' });
  }

  const updated = await attemptSend(log._id);
  res.json({
    status: updated.status,
    attempts: updated.attempts,
    errorMessage: updated.errorMessage,
  });
}

module.exports = { listTaskEmailLogs, retryEmail };