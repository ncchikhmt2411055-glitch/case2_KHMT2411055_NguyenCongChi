const Notification = require('../models/Notification');
const User = require('../models/User');
const { templates } = require('../utils/emailTemplates');
const { sendEmail } = require('./emailService');

// Người liên quan: người tạo, người phụ trách, người được giao
function recipientsOf(task) {
  const raw = [task.createdBy, task.primaryAssigneeId, ...(task.assigneeIds || [])];
  return raw.filter(Boolean).map((v) => String(v._id ?? v));
}

// Tạo thông báo trong app và gửi email, bỏ qua người thực hiện hành động
async function notifyEvent({ userIds, actor = null, task, eventType }) {
  const actorId = actor ? String(actor._id) : null;
  const ids = [...new Set(userIds.map(String))].filter((id) => id !== actorId);
  if (!ids.length) return;

  const users = await User.find({ _id: { $in: ids } }).select('fullName email');
  const actorName = actor ? actor.fullName : 'Hệ thống';
  const build = templates[eventType];
  const notes = [];

  for (const u of users) {
    const tpl = build({
      name: u.fullName,
      actorName,
      taskTitle: task.title,
      dueDate: task.dueDate,
    });

    notes.push({
      userId: u._id,
      taskId: task._id,
      type: eventType,
      title: tpl.title,
      message: tpl.message,
    });

    sendEmail({
      taskId: task._id,
      to: u.email,
      eventType,
      subject: tpl.subject,
      html: tpl.html,
    }).catch((err) => console.error('Lỗi gửi email:', err.message));
  }

  if (notes.length) await Notification.insertMany(notes);
}

module.exports = { notifyEvent, recipientsOf };