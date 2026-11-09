const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Order = require('../models/Order');
const Seller = require('../models/Seller');
const Wallet = require('../models/Wallet');
const PayoutRequest = require('../models/PayoutRequest');
const TransactionLog = require('../models/TransactionLog');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/products/' });

router.use(authenticate, requireRole('SELLER'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.redirect('/user/upgrade');

    const [totalProducts, pendingOrders, wallet, recentOrders] = await Promise.all([
      Product.countDocuments({ seller: seller._id }),
      Order.countDocuments({ 'items.seller': seller._id, status: 'PENDING' }),
      Wallet.findOne({ user: req.user._id }),
      Order.find({ 'items.seller': seller._id }).sort({ createdAt: -1 }).limit(5)
    ]);

    // Revenue stats (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const revenueData = await Order.aggregate([
      { $match: { 'items.seller': seller._id, status: 'DELIVERED', createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);

    // Order by status
    const orderStats = await Order.aggregate([
      { $match: { 'items.seller': seller._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.render('pages/seller/dashboard', {
      layout: 'layouts/seller',
      title: 'Dashboard – ORGO Seller',
      seller, totalProducts, pendingOrders, wallet: wallet || { balance: 0, lockedAmount: 0 },
      recentOrders, revenueData, orderStats
    });
  } catch (err) { console.error(err); res.redirect('/'); }
});

// ─── Sản phẩm ─────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const { status, page = 1 } = req.query;
    const limit = 10;
    let query = { seller: seller._id };
    if (status) query.status = status;

    const [products, total, categories] = await Promise.all([
      Product.find(query).populate('category').sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * limit).limit(limit),
      Product.countDocuments(query),
      ProductCategory.find({ isActive: true })
    ]);

    res.render('pages/seller/products', {
      layout: 'layouts/seller',
      title: 'Sản phẩm – ORGO Seller',
      products, total, categories,
      totalPages: Math.ceil(total / limit), currentPage: parseInt(page),
      activeStatus: status || 'ALL'
    });
  } catch (err) { res.redirect('/seller/dashboard'); }
});

router.get('/products/create', async (req, res) => {
  const categories = await ProductCategory.find({ isActive: true });
  res.render('pages/seller/product-form', {
    layout: 'layouts/seller',
    title: 'Thêm sản phẩm – ORGO',
    product: null, categories
  });
});

router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const { name, category, description, ingredients, usageGuide, price, comparePrice, stock, unit, isOrganic, tags } = req.body;

    const images = req.files?.map(f => '/uploads/products/' + f.filename) || [];

    await Product.create({
      name, category, description, ingredients, usageGuide,
      price: parseFloat(price), comparePrice: parseFloat(comparePrice) || null,
      stock: parseInt(stock), unit,
      isOrganic: isOrganic === 'on',
      images, thumbnail: images[0] || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      seller: seller._id,
      status: 'PENDING_REVIEW'
    });

    req.flash('success', 'Sản phẩm đã được gửi để Admin duyệt!');
    res.redirect('/seller/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/seller/products/create');
  }
});

router.get('/products/:id/edit', async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const [product, categories] = await Promise.all([
      Product.findOne({ _id: req.params.id, seller: seller._id }),
      ProductCategory.find({ isActive: true })
    ]);
    if (!product) return res.redirect('/seller/products');
    res.render('pages/seller/product-form', {
      layout: 'layouts/seller',
      title: 'Chỉnh sửa sản phẩm',
      product, categories
    });
  } catch (err) { res.redirect('/seller/products'); }
});

router.post('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const product = await Product.findOne({ _id: req.params.id, seller: seller._id });
    if (!product) return res.redirect('/seller/products');

    const { name, category, description, ingredients, usageGuide, price, comparePrice, stock, unit, isOrganic, tags } = req.body;
    const newImages = req.files?.map(f => '/uploads/products/' + f.filename) || [];

    product.name = name;
    product.category = category;
    product.description = description;
    product.ingredients = ingredients;
    product.usageGuide = usageGuide;
    product.price = parseFloat(price);
    product.comparePrice = parseFloat(comparePrice) || null;
    product.stock = parseInt(stock);
    product.unit = unit;
    product.isOrganic = isOrganic === 'on';
    product.tags = tags ? tags.split(',').map(t => t.trim()) : [];
    if (newImages.length > 0) { product.images = newImages; product.thumbnail = newImages[0]; }
    product.status = 'PENDING_REVIEW'; // Re-review after edit

    await product.save();
    req.flash('success', 'Cập nhật thành công! Đang chờ Admin duyệt lại.');
    res.redirect('/seller/products');
  } catch (err) { req.flash('error', 'Lỗi'); res.redirect('/seller/products'); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    await Product.findOneAndUpdate({ _id: req.params.id, seller: seller._id }, { status: 'INACTIVE' });
    res.json({ success: true });
  } catch (err) { res.json({ success: false }); }
});

