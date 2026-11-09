const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const Article = require('../models/Article');
const Expert = require('../models/Expert');

// ─── Middleware: Yêu cầu EXPERT hoặc ADMIN ──────────────────────────────────
router.use(authenticate, (req, res, next) => {
  if (['EXPERT', 'ADMIN'].includes(req.user.role)) return next();
  req.flash('error', 'Chỉ Chuyên gia mới có quyền truy cập');
  res.redirect('/');
});

// ─── GET /expert: Danh sách bài viết ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const expertProfile = await Expert.findOne({ user: req.user._id });
    const expertId = expertProfile ? expertProfile._id : req.user._id;

    const articles = await Article.find({
      $or: [{ expert: expertId }, { expert: req.user._id }]
    }).sort({ createdAt: -1 });

    res.render('pages/expert/articles', {
      title: 'Quản lý bài viết kiến thức hữu cơ – Chuyên gia',
      expertProfile,
      articles
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error/500', { message: 'Lỗi tải bài viết' });
  }
});

// ─── GET /expert/new: Trang tạo bài viết mới ────────────────────────────────
router.get('/new', async (req, res) => {
  try {
    const categories = ['BLOG', 'RECIPE', 'FAQ', 'NEWS'];
    res.render('pages/expert/article-form', {
      title: 'Viết bài chia sẻ kiến thức mới',
      article: {},
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('pages/error/500', { message: 'Lỗi tải danh mục bài viết' });
  }
});

// ─── POST /expert/new: Lưu bài viết ─────────────────────────────────────────
router.post('/new', async (req, res) => {
  try {
    const { title, summary, content, category, thumbnail } = req.body;
    let expertProfile = await Expert.findOne({ user: req.user._id });
    if (!expertProfile) {
      expertProfile = await Expert.create({
        user: req.user._id,
        displayName: req.user.fullName || 'Chuyên gia ORGO',
        title: 'Chuyên gia Nông nghiệp Hữu cơ'
      });
    }

    await Article.create({
      title,
      summary: summary || '',
      content: content || '',
      category: category || 'BLOG',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      expert: expertProfile._id,
      status: 'PUBLISHED',
      publishedAt: new Date()
    });

    req.flash('success', 'Xuất bản bài viết kiến thức thành công! 🌿');
    res.redirect('/expert');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi lưu bài viết: ' + err.message);
    res.redirect('/expert/new');
  }
});

module.exports = router;
