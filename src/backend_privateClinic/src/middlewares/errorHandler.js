/**
 * Middleware xử lý lỗi toàn cục
 */
const errorHandler = (err, req, res, next) => {
  console.dir(err, { depth: null });

  const pgCode =
    err.code || err.parent?.code || err.original?.code || null;

  if (pgCode) {
    switch (pgCode) {
      case 'P0001':   // Trigger raise
        return res.status(400).json({
          error: 'Yêu cầu không hợp lệ',
          message: 'Vi phạm ràng buộc dữ liệu trong cơ sở dữ liệu',
          detail: err.parent?.detail || err.detail,
          hint: err.parent?.hint || err.hint
        });
      case '23503':   // FK
        return res.status(400).json({ error: 'Yêu cầu không hợp lệ', message: 'Vi phạm khóa ngoại', detail: err.parent?.detail || err.detail });
      case '23505':   // Unique
        return res.status(400).json({ error: 'Yêu cầu không hợp lệ', message: 'Vi phạm ràng buộc duy nhất', detail: err.parent?.detail || err.detail });
      case '23514':   // Check
        return res.status(400).json({ error: 'Yêu cầu không hợp lệ', message: 'Vi phạm điều kiện kiểm tra', detail: err.parent?.detail || err.detail });
    }
  }

  // Xử lý lỗi 404
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Không tìm thấy',
      message: err.message
    });
  }

  // Xử lý lỗi xác thực
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({
      error: 'Chưa xác thực',
      message: err.message
    });
  }

  // Xử lý lỗi phân quyền
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      error: 'Truy cập bị từ chối',
      message: err.message
    });
  }

  // Xử lý lỗi validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Yêu cầu không hợp lệ',
      message: err.message,
      errors: err.errors
    });
  }

  // Xử lý lỗi chung
  return res.status(err.statusCode || 500).json({
    error: err.name || 'Lỗi máy chủ',
    message: err.message || 'Có lỗi xảy ra trên máy chủ'
  });
};

module.exports = {
  errorHandler
};