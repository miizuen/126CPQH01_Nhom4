const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Article = require('../models/Article');
const Seller = require('../models/Seller');

router.use(authenticate);

// ─── Trang chủ ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [featuredProducts, categories, latestArticles, sellers] = await Promise.all([
      Product.find({ status: 'ACTIVE', isFeatured: true })
        .populate('seller', 'shopName shopSlug')
        .limit(8).sort({ totalSold: -1 }),
      ProductCategory.find({ isActive: true }).sort({ order: 1 }).limit(8),
      Article.find({ status: 'PUBLISHED' })
        .populate({ path: 'expert', populate: { path: 'user', select: 'fullName avatar' } })
        .sort({ publishedAt: -1 }).limit(6),
      Seller.find({ status: 'ACTIVE' }).limit(6)
    ]);

    // Best sellers
    const bestSellers = await Product.find({ status: 'ACTIVE' })
      .populate('seller', 'shopName')
      .sort({ totalSold: -1 }).limit(8);

    // New arrivals
    const newArrivals = await Product.find({ status: 'ACTIVE' })
      .populate('seller', 'shopName')
      .sort({ createdAt: -1 }).limit(8);

    res.render('pages/public/home', {
      layout: 'layouts/main',
      title: 'ORGO – Thực Phẩm Hữu Cơ Đích Thực',
      featuredProducts, categories, latestArticles,
      bestSellers, newArrivals, sellers
    });
  } catch (err) {
    console.error(err);
    res.render('pages/error/500', { layout: 'layouts/main', title: 'Lỗi' });
  }
});

// ─── Shop / Danh sách sản phẩm ───────────────────────────────────────────────
router.get('/shop', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, minRating, organic, sort, page = 1 } = req.query;
    const limit = 12;
    const skip = (parseInt(page) - 1) * limit;

    let query = { status: 'ACTIVE' };

    // Text search
    if (q) query.$text = { $search: q };

    // Category filter
    if (category) {
      const cat = await ProductCategory.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Rating filter
    if (minRating) query.averageRating = { $gte: parseFloat(minRating) };

    // Organic filter
    if (organic === 'true') query.isOrganic = true;

    // Sort
    let sortOpt = { createdAt: -1 };
    if (sort === 'price_asc') sortOpt = { price: 1 };
    else if (sort === 'price_desc') sortOpt = { price: -1 };
    else if (sort === 'rating') sortOpt = { averageRating: -1 };
    else if (sort === 'best_seller') sortOpt = { totalSold: -1 };

    const [products, total, categories] = await Promise.all([
      Product.find(query).populate('seller', 'shopName').sort(sortOpt).skip(skip).limit(limit),
      Product.countDocuments(query),
      ProductCategory.find({ isActive: true }).sort({ order: 1 })
    ]);

    res.render('pages/public/shop', {
      layout: 'layouts/main',
      title: q ? `Tìm kiếm: "${q}" – ORGO` : 'Cửa hàng – ORGO',
      products, categories, total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ─── Chi tiết sản phẩm ────────────────────────────────────────────────────────
router.get('/shop/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'ACTIVE' })
      .populate('seller')
      .populate('category');

    if (!product) {
      return res.status(404).render('pages/error/404', {
        layout: 'layouts/main', title: 'Không tìm thấy sản phẩm'
      });
    }

    const Review = require('../models/Review');
    const [reviews, relatedProducts] = await Promise.all([
      Review.find({ product: product._id, status: 'PUBLISHED' })
        .populate('user', 'fullName avatar').sort({ createdAt: -1 }).limit(10),
      Product.find({
        category: product.category,
        status: 'ACTIVE',
        _id: { $ne: product._id }
      }).populate('seller', 'shopName').limit(4)
    ]);

    // Rating distribution
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => ratingDist[r.rating]++);

    res.render('pages/public/product-detail', {
      layout: 'layouts/main',
      title: `${product.name} – ORGO`,
      product, reviews, relatedProducts, ratingDist
    });
  } catch (err) {
    console.error(err);
    res.redirect('/shop');
  }
});

// ─── Blog / Bài viết ─────────────────────────────────────────────────────────
router.get('/blog', async (req, res) => {
  try {
    const { category, page = 1 } = req.query;
    const limit = 9;
    const skip = (parseInt(page) - 1) * limit;

    let query = { status: 'PUBLISHED' };
    if (category && ['BLOG', 'RECIPE', 'FAQ', 'NEWS'].includes(category)) {
      query.category = category;
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate({ path: 'expert', populate: { path: 'user', select: 'fullName avatar' } })
        .sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Article.countDocuments(query)
    ]);

    res.render('pages/public/blog', {
      layout: 'layouts/main',
      title: 'Blog & Công thức – ORGO',
      articles, total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      activeCategory: category || 'ALL'
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ─── Chi tiết bài viết ────────────────────────────────────────────────────────
router.get('/blog/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, status: 'PUBLISHED' })
      .populate({ path: 'expert', populate: { path: 'user', select: 'fullName avatar' } })
      .populate('linkedProducts');

    if (!article) {
      return res.status(404).render('pages/error/404', { layout: 'layouts/main', title: '404' });
    }

    // Increment view
    await Article.findByIdAndUpdate(article._id, { $inc: { viewCount: 1 } });

    const related = await Article.find({
      status: 'PUBLISHED',
      category: article.category,
      _id: { $ne: article._id }
    }).limit(3).sort({ publishedAt: -1 });

    res.render('pages/public/article-detail', {
      layout: 'layouts/main',
      title: `${article.title} – ORGO`,
      article, related
    });
  } catch (err) {
    console.error(err);
    res.redirect('/blog');
  }
});

// ─── Trang About ─────────────────────────────────────────────────────────────
router.get('/about', (req, res) => {
  res.render('pages/public/about', {
    layout: 'layouts/main',
    title: 'Về Chúng Tôi – ORGO'
  });
});

// ─── Trang Contact ────────────────────────────────────────────────────────────
router.get('/contact', (req, res) => {
  res.render('pages/public/contact', {
    layout: 'layouts/main',
    title: 'Liên Hệ – ORGO'
  });
});

module.exports = router;
