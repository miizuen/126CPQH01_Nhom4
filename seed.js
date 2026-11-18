require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const ProductCategory = require('./src/models/ProductCategory');
const Product = require('./src/models/Product');
const Seller = require('./src/models/Seller');
const Expert = require('./src/models/Expert');
const Article = require('./src/models/Article');
const DiscountCode = require('./src/models/DiscountCode');

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orgo';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối MongoDB để nạp dữ liệu mẫu...');

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      ProductCategory.deleteMany({}),
      Product.deleteMany({}),
      Seller.deleteMany({}),
      Expert.deleteMany({}),
      Article.deleteMany({}),
      DiscountCode.deleteMany({})
    ]);

    console.log('🧹 Đã dọn dẹp dữ liệu cũ...');

    // 1. Tạo tài khoản mẫu (để User pre-save tự hash 1 lần)
    const admin = await User.create({
      fullName: 'Quản Trị Viên ORGO',
      email: 'admin@orgo.vn',
      password: '123456',
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const sellerUser = await User.create({
      fullName: 'Nông Trại Xanh Đà Lạt',
      email: 'seller@orgo.vn',
      password: '123456',
      role: 'SELLER',
      status: 'ACTIVE'
    });

    const expertUser = await User.create({
      fullName: 'Bạch Ngọc Mỹ Duyên',
      email: 'muzien@gmail.com',
      password: '123456',
      role: 'EXPERT',
      status: 'ACTIVE'
    });

    const customerPhu = await User.create({
      fullName: 'Võ Đức Phú',
      email: 'voducphu1912005@gmail.com',
      password: '123456',
      role: 'USER',
      status: 'ACTIVE',
      phone: '0901234567'
    });

    // 2. Tạo thông tin Seller & Expert
    const seller = await Seller.create({
      shopName: 'Nông Trại Hữu Cơ Đà Lạt BioFarm',
      shopSlug: 'biofarm-da-lat',
      user: sellerUser._id,
      description: 'Chuyên cung cấp rau củ quả chuẩn hữu cơ USDA và VietGAP được nuôi trồng tự nhiên trên cao nguyên Đà Lạt.',
      phone: '0905123456',
      address: 'Phường 11, TP. Đà Lạt, Lâm Đồng',
      status: 'ACTIVE'
    });

    const expert = await Expert.create({
      user: expertUser._id,
      displayName: 'ThS. Bạch Ngọc Mỹ Duyên',
      title: 'Chuyên gia Dinh dưỡng & Nông nghiệp Hữu cơ',
      specialization: 'Canh tác sinh thái & An toàn thực phẩm',
      status: 'ACTIVE'
    });

    // 3. Tạo danh mục sản phẩm
    const catRauCu = await ProductCategory.create({
      name: 'Rau Củ Tươi Sạch',
      slug: 'rau-cu',
      icon: '🥬',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
      description: 'Rau xanh và củ quả tươi sạch thu hoạch trong ngày'
    });

    const catTraiCay = await ProductCategory.create({
      name: 'Trái Cây Hữu Cơ',
      slug: 'trai-cay',
      icon: '🍎',
      image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
      description: 'Trái cây đặc sản hữu cơ nhiều dinh dưỡng'
    });

    const catHat = await ProductCategory.create({
      name: 'Hạt & Ngũ Cốc',
      slug: 'ngu-coc',
      icon: '🥜',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      description: 'Các loại hạt dinh dưỡng tự nhiên không phẩm màu'
    });

    const catDoUong = await ProductCategory.create({
      name: 'Nước Ép & Trà Thảo Mộc',
      slug: 'do-uong',
      icon: '🍵',
      image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
      description: 'Thức uống thanh lọc cơ thể từ nguyên liệu sạch'
    });

    // 4. Tạo sản phẩm mẫu
    const products = [
      {
        name: 'Cải Kale Hữu Cơ Đà Lạt (Cải Xoăn)',
        slug: 'cai-kale-huu-co-da-lat',
        category: catRauCu._id,
        seller: seller._id,
        price: 45000,
        unit: 'bó 500g',
        stock: 50,
        origin: 'Đà Lạt BioFarm',
        certifications: ['USDA Organic', 'VietGAP'],
        isFeatured: true,
        images: ['/images/cai-kale.jpg'],
        description: 'Cải Kale được mệnh danh là nữ hoàng của các loại rau, giàu vitamin A, C, K và chất chống oxy hóa. Trồng theo quy trình khép kín không hóa chất.'
      },
      {
        name: 'Cà Chua Bi Cherry Đỏ Ngọt Tự Nhiên',
        slug: 'ca-chua-bi-cherry-do',
        category: catRauCu._id,
        seller: seller._id,
        price: 55000,
        unit: 'hộp 500g',
        stock: 40,
        origin: 'Nông trại Lâm Viên',
        certifications: ['VietGAP'],
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'],
        description: 'Cà chua bi quả mọng, vị ngọt thanh tự nhiên, giòn ngọt, thích hợp ăn sống và làm salad dinh dưỡng.'
      },
      {
        name: 'Dâu Tây Hữu Cơ Giống Nhật Đà Lạt',
        slug: 'dau-tay-huu-co-giong-nhat',
        category: catTraiCay._id,
        seller: seller._id,
        price: 180000,
        unit: 'hộp 500g',
        stock: 25,
        origin: 'Vườn dâu Thung Lũng Xanh',
        certifications: ['VietGAP', 'GlobalGAP'],
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80'],
        description: 'Dâu tây thơm lừng, quả đỏ căng mọng, vị chua ngọt cân bằng. Thu hoạch bằng tay lúc sáng sớm để giữ độ tươi tuyệt đối.'
      },
      {
        name: 'Bơ Sáp 034 Đặc Sản Tây Nguyên',
        slug: 'bo-sap-034-tay-nguyen',
        category: catTraiCay._id,
        seller: seller._id,
        price: 75000,
        unit: 'kg',
        stock: 60,
        origin: 'Đắk Lắk Farm',
        certifications: ['VietGAP'],
        isFeatured: true,
        images: ['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80'],
        description: 'Bơ 034 quả dài, cơm vàng dẻo quánh, béo ngậy, hạt lép. Cung cấp hàm lượng chất béo tốt không bão hòa cho tim mạch.'
      },
      {
        name: 'Hạt Hạnh Nhân Tự Nhiên Sấy Mộc',
        slug: 'hat-hanh-nhan-say-moc',
        category: catHat._id,
        seller: seller._id,
        price: 120000,
        unit: 'hũ 300g',
        stock: 35,
        origin: 'Eco Nut Farm',
        certifications: ['USDA Organic'],
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=600&q=80'],
        description: 'Hạnh nhân hạt mẩy, sấy mộc tự nhiên không muối không đường, giữ trọn hương vị bùi béo tự nhiên.'
      },
      {
        name: 'Trà Hoa Cúc Vàng Sấy Lạnh Thanh Nhiệt',
        slug: 'tra-hoa-cuc-vang-say-lanh',
        category: catDoUong._id,
        seller: seller._id,
        price: 95000,
        unit: 'hũ 100g',
        stock: 45,
        origin: 'Thảo Mộc Xanh',
        certifications: ['EU Organic'],
        isFeatured: false,
        images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'],
        description: 'Hoa cúc vàng được sấy lạnh nguyên bông, giúp giữ nguyên hương thơm dịu nhẹ và màu sắc tự nhiên. Giúp an thần, ngủ ngon.'
      }
    ];

    const productsToInsert = products.map(p => ({
      ...p,
      status: 'ACTIVE',
      thumbnail: p.images[0],
      isOrganic: true
    }));

    await Product.insertMany(productsToInsert);
    console.log(`✅ Đã thêm ${products.length} sản phẩm hữu cơ mẫu...`);

    // 5. Tạo bài viết cẩm nang
    await Article.insertMany([
      {
        title: 'Cách Nhận Biết Rau Củ Hữu Cơ Chuẩn Và Rau Phun Thuốc Hóa Học',
        slug: 'cach-nhan-biet-rau-cu-huu-co',
        expert: expert._id,
        category: 'BLOG',
        thumbnail: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        summary: 'Rau hữu cơ thường có màu xanh tự nhiên, lá dày và thân chắc, không xanh mướt bất thường như rau kích thích tăng trưởng.',
        content: 'Nhiều người tiêu dùng thường lầm tưởng rau đẹp, bóng mượt là rau sạch.\n1. Thân lá dày, màu xanh hơi vàng nhạt tự nhiên chứ không xanh đen bóng bẩy.\n2. Vị ngọt đậm đà, mùi thơm đặc trưng rõ rệt khi nấu.\n3. Bảo quản trong tủ lạnh lâu hơn rau thông thường mà không bị úng nhũn nhanh.',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: '5 Lợi Ích Vàng Của Việc Ăn Thực Phẩm Hữu Cơ Mỗi Ngày',
        slug: '5-loi-ich-thuc-pham-huu-co',
        expert: expert._id,
        category: 'BLOG',
        thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
        summary: 'Thực phẩm hữu cơ không chỉ an toàn hơn mà còn giàu dưỡng chất hơn, giúp tăng cường miễn dịch và bảo vệ sức khỏe lâu dài.',
        content: 'Thực phẩm hữu cơ mang lại lợi ích vượt trội:\n1. Không tồn dư thuốc trừ sâu – Giảm nguy cơ nhiễm độc mãn tính.\n2. Giàu chất chống oxy hóa hơn 20-40% – Polyphenol, flavonoid giúp chống lão hóa.\n3. Tốt cho hệ tiêu hóa – Cân bằng vi khuẩn đường ruột.\n4. Bảo vệ môi trường – Không ô nhiễm nguồn nước.\n5. Hương vị đậm đà tự nhiên hơn.',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Hướng Dẫn Bảo Quản Rau Củ Hữu Cơ Tươi Lâu Nhất Có Thể',
        slug: 'huong-dan-bao-quan-rau-cu-huu-co',
        expert: expert._id,
        category: 'BLOG',
        thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
        summary: 'Bảo quản đúng cách giúp rau củ hữu cơ giữ được độ tươi ngon và dưỡng chất trong 7-10 ngày mà không cần hóa chất.',
        content: 'Rau củ hữu cơ không dùng chất bảo quản nên cần xử lý đúng cách:\n- Không rửa rau trước khi cất vào tủ lạnh.\n- Tách riêng rau lá, rau củ và trái cây.\n- Rau lá: Gói trong khăn giấy ẩm, cho vào túi zip.\n- Củ cà rốt, củ dền: Cắt bỏ lá, bọc kín, ngăn mát.\n- Cà chua, bơ: Để nhiệt độ phòng cho chín rồi mới vào tủ lạnh.\n- Rau thơm: Cắm gốc vào ly nước nhỏ, đặt trong tủ lạnh.',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('✅ Nạp dữ liệu hoàn tất 100%!');
    console.log('\n--- TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM ---');
    console.log('👑 Admin: admin@orgo.vn | Mật khẩu: 123456');
    console.log('🏪 Seller: seller@orgo.vn | Mật khẩu: 123456');
    console.log('👤 Khách hàng (Phú): voducphu1912005@gmail.com | Mật khẩu: 123456');
    console.log('🔬 Chuyên gia (Duyên): muzien@gmail.com | Mật khẩu: 123456');
    console.log('-------------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi nạp dữ liệu:', err);
    process.exit(1);
  }
}

seed();