// ─── Đơn hàng của Seller ──────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const { status, page = 1 } = req.query;
    const limit = 10;
    let query = { 'items.seller': seller._id };
    if (status && status !== 'ALL') query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((parseInt(page) - 1) * limit).limit(limit),
      Order.countDocuments(query)
    ]);

    res.render('pages/seller/orders', {
      layout: 'layouts/seller',
      title: 'Đơn hàng – ORGO Seller',
      orders, total, activeStatus: status || 'ALL',
      totalPages: Math.ceil(total / limit), currentPage: parseInt(page)
    });
  } catch (err) { res.redirect('/seller/dashboard'); }
});

router.post('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const seller = await Seller.findOne({ user: req.user._id });
    const order = await Order.findOne({ _id: req.params.id, 'items.seller': seller._id });
    if (!order) return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });

    const allowedTransitions = {
      PENDING: ['CONFIRMED'],
      CONFIRMED: ['SHIPPING'],
      SHIPPING: ['DELIVERED']
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      return res.json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    order.status = status;
    if (status === 'CONFIRMED') order.confirmedAt = new Date();
    if (status === 'SHIPPING') order.shippedAt = new Date();
    if (status === 'DELIVERED') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'PAID';
      // Credit seller wallet (90% after platform fee)
      const sellerRevenue = Math.floor(order.total * 0.9);
      const wallet = await Wallet.findOneAndUpdate(
        { user: req.user._id },
        { $inc: { balance: sellerRevenue } },
        { new: true }
      );
      await TransactionLog.create({
        wallet: wallet._id, type: 'CREDIT',
        amount: sellerRevenue, balanceAfter: wallet.balance,
        refId: order._id, refType: 'Order',
        description: `Thu nhập từ đơn hàng #${order.orderCode}`
      });
    }
    await order.save();
    res.json({ success: true, message: `Cập nhật trạng thái: ${status}` });
  } catch (err) { res.json({ success: false }); }
});

// ─── Ví tiền ──────────────────────────────────────────────────────────────────
router.get('/wallet', async (req, res) => {
  try {
    const [wallet, transactions, payoutHistory] = await Promise.all([
      Wallet.findOne({ user: req.user._id }),
      TransactionLog.find({}).populate('wallet').limit(20).sort({ createdAt: -1 }),
      PayoutRequest.find({ requester: req.user._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    let txns = [];
    if (wallet) {
      txns = await TransactionLog.find({ wallet: wallet._id }).sort({ createdAt: -1 }).limit(20);
    }

    res.render('pages/seller/wallet', {
      layout: 'layouts/seller',
      title: 'Ví tiền – ORGO Seller',
      wallet: wallet || { balance: 0, lockedAmount: 0 },
      transactions: txns, payoutHistory
    });
  } catch (err) { res.redirect('/seller/dashboard'); }
});

router.post('/wallet/payout', async (req, res) => {
  try {
    const { amount, bankName, accountNo, accountName } = req.body;
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.json({ success: false, message: 'Không tìm thấy ví' });

    const available = wallet.balance - wallet.lockedAmount;
    if (parseInt(amount) > available) {
      return res.json({ success: false, message: 'Số dư không đủ' });
    }

    const existing = await PayoutRequest.findOne({ requester: req.user._id, status: 'PENDING' });
    if (existing) return res.json({ success: false, message: 'Đang có yêu cầu rút tiền đang xử lý' });

    // Lock amount
    wallet.lockedAmount += parseInt(amount);
    await wallet.save();

    const payout = await PayoutRequest.create({
      wallet: wallet._id, requester: req.user._id,
      amount: parseInt(amount), bankName, accountNo, accountName
    });

    await TransactionLog.create({
      wallet: wallet._id, type: 'LOCK',
      amount: parseInt(amount), balanceAfter: wallet.balance,
      refId: payout._id, refType: 'PayoutRequest',
      description: `Khoá tiền chờ rút – ${bankName} ${accountNo}`
    });

    res.json({ success: true, message: 'Yêu cầu rút tiền đã được gửi!' });
  } catch (err) { res.json({ success: false }); }
});

module.exports = router;
