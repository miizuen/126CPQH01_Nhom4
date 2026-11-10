const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  shopName: { type: String, required: true, trim: true },
  shopSlug: { type: String, unique: true },
  shopDescription: { type: String },
  shopLogo: { type: String, default: null },
  shopBanner: { type: String, default: null },
  bankName: { type: String },
  bankAccountNo: { type: String },
  bankAccountName: { type: String },
  address: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING'
  },
  rating: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate slug
sellerSchema.pre('save', function(next) {
  if (this.isModified('shopName') && !this.shopSlug) {
    const slugify = require('slugify');
    this.shopSlug = slugify(this.shopName, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Seller', sellerSchema);
