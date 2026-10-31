require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../src/config/database');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const TaskShare = require('../src/models/TaskShare');

async function run() {
  const email = (process.argv[2] || '').toLowerCase();
  const otherEmail = (process.argv[3] || '').toLowerCase();
  if (!email || !otherEmail) {
    throw new Error('Cách dùng: node scripts/seed.js email_cua_ban email_nguoi_khac');
  }

  await connectDatabase();

  const me = await User.findOne({ email });
  const other = await User.findOne({ email: otherEmail });
  if (!me || !other) {
    throw new Error('Không tìm thấy một trong hai tài khoản, hãy đăng ký trước');
  }

  const day = 24 * 3600 * 1000;

  await Task.create({
    title: 'Hoàn thành báo cáo tuần',
    description: 'Viết báo cáo tiến độ tuần này',
    createdBy: me._id,
    assigneeIds: [me._id],
    primaryAssigneeId: me._id,
    dueDate: new Date(Date.now() + 7 * day),
    priority: 'high',
    status: 'in_progress',
  });

  await Task.create({
    title: 'Chuẩn bị slide thuyết trình',
    description: 'Làm slide cho buổi họp nhóm',
    createdBy: other._id,
    assigneeIds: [me._id],
    primaryAssigneeId: me._id,
    dueDate: new Date(Date.now() + 2 * day),
    priority: 'medium',
    status: 'todo',
  });

  const shared = await Task.create({
    title: 'Xem tài liệu dự án',
    description: 'Đọc tài liệu được chia sẻ',
    createdBy: other._id,
    dueDate: new Date(Date.now() + 5 * day),
    priority: 'low',
    status: 'todo',
  });
  await TaskShare.create({
    taskId: shared._id,
    userId: me._id,
    permission: 'viewer',
    sharedBy: other._id,
  });

  console.log('Đã tạo 3 công việc mẫu');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});