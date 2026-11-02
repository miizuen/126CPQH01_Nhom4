const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['PERCENT', 'FIXED'], default: 'PERCENT' },
  value: { type: Number, required: true },       // % hoặc số tiền
  maxDiscount: { type: Number },                  // Giới hạn giảm tối đa (cho PERCENT)
  minOrderAmount: { type: Number, default: 0 },  // Đơn hàng tối thiểu
  usageLimit: { type: Number },                   // Số lần dùng tối đa
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DiscountCode', discountCodeSchema);
