const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// ─── Middleware: Chỉ ADMIN mới vào được ──────────────────────────────────────
router.use(authenticate, requireRole('ADMIN'));

// ─── GET /admin: Dashboard thống kê ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Tổng doanh thu từ các đơn hàng thành công
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'DELIVERED' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const recentOrders = await Order.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('pages/admin/dashboard', {
      title: 'Quản trị hệ thống ORGO',
      stats: { totalUsers, totalOrders, totalProducts, totalRevenue },
      recentOrders
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error/500', { message: 'Lỗi tải trang quản trị' });
  }
});

// ─── GET /admin/users: Quản lý người dùng ────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('pages/admin/users', {
      title: 'Quản lý người dùng',
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error/500', { message: 'Lỗi tải danh sách người dùng' });
  }
});

// ─── POST /admin/users/:id/role: Phân quyền người dùng ───────────────────────
router.post('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    req.flash('success', 'Cập nhật quyền thành công');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Cập nhật quyền thất bại');
    res.redirect('/admin/users');
  }
});

// ─── GET /admin/orders: Quản lý toàn bộ đơn hàng ─────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    res.render('pages/admin/orders', {
      title: 'Quản lý đơn hàng toàn sàn',
      orders
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error/500', { message: 'Lỗi tải danh sách đơn hàng' });
  }
});

module.exports = router;
