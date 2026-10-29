const mongoose = require('mongoose');

// TTL index: auto-delete after expiry
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['REGISTER', 'FORGOT_PASSWORD'], default: 'REGISTER' },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes TTL
});

module.exports = mongoose.model('OTP', otpSchema);
