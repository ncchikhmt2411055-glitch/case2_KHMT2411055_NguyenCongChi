require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/database');
const { runReminders } = require('./services/reminderJob');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
  });

  // Nhắc việc: chạy ngay khi khởi động, sau đó mỗi giờ
  const tick = () => runReminders().catch((e) => console.error('Lỗi nhắc việc:', e.message));
  tick();
  setInterval(tick, 60 * 60 * 1000);
}

start().catch((err) => {
  console.error('Không khởi động được server:', err.message);
  process.exit(1);
});