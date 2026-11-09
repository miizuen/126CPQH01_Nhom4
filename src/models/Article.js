const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  expert: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
  category: {
    type: String,
    enum: ['BLOG', 'RECIPE', 'FAQ', 'NEWS'],
    default: 'BLOG'
  },
  thumbnail: { type: String },
  summary: { type: String },          // Mô tả ngắn
  content: { type: String, required: true }, // Rich text HTML
  tags: [{ type: String }],
  // Linked products
  linkedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'],
    default: 'DRAFT'
  },
  adminNote: { type: String },
  publishedAt: { type: Date },
  // Stats
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

articleSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    const slugify = require('slugify');
    this.slug = slugify(this.title, { lower: true, locale: 'vi' }) + '-' + Date.now();
  }
  if (this.status === 'PUBLISHED' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ expert: 1, status: 1 });
articleSchema.index({ title: 'text', summary: 'text', tags: 'text' });

module.exports = mongoose.model('Article', articleSchema);
