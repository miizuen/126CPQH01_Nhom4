const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware xác thực JWT từ cookie hoặc Authorization header.
 * Nếu có token hợp lệ → gán req.user, res.locals.user
 */
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.session?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.status === 'BANNED') {
      req.user = null;
      res.clearCookie('token');
      return next();
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    req.user = null;
    res.clearCookie('token');
    next();
  }
};

/**
 * Middleware yêu cầu đăng nhập.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    return res.redirect('/auth/login');
  }
  next();
};

/**
 * Middleware yêu cầu role cụ thể.
 * @param {...string} roles - Danh sách roles được phép
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Vui lòng đăng nhập');
      return res.redirect('/auth/login');
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('pages/error/403', {
        layout: 'layouts/main',
        title: '403 – Không có quyền truy cập'
      });
    }
    next();
  };
};

/**
 * Middleware cho API JSON – trả về 401/403 thay vì redirect.
 */
const apiAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.status === 'BANNED') {
      return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

/**
 * Middleware API yêu cầu role.
 */
const apiRequireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền thực hiện' });
    }
    next();
  };
};

module.exports = { authenticate, requireAuth, requireRole, apiAuth, apiRequireRole };
