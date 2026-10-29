const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  variantName: { type: String, default: null },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true } // Snapshot giá lúc thêm vào giỏ
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  appliedCoupon: {
    code: { type: String },
    discount: { type: Number, default: 0 } // Số tiền giảm
  }
}, { timestamps: true });

// Virtual: tổng tiền
cartSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
