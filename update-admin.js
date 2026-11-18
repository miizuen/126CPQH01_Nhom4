require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function resetAdmin() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orgo';
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối MongoDB...');

    let admin = await User.findOne({ email: 'admin@orgo.vn' });
    if (!admin) {
      admin = new User({
        fullName: 'Quản Trị Viên ORGO',
        email: 'admin@orgo.vn',
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    }
    
    admin.password = '123456';
    admin.status = 'ACTIVE';
    admin.role = 'ADMIN';
    await admin.save();

    console.log('🎉 CẬP NHẬT THÀNH CÔNG!');
    console.log('Email: admin@orgo.vn');
    console.log('Password: 123456');
    console.log('Role: ADMIN');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

resetAdmin();

