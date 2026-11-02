const express = require('express');
const router = express.Router();
const { authenticate, requireAuth, requireRole } = require('../middleware/auth.middleware');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const DiscountCode = require('../models/DiscountCode');
const ShippingAddress = require('../models/ShippingAddress');
const { sendOrderConfirmEmail } = require('../services/mail.service');
const Wallet = require('../models/Wallet');
const TransactionLog = require('../models/TransactionLog');

router.use(authenticate, requireAuth);

// ─── Giỏ hàng ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.render('pages/user/cart', {
      layout: 'layouts/main',
      title: 'Giỏ hàng – ORGO',
      cart: cart || { items: [], appliedCoupon: {} }
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ─── Thêm vào giỏ (AJAX) ────────────────────────────────────────────────────
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1, variantId } = req.body;
    const product = await Product.findOne({ _id: productId, status: 'ACTIVE' });
    if (!product) return res.json({ success: false, message: 'Sản phẩm không tồn tại' });

    // Determine price
    let price = product.price;
    let variantName = null;
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (variant) { price = variant.price; variantName = variant.name; }
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    // Check if item already in cart
    const existIdx = cart.items.findIndex(i =>
      i.product.toString() === productId &&
      (variantId ? i.variantId?.toString() === variantId : !i.variantId)
    );

    if (existIdx >= 0) {
      cart.items[existIdx].quantity += parseInt(quantity);
    } else {
      cart.items.push({ product: productId, variantId: variantId || null, variantName, price, quantity: parseInt(quantity) });
    }

    await cart.save();
    const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
    res.json({ success: true, message: 'Đã thêm vào giỏ hàng!', totalItems });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Có lỗi xảy ra' });
  }
});

// ─── Cập nhật số lượng (AJAX) ─────────────────────────────────────────────────
router.put('/update/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.json({ success: false, message: 'Không tìm thấy giỏ hàng' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.json({ success: false, message: 'Sản phẩm không có trong giỏ' });

    if (parseInt(quantity) <= 0) {
      item.deleteOne();
    } else {
      item.quantity = parseInt(quantity);
    }

    await cart.save();
    const total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
    res.json({ success: true, total, totalItems });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi' });
  }
});

// ─── Xóa sản phẩm khỏi giỏ ──────────────────────────────────────────────────
router.delete('/remove/:itemId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.json({ success: false });
    cart.items.id(req.params.itemId)?.deleteOne();
    await cart.save();
    const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0);
    res.json({ success: true, totalItems });
  } catch (err) {
    res.json({ success: false });
  }
});

// ─── Áp dụng coupon (AJAX) ────────────────────────────────────────────────────
router.post('/apply-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) return res.json({ success: false, message: 'Giỏ hàng trống' });

    const coupon = await DiscountCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    });

    if (!coupon) return res.json({ success: false, message: 'Mã giảm giá không hợp lệ' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, message: 'Mã đã hết lượt sử dụng' });
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    if (subtotal < coupon.minOrderAmount) {
      return res.json({ success: false, message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ` });
    }

    let discount = 0;
    if (coupon.type === 'PERCENT') {
      discount = Math.round(subtotal * coupon.value / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }

    cart.appliedCoupon = { code: coupon.code, discount };
    await cart.save();

    res.json({ success: true, message: `Áp dụng thành công! Giảm ${discount.toLocaleString('vi-VN')}đ`, discount });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi' });
  }
});

module.exports = router;
