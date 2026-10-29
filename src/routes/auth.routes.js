const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');

router.get('/register', authCtrl.getRegister);
router.post('/register', authCtrl.postRegister);
router.get('/verify-otp', authCtrl.getVerifyOTP);
router.post('/verify-otp', authCtrl.postVerifyOTP);
router.post('/resend-otp', authCtrl.resendOTP);
router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.post('/logout', authCtrl.logout);
router.get('/logout', authCtrl.logout);
router.get('/forgot-password', authCtrl.getForgotPassword);
router.post('/forgot-password', authCtrl.postForgotPassword);
router.get('/reset-password', authCtrl.getResetPassword);
router.post('/reset-password', authCtrl.postResetPassword);

module.exports = router;
