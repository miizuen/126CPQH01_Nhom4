const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  bankName: { type: String, required: true },
  accountNo: { type: String, required: true },
  accountName: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PAID', 'REJECTED'],
    default: 'PENDING'
  },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNote: { type: String },
  processedAt: { type: Date }
}, { timestamps: true });

payoutRequestSchema.index({ requester: 1, status: 1 });
payoutRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
