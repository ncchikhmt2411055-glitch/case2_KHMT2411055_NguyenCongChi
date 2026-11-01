const User = require('../models/User');

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/users/search?q=  (tìm theo tên hoặc email, không trả về chính mình)
async function searchUsers(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  const rx = new RegExp(escapeRegex(q), 'i');
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ fullName: rx }, { email: rx }],
  })
    .select('fullName email')
    .limit(10);

  res.json({
    users: users.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
    })),
  });
}

module.exports = { searchUsers };