require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const flash = require('express-flash');
const morgan = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();

// ─── Connect MongoDB ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── View Engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Session ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
}));
app.use(flash());

// ─── Global Locals ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', require('./src/routes/public.routes'));
app.use('/auth', require('./src/routes/auth.routes'));
app.use('/cart', require('./src/routes/cart.routes'));
app.use('/checkout', require('./src/routes/checkout.routes'));
app.use('/user', require('./src/routes/user.routes'));
app.use('/seller', require('./src/routes/seller.routes'));
app.use('/expert', require('./src/routes/expert.routes'));
app.use('/admin', require('./src/routes/admin.routes'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('pages/error/404', {
    layout: 'layouts/main',
    title: '404 – Trang Không Tìm Thấy'
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error/500', {
    layout: 'layouts/main',
    title: '500 – Lỗi Máy Chủ',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Có lỗi xảy ra'
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌿 ORGO Server running at http://localhost:${PORT}`);
});

module.exports = app;