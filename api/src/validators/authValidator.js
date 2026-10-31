function validateRegister(body) {
  const fullName = String(body.fullName ?? '').trim();
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const confirmPassword = body.confirmPassword;

  if (fullName.length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Email không hợp lệ';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return 'Mật khẩu xác nhận không khớp';
  }
  return null;
}

function validateLogin(body) {
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  if (!email || !password) return 'Vui lòng nhập email và mật khẩu';
  return null;
}

module.exports = { validateRegister, validateLogin };