const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },    // Snapshot
  productImage: { type: String },
  variantName: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  sellerName: { type: String },
  reviewed: { type: Boolean, default: false }
});

const orderSchema = new mongoose.Schema({
  orderCode: { type: String, unique: true },  // ORD-XXXXXX
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  // Shipping info snapshot
  shippingAddress: {
    fullName: String,
    phone: String,
    province: String,
    district: String,
    ward: String,
    address: String
  },
  // Pricing
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 30000 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  // Payment
  paymentMethod: {
    type: String,
    enum: ['COD', 'BANK_TRANSFER'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID', 'REFUNDED'],
    default: 'UNPAID'
  },
  bankTransRef: { type: String },
  // Order status
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'],
    default: 'PENDING'
  },
  // Coupon
  couponCode: { type: String },
  // Timestamps for tracking
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  // Return/Refund
  returnReason: String,
  returnNote: String,
  returnApprovedAt: Date
}, { timestamps: true });

// Auto generate orderCode
orderSchema.pre('save', async function(next) {
  if (!this.orderCode) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderCode = 'ORD-' + String(count + 1).padStart(6, '0');
  }
  next();
});

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ orderCode: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
