const express = require('express');
const router = express.Router();
const { authenticate, requireAuth } = require('../middleware/auth.middleware');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ShippingAddress = require('../models/ShippingAddress');
const Seller = require('../models/Seller');
const Expert = require('../models/Expert');
const Wallet = require('../models/Wallet');
const PayoutRequest = require('../models/PayoutRequest');
const TransactionLog = require('../models/TransactionLog');

router.use(authenticate, requireAuth);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const [user, addresses] = await Promise.all([
      User.findById(req.user._id),
      ShippingAddress.find({ user: req.user._id }).sort({ isDefault: -1 })
    ]);
    res.render('pages/user/profile', {
      layout: 'layouts/user',
      title: 'Hồ sơ – ORGO',
      pageUser: user, addresses, activeTab: 'profile'
    });
  } catch (err) { res.redirect('/'); }
});

router.post('/profile', async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fullName, phone });
    req.flash('success', 'Cập nhật hồ sơ thành công!');
    res.redirect('/user/profile');
  } catch (err) { req.flash('error', 'Lỗi'); res.redirect('/user/profile'); }
});

// ─── Đổi mật khẩu ─────────────────────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect('/user/profile');
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!await user.comparePassword(currentPassword)) {
      req.flash('error', 'Mật khẩu hiện tại không đúng');
      return res.redirect('/user/profile');
    }
    user.password = newPassword;
    await user.save();
    req.flash('success', 'Đổi mật khẩu thành công!');
    res.redirect('/user/profile');
  } catch (err) { req.flash('error', 'Lỗi'); res.redirect('/user/profile'); }
});

// ─── Địa chỉ ──────────────────────────────────────────────────────────────────
router.post('/addresses', async (req, res) => {
  try {
    const { fullName, phone, province, district, ward, address, isDefault } = req.body;
    if (isDefault) await ShippingAddress.updateMany({ user: req.user._id }, { isDefault: false });
    await ShippingAddress.create({ user: req.user._id, fullName, phone, province, district, ward, address, isDefault: !!isDefault });
    res.json({ success: true, message: 'Thêm địa chỉ thành công!' });
  } catch (err) { res.json({ success: false }); }
});

router.delete('/addresses/:id', async (req, res) => {
  try {
    await ShippingAddress.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) { res.json({ success: false }); }
});

// ─── Đơn hàng ─────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1 } = req.query;
    const limit = 10;
    const skip = (parseInt(page) - 1) * limit;
    let query = { user: req.user._id };
    if (status && status !== 'ALL') query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);

    res.render('pages/user/orders', {
      layout: 'layouts/user',
      title: 'Đơn hàng – ORGO',
      orders, total, activeStatus: status || 'ALL',
      totalPages: Math.ceil(total / limit), currentPage: parseInt(page)
    });
  } catch (err) { res.redirect('/user/profile'); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product').populate('items.seller');
    if (!order) return res.redirect('/user/orders');
    res.render('pages/user/order-detail', {
      layout: 'layouts/user',
      title: `Đơn hàng #${order.orderCode} – ORGO`,
      order
    });
  } catch (err) { res.redirect('/user/orders'); }
});

router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order || order.status !== 'PENDING') {
      return res.json({ success: false, message: 'Không thể huỷ đơn hàng này' });
    }
    order.status = 'CANCELLED';
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    await order.save();
    // Restore stock
    for (const item of order.items) {
      await require('../models/Product').findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    res.json({ success: true, message: 'Đã huỷ đơn hàng' });
  } catch (err) { res.json({ success: false }); }
});

router.post('/orders/:id/return', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order || order.status !== 'DELIVERED') {
      return res.json({ success: false, message: 'Không thể yêu cầu hoàn trả' });
    }
    order.status = 'RETURN_REQUESTED';
    order.returnReason = reason;
    await order.save();
    res.json({ success: true, message: 'Đã gửi yêu cầu hoàn trả' });
  } catch (err) { res.json({ success: false }); }
});

// ─── Đánh giá sản phẩm ────────────────────────────────────────────────────────
router.post('/orders/:orderId/review/:productId', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order || order.status !== 'DELIVERED') {
      return res.json({ success: false, message: 'Không thể đánh giá đơn hàng này' });
    }
    const item = order.items.find(i => i.product.toString() === req.params.productId);
    if (!item || item.reviewed) {
      return res.json({ success: false, message: 'Đã đánh giá sản phẩm này' });
    }
    await Review.create({
      product: req.params.productId,
      user: req.user._id,
      order: order._id,
      rating: parseInt(rating),
      comment
    });
    item.reviewed = true;
    await order.save();
    res.json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' });
  } catch (err) { res.json({ success: false }); }
});

// ─── Đăng ký Seller / Expert ──────────────────────────────────────────────────
router.get('/upgrade', (req, res) => {
  res.render('pages/user/upgrade', {
    layout: 'layouts/user',
    title: 'Nâng cấp tài khoản – ORGO'
  });
});

router.post('/upgrade/seller', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.upgradeRequest?.status === 'PENDING') {
      return res.json({ success: false, message: 'Đã có yêu cầu đang chờ duyệt' });
    }
    user.upgradeRequest = { type: 'SELLER', status: 'PENDING', submittedAt: new Date() };
    await user.save();
    res.json({ success: true, message: 'Yêu cầu đã được gửi, chờ Admin duyệt!' });
  } catch (err) { res.json({ success: false }); }
});

router.post('/upgrade/expert', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.upgradeRequest?.status === 'PENDING') {
      return res.json({ success: false, message: 'Đã có yêu cầu đang chờ duyệt' });
    }
    const { title, specialization, bio, credentials } = req.body;
    user.upgradeRequest = { type: 'EXPERT', status: 'PENDING', submittedAt: new Date() };
    user.upgradeData = { title, specialization, bio, credentials };
    await user.save();
    res.json({ success: true, message: 'Yêu cầu đã được gửi!' });
  } catch (err) { res.json({ success: false }); }
});

module.exports = router;
