const EmailLog = require('../models/EmailLog');
const { getTransporter, MAIL_FROM } = require('../config/email');

const MAX_ATTEMPTS = 3;

async function sendEmail({ taskId, to, eventType, subject, html }) {
  const log = await EmailLog.create({
    taskId,
    recipientEmail: to,
    eventType,
    subject,
    html,
    status: 'pending',
    attempts: 0,
  });
  return attemptSend(log._id);
}

async function attemptSend(logId) {
  const log = await EmailLog.findById(logId);
  if (!log || log.status === 'sent') return log;

  log.attempts += 1;
  try {
    await getTransporter().sendMail({
      from: MAIL_FROM,
      to: log.recipientEmail,
      subject: log.subject,
      html: log.html,
    });
    if (!process.env.SMTP_HOST) {
      console.log(`[EMAIL-DEV] Gửi tới ${log.recipientEmail}: ${log.subject}`);
    }
    log.status = 'sent';
    log.sentAt = new Date();
    log.errorMessage = '';
  } catch (err) {
    log.status = 'failed';
    log.errorMessage = String(err.message || 'Lỗi không xác định').slice(0, 300);
  }

  await log.save();
  return log;
}

module.exports = { sendEmail, attemptSend, MAX_ATTEMPTS };