const express = require('express');
const router = express.Router();
const { authenticate, requireAuth } = require('../middleware/auth.middleware');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const ShippingAddress = require('../models/ShippingAddress');
const DiscountCode = require('../models/DiscountCode');
const Product = require('../models/Product');
const Wallet = require('../models/Wallet');
const TransactionLog = require('../models/TransactionLog');
const { sendOrderConfirmEmail } = require('../services/mail.service');

router.use(authenticate, requireAuth);

// ─── GET /checkout ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng trống');
      return res.redirect('/cart');
    }

    const addresses = await ShippingAddress.find({ user: req.user._id }).sort({ isDefault: -1 });
    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = cart.appliedCoupon?.discount || 0;
    const shippingFee = 30000;
    const total = subtotal - discount + shippingFee;

    res.render('pages/user/checkout', {
      layout: 'layouts/main',
      title: 'Đặt hàng – ORGO',
      cart, addresses, subtotal, discount, shippingFee, total
    });
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
});

// ─── POST /checkout ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { addressId, paymentMethod, newAddress } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng trống');
      return res.redirect('/cart');
    }

    // Determine shipping address
    let shippingAddr;
    if (addressId) {
      const addr = await ShippingAddress.findOne({ _id: addressId, user: req.user._id });
      if (!addr) { req.flash('error', 'Địa chỉ không hợp lệ'); return res.redirect('/checkout'); }
      shippingAddr = { fullName: addr.fullName, phone: addr.phone, province: addr.province, district: addr.district, ward: addr.ward, address: addr.address };
    } else if (newAddress) {
      const { fullName, phone, province, district, ward, address, saveAddress } = JSON.parse(newAddress);
      shippingAddr = { fullName, phone, province, district, ward, address };
      if (saveAddress) {
        await ShippingAddress.create({ user: req.user._id, ...shippingAddr });
      }
    } else {
      req.flash('error', 'Vui lòng chọn địa chỉ giao hàng');
      return res.redirect('/checkout');
    }

    // Build order items & validate stock
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (!product || product.status !== 'ACTIVE') {
        req.flash('error', `Sản phẩm "${item.product.name}" không còn hoạt động`);
        return res.redirect('/cart');
      }
      if (product.stock < item.quantity) {
        req.flash('error', `Sản phẩm "${product.name}" không đủ hàng`);
        return res.redirect('/cart');
      }
      const Seller = require('../models/Seller');
      const seller = await Seller.findById(product.seller);
      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.thumbnail,
        variantName: item.variantName,
        price: item.price,
        quantity: item.quantity,
        seller: product.seller,
        sellerName: seller?.shopName || ''
      });
      // Decrease stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = cart.appliedCoupon?.discount || 0;
    const shippingFee = 30000;
    const total = subtotal - discount + shippingFee;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: shippingAddr,
      subtotal, shippingFee, discount, total,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'UNPAID',
      couponCode: cart.appliedCoupon?.code
    });

    // Update coupon usage
    if (cart.appliedCoupon?.code) {
      await DiscountCode.findOneAndUpdate(
        { code: cart.appliedCoupon.code },
        { $inc: { usedCount: 1 } }
      );
    }

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    // Send confirmation email
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    await sendOrderConfirmEmail(user.email, user.fullName, order).catch(console.error);
    res.redirect(`/checkout/success?orderId=${order._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Đặt hàng thất bại, vui lòng thử lại');
    res.redirect('/checkout');
  }
});

// ─── GET /checkout/success ────────────────────────────────────────────────────
router.get('/success', async (req, res) => {
  try {
    const order = await Order.findById(req.query.orderId).populate('items.product');
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }
    res.render('pages/user/order-success', {
      layout: 'layouts/main',
      title: 'Đặt hàng thành công – ORGO',
      order
    });
  } catch (err) {
    res.redirect('/');
  }
});

module.exports = router;
