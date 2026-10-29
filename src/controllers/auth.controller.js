const User = require('../models/User');
const OTP = require('../models/OTP');
const Wallet = require('../models/Wallet');
const { sendOTPEmail, sendResetPasswordEmail } = require('../services/mail.service');
const { generateToken, generateResetToken, setTokenCookie, clearTokenCookie, verifyToken } = require('../utils/jwt.utils');

// Helper: generate 6-digit OTP
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── GET /auth/register ───────────────────────────────────────────────────────
exports.getRegister = (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('pages/auth/register', {
    layout: 'layouts/auth',
    title: 'Đăng ký – ORGO'
  });
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
exports.postRegister = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validate
    if (!fullName || !email || !password) {
      req.flash('error', 'Vui lòng điền đầy đủ thông tin');
      return res.redirect('/auth/register');
    }
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect('/auth/register');
    }
    if (password.length < 6) {
      req.flash('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return res.redirect('/auth/register');
    }

    const existing = await User.findOne({ email });
    if (existing && existing.status === 'ACTIVE') {
      req.flash('error', 'Email đã được sử dụng');
      return res.redirect('/auth/register');
    }
    if (existing && existing.status === 'PENDING') {
      req.flash('info', 'Email đã đăng ký, vui lòng xác thực OTP');
      req.session.pendingEmail = email;
      return res.redirect('/auth/verify-otp');
    }

    // Create user (PENDING)
    const user = await User.create({ fullName, email, password, status: 'PENDING' });

    // Generate & send OTP
    const otp = generateOTP();
    await OTP.deleteMany({ email, type: 'REGISTER' });
    await OTP.create({ email, otp, type: 'REGISTER' });
    await sendOTPEmail(email, otp, fullName);

    req.session.pendingEmail = email;
    req.flash('success', `Mã OTP đã gửi đến ${email}. Kiểm tra hộp thư!`);
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại');
    res.redirect('/auth/register');
  }
};

// ─── GET /auth/verify-otp ─────────────────────────────────────────────────────
exports.getVerifyOTP = (req, res) => {
  if (!req.session.pendingEmail) return res.redirect('/auth/register');
  res.render('pages/auth/verify-otp', {
    layout: 'layouts/auth',
    title: 'Xác thực OTP – ORGO',
    email: req.session.pendingEmail
  });
};

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
exports.postVerifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.session.pendingEmail;

    if (!email) {
      req.flash('error', 'Phiên hết hạn, vui lòng đăng ký lại');
      return res.redirect('/auth/register');
    }

    const otpRecord = await OTP.findOne({ email, otp, type: 'REGISTER' });
    if (!otpRecord) {
      req.flash('error', 'OTP không đúng hoặc đã hết hạn');
      return res.redirect('/auth/verify-otp');
    }

    // Activate user
    const user = await User.findOneAndUpdate(
      { email },
      { status: 'ACTIVE' },
      { new: true }
    );

    // Create wallet for user
    await Wallet.create({ user: user._id });

    // Delete OTP
    await OTP.deleteMany({ email, type: 'REGISTER' });
    delete req.session.pendingEmail;

    // Auto login
    const token = generateToken(user._id);
    setTokenCookie(res, token);

    req.flash('success', 'Chào mừng đến với ORGO! 🌿');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/auth/verify-otp');
  }
};

// ─── POST /auth/resend-otp ────────────────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const email = req.session.pendingEmail;
    if (!email) return res.json({ success: false, message: 'Phiên hết hạn' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Không tìm thấy tài khoản' });

    const otp = generateOTP();
    await OTP.deleteMany({ email, type: 'REGISTER' });
    await OTP.create({ email, otp, type: 'REGISTER' });
    await sendOTPEmail(email, otp, user.fullName);

    res.json({ success: true, message: 'OTP đã được gửi lại!' });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi gửi OTP' });
  }
};

// ─── GET /auth/login ──────────────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('pages/auth/login', {
    layout: 'layouts/auth',
    title: 'Đăng nhập – ORGO'
  });
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth/login');
    }

    if (user.status === 'PENDING') {
      req.session.pendingEmail = email;
      req.flash('info', 'Tài khoản chưa xác thực. Vui lòng nhập OTP');
      return res.redirect('/auth/verify-otp');
    }
    if (user.status === 'BANNED') {
      req.flash('error', 'Tài khoản của bạn đã bị khóa');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth/login');
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);
    req.session.user = { _id: user._id, role: user.role, fullName: user.fullName };

    // Redirect theo role
    const redirectMap = {
      ADMIN: '/admin',
      SELLER: '/seller/dashboard',
      EXPERT: '/expert',
      USER: req.session.returnTo || '/'
    };
    delete req.session.returnTo;

    req.flash('success', `Chào mừng trở lại, ${user.fullName}! 🌿`);
    res.redirect(redirectMap[user.role] || '/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/auth/login');
  }
};

// ─── POST /auth/logout ────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  clearTokenCookie(res);
  req.session.destroy();
  res.redirect('/auth/login');
};

// ─── GET /auth/forgot-password ───────────────────────────────────────────────
exports.getForgotPassword = (req, res) => {
  res.render('pages/auth/forgot-password', {
    layout: 'layouts/auth',
    title: 'Quên mật khẩu – ORGO'
  });
};

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, status: 'ACTIVE' });

    // Luôn báo thành công để tránh lộ email
    if (user) {
      const resetToken = generateResetToken(user._id);
      const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`;
      await sendResetPasswordEmail(email, user.fullName, resetLink);
    }

    req.flash('success', 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi!');
    res.redirect('/auth/forgot-password');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/auth/forgot-password');
  }
};

// ─── GET /auth/reset-password ─────────────────────────────────────────────────
exports.getResetPassword = (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect('/auth/forgot-password');
  try {
    verifyToken(token);
    res.render('pages/auth/reset-password', {
      layout: 'layouts/auth',
      title: 'Đặt lại mật khẩu – ORGO',
      token
    });
  } catch {
    req.flash('error', 'Link đã hết hạn hoặc không hợp lệ');
    res.redirect('/auth/forgot-password');
  }
};

// ─── POST /auth/reset-password ───────────────────────────────────────────────
exports.postResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect(`/auth/reset-password?token=${token}`);
    }
    if (password.length < 6) {
      req.flash('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return res.redirect(`/auth/reset-password?token=${token}`);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      req.flash('error', 'Không tìm thấy tài khoản');
      return res.redirect('/auth/forgot-password');
    }

    user.password = password;
    await user.save();

    req.flash('success', 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error', 'Link đã hết hạn hoặc không hợp lệ');
    res.redirect('/auth/forgot-password');
  }
};
