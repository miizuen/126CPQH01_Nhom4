const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT', 'LOCK', 'UNLOCK'],
    required: true
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  refId: { type: mongoose.Schema.Types.ObjectId }, // orderId hoặc payoutId
  refType: { type: String, enum: ['Order', 'PayoutRequest'] },
  description: { type: String }
}, { timestamps: true });

transactionLogSchema.index({ wallet: 1, createdAt: -1 });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
