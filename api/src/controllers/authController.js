const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../validators/authValidator');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
async function register(req, res) {
  const body = req.body || {};
  const error = validateRegister(body);
  if (error) return res.status(400).json({ message: error });

  const fullName = body.fullName.trim();
  const email = body.email.trim().toLowerCase();

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'Email đã được đăng ký' });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await User.create({ fullName, email, passwordHash });

  res.status(201).json({
    message: 'Đăng ký thành công',
    token: signToken(user),
    user: user.toSafeJSON(),
  });
}

// POST /api/auth/login
async function login(req, res) {
  const body = req.body || {};
  const error = validateLogin(body);
  if (error) return res.status(400).json({ message: error });

  const email = body.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select('+passwordHash');

  const ok = user && (await bcrypt.compare(body.password, user.passwordHash));
  if (!ok) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  res.json({
    message: 'Đăng nhập thành công',
    token: signToken(user),
    user: user.toSafeJSON(),
  });
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

module.exports = { register, login, me };