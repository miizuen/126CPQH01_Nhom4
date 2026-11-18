require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./src/models/Article');
const Expert = require('./src/models/Expert');
const User = require('./src/models/User');

async function addArticles() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orgo';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB...');

    // Lấy chuyên gia (ThS. Bạch Ngọc Mỹ Duyên)
    let expert = await Expert.findOne();
    if (!expert) {
      const user = await User.findOne({ email: 'muzien@gmail.com' }) || await User.findOne({ role: 'EXPERT' });
      if (user) {
        expert = await Expert.create({
          user: user._id,
          displayName: 'ThS. Bạch Ngọc Mỹ Duyên',
          title: 'Chuyên gia Dinh dưỡng & Nông nghiệp Hữu cơ'
        });
      }
    }

    const expertId = expert ? expert._id : null;

    const sampleArticles = [
      {
        title: 'Cách Nhận Biết Rau Củ Hữu Cơ Chuẩn Và Rau Phun Thuốc Hóa Học',
        slug: 'cach-nhan-biet-rau-cu-huu-co',
        expert: expertId,
        category: 'BLOG',
        thumbnail: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        summary: 'Rau hữu cơ thường có màu xanh tự nhiên, lá dày và thân chắc, không xanh mướt bất thường như rau kích thích tăng trưởng.',
        content: `Nhiều người tiêu dùng thường lầm tưởng rau đẹp, bóng mượt là rau sạch. Thực tế, nông sản hữu cơ đích thực sinh trưởng trong môi trường tự nhiên, rễ hấp thụ dinh dưỡng từ đất tự nhiên nên:
1. Thân lá dày, màu xanh hơi vàng nhạt tự nhiên chứ không xanh đen bóng bẩy.
2. Vị ngọt đậm đà, mùi thơm đặc trưng rõ rệt khi nấu.
3. Bảo quản trong tủ lạnh lâu hơn rau thông thường mà không bị úng nhũn nhanh.`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: '5 Lợi Ích Vàng Của Việc Ăn Thực Phẩm Hữu Cơ Mỗi Ngày',
        slug: '5-loi-ich-thuc-pham-huu-co',
        expert: expertId,
        category: 'BLOG',
        thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
        summary: 'Thực phẩm hữu cơ không chỉ an toàn hơn mà còn giàu dưỡng chất hơn, giúp tăng cường miễn dịch và bảo vệ sức khỏe lâu dài.',
        content: `Nghiên cứu khoa học chứng minh nông sản hữu cơ mang lại giá trị vượt bậc:
1. Giảm thiểu nguy cơ tích tụ độc tố thuốc bảo vệ thực vật trong cơ thể.
2. Giàu chất chống oxy hóa tự nhiên giúp bảo vệ tế bào và làm chậm quá trình lão hóa.
3. Giữ trọn vẹn hương vị tinh túy nguyên bản của nông sản truyền thống.`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Hướng Dẫn Bảo Quản Rau Củ Hữu Cơ Tươi Lâu Nhất Có Thể',
        slug: 'huong-dan-bao-quan-rau-cu-huu-co',
        expert: expertId,
        category: 'TIPS',
        thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
        summary: 'Bảo quản đúng cách giúp rau củ hữu cơ giữ được độ tươi ngon và dưỡng chất trong 7-10 ngày mà không cần hóa chất.',
        content: `Nguyên tắc bảo quản nông sản hữu cơ đúng chuẩn chuyên gia:
- Không rửa rau trước khi cho vào tủ lạnh để tránh tích tụ độ ẩm dư thừa.
- Dùng hộp kín hoặc túi giấy thoáng khí để bọc rau củ giúp cân bằng độ ẩm.
- Tách biệt hoa quả chín (sinh khí ethylene) khỏi các loại rau lá xanh.`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Thực Đơn Eat Clean 7 Ngày Thanh Lọc Cơ Thể Cho Người Bận Rộn',
        slug: 'thuc-don-eat-clean-7-ngay',
        expert: expertId,
        category: 'RECIPE',
        thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
        summary: 'Thực đơn Eat Clean thanh nhẹ, giàu chất xơ và năng lượng từ rau củ sạch giúp bạn duy trì vóc dáng thon gọn và tinh thần tươi mới.',
        content: `Gợi ý lộ trình ăn lành sống xanh mỗi ngày:
- Bữa sáng: Sinh tố xanh cải kale, táo xanh và hạt chia hữu cơ.
- Bữa trưa: Salad ức gà áp chảo sốt mè rang cùng cà chua bi cherry.
- Bữa tối: Canh súp rau củ thanh đạm và khoai lang nướng mật ong.`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const art of sampleArticles) {
      await Article.findOneAndUpdate(
        { slug: art.slug },
        art,
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Đã nạp thành công ${sampleArticles.length} bài viết cẩm nang vào MongoDB!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

addArticles();

