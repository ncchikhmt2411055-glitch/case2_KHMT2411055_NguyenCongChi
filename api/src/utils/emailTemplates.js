// Chống chèn HTML từ dữ liệu người dùng nhập
function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('vi-VN') : 'chưa đặt';
}

function wrap(title, body) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>${esc(title)}</h2>${body}
    <hr><small>Email tự động từ Task Manager, vui lòng không trả lời.</small>
  </div>`;
}

function make({ title, message, subject, name, bodyHtml }) {
  return {
    title,
    message,
    subject,
    html: wrap(subject, `<p>Xin chào ${esc(name)},</p>${bodyHtml}`),
  };
}

const templates = {
  assigned: ({ name, actorName, taskTitle, dueDate }) =>
    make({
      title: 'Bạn được giao công việc',
      message: `${actorName} đã giao cho bạn: ${taskTitle}`,
      subject: `Bạn được giao công việc: ${taskTitle}`,
      name,
      bodyHtml: `<p><b>${esc(actorName)}</b> đã giao cho bạn công việc <b>${esc(taskTitle)}</b>.</p>
        <p>Hạn hoàn thành: ${fmtDate(dueDate)}</p>`,
    }),

  shared: ({ name, actorName, taskTitle }) =>
    make({
      title: 'Công việc được chia sẻ với bạn',
      message: `${actorName} đã chia sẻ công việc: ${taskTitle}`,
      subject: `Công việc được chia sẻ với bạn: ${taskTitle}`,
      name,
      bodyHtml: `<p><b>${esc(actorName)}</b> đã chia sẻ công việc <b>${esc(taskTitle)}</b> với bạn.</p>`,
    }),

  due_changed: ({ name, actorName, taskTitle, dueDate }) =>
    make({
      title: 'Hạn hoàn thành đã thay đổi',
      message: `Hạn của "${taskTitle}" đổi thành ${fmtDate(dueDate)}`,
      subject: `Hạn hoàn thành đã thay đổi: ${taskTitle}`,
      name,
      bodyHtml: `<p><b>${esc(actorName)}</b> đã đổi hạn hoàn thành của <b>${esc(taskTitle)}</b> thành <b>${fmtDate(dueDate)}</b>.</p>`,
    }),

  completed: ({ name, actorName, taskTitle }) =>
    make({
      title: 'Công việc đã hoàn thành',
      message: `${actorName} đã hoàn thành: ${taskTitle}`,
      subject: `Công việc đã hoàn thành: ${taskTitle}`,
      name,
      bodyHtml: `<p><b>${esc(actorName)}</b> đã đánh dấu hoàn thành công việc <b>${esc(taskTitle)}</b>.</p>`,
    }),

  reminder: ({ name, taskTitle, dueDate }) =>
    make({
      title: 'Nhắc việc sắp đến hạn',
      message: `"${taskTitle}" sẽ đến hạn vào ${fmtDate(dueDate)}`,
      subject: `Nhắc việc: ${taskTitle} sắp đến hạn`,
      name,
      bodyHtml: `<p>Công việc <b>${esc(taskTitle)}</b> sẽ đến hạn trong vòng 24 giờ tới (${fmtDate(dueDate)}).</p>`,
    }),
};

module.exports = { templates };