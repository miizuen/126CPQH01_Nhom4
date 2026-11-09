const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  displayName: { type: String, required: true },
  title: { type: String }, // TS., BS., Th.S., etc.
  specialization: { type: String }, // Dinh dưỡng, Y học cổ truyền, etc.
  bio: { type: String },
  avatar: { type: String, default: null },
  credentials: { type: String }, // Bằng cấp, chứng chỉ
  totalArticles: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING'
  }
}, { timestamps: true });

module.exports = mongoose.model('Expert', expertSchema);
