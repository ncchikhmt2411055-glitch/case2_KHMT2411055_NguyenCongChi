function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy đường dẫn ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Dữ liệu đã tồn tại' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Mã không hợp lệ' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Lỗi máy chủ, vui lòng thử lại' : err.message,
  });
}

module.exports = { notFound, errorHandler };