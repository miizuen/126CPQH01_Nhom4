const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },        // Tổng số dư
  lockedAmount: { type: Number, default: 0 },    // Đang chờ rút
  currency: { type: String, default: 'VND' }
}, { timestamps: true });

walletSchema.virtual('availableBalance').get(function() {
  return this.balance - this.lockedAmount;
});

walletSchema.set('toJSON', { virtuals: true });
walletSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wallet', walletSchema);
