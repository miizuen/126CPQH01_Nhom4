const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // VD: "500g", "1kg"
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  sku: { type: String }
});

const organicCertSchema = new mongoose.Schema({
  certName: { type: String }, // VD: "USDA Organic", "VietGAP"
  certNumber: { type: String },
  issuedBy: { type: String },
  validUntil: { type: Date },
  image: { type: String }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
  description: { type: String },
  ingredients: { type: String },      // Thành phần
  usageGuide: { type: String },        // Hướng dẫn sử dụng
  images: [{ type: String }],          // Array ảnh URLs
  thumbnail: { type: String },         // Ảnh chính
  price: { type: Number, required: true },  // Giá base
  comparePrice: { type: Number },      // Giá gốc (để hiện % giảm)
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'gói' }, // gói, kg, lít, hộp
  weight: { type: Number },            // grams
  variants: [variantSchema],
  organicCert: organicCertSchema,
  isOrganic: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE'],
    default: 'PENDING_REVIEW'
  },
  adminNote: { type: String },          // Note khi reject
  // Stats
  totalSold: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  tags: [{ type: String }]
}, { timestamps: true });

// Auto slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, { lower: true, locale: 'vi' }) + '-' + Date.now();
  }
  next();
});

// Text search index
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);
