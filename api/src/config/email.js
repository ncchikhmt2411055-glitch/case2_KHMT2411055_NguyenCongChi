const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Chưa cấu hình SMTP: không gửi thật, chỉ tạo nội dung để ghi log
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

const MAIL_FROM = process.env.SMTP_FROM || 'Task Manager <no-reply@taskmanager.local>';

module.exports = { getTransporter, MAIL_FROM };