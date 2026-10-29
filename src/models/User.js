const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: {
    type: String,
    enum: ['USER', 'SELLER', 'EXPERT', 'ADMIN'],
    default: 'USER'
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'BANNED'],
    default: 'PENDING'
  },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  // Upgrade requests
  upgradeRequest: {
    type: { type: String, enum: ['SELLER', 'EXPERT', null], default: null },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', null], default: null },
    submittedAt: Date,
    reviewedAt: Date,
    adminNote: String
  }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual: không trả password
userSchema.set('toJSON', {
  transform: (_, ret) => { delete ret.password; return ret; }
});

module.exports = mongoose.model('User', userSchema);
