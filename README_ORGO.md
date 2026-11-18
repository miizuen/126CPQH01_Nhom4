# ORGO
Chạy chương trình thì sẽ thấy một dòng mã hashcode in dưới terminal (dòng cuối cùng sau khi terminal chạy xong) giống dạng như: $2a$10$bkVcIBbOEZSkI79.kObjOOmm5NwdRu28mbgtujHsKPUpc6a2cvQ82


Sau khi chạy chương trình thì nhập dữ liệu trong database như sau
-- =====================
-- 1. INSERT VAI TRO
-- =====================
INSERT INTO VaiTro (ten_vai_tro) VALUES ('ADMIN');
INSERT INTO VaiTro (ten_vai_tro) VALUES ('USER');
INSERT INTO VaiTro (ten_vai_tro) VALUES ('SELLER');
INSERT INTO VaiTro (ten_vai_tro) VALUES ('EXPERT');

-- =====================
-- 2. INSERT TAI KHOAN
-- =====================
-- Password: 123456 (đã BCrypt)
INSERT INTO TaiKhoan (username, mat_khau, id_vai_tro, anh_dai_dien)
VALUES ('admin',  'nhập mã hashcode vừa copy', 1, NULL);

INSERT INTO TaiKhoan (username, mat_khau, id_vai_tro, anh_dai_dien)
VALUES ('truong', 'nhập mã hashcode', 2, NULL);

INSERT INTO TaiKhoan (username, mat_khau, id_vai_tro, anh_dai_dien)
VALUES ('phu', 'nhập mã hashcode', 3, NULL);

INSERT INTO TaiKhoan (username, mat_khau, id_vai_tro, anh_dai_dien)
VALUES ('vi', 'Nhập mã hashcode', 2, NULL);

-- =====================
-- 3. INSERT NGUOI DUNG
-- =====================
INSERT INTO NguoiDung (id_tai_khoan, ho_ten, email, so_dien_thoai, trang_thai)
VALUES (1, N'Administrator', 'admin@orgo.com', '0900000001', 'ACTIVE');

INSERT INTO NguoiDung (id_tai_khoan, ho_ten, email, so_dien_thoai, trang_thai)
VALUES (2, N'Nguyễn Trí Trường', 'nguyentritruong2005@gmail.com', '0935233627', 'ACTIVE');

INSERT INTO NguoiDung (id_tai_khoan, ho_ten, email, so_dien_thoai, trang_thai)
VALUES (3, N'Nguyễn Văn Phú', 'phu@orgo.com', '0900000003', 'ACTIVE'); --Nên nhập email thật

INSERT INTO NguoiDung (id_tai_khoan, ho_ten, email, so_dien_thoai, trang_thai)
VALUES (4, N'Nguyễn Hà Vi', 'vi@orgo.com', '0900000004', 'ACTIVE'); -- nên nhập email thật


Lệnh chạy chương trình:
set JAVA_HOME=C:\Program Files\Java\jdk-17

set PATH=%JAVA_HOME%\bin;%PATH%

## Tài Liệu Hệ Thống Escrow

Để hiểu rõ hơn về luồng hoạt động escrow trong hệ thống ORGO, vui lòng tham khảo:

- **[ESCROW_FLOW_DOCUMENTATION.md](ESCROW_FLOW_DOCUMENTATION.md)**: Tài liệu chi tiết về vai trò của từng bảng và luồng hoạt động escrow
- **Dashboard Admin**: Hiển thị thông tin hoa hồng admin và tài khoản escrow

### Các Bảng Chính Trong Hệ Thống Escrow:
- **EscrowBalance**: Giữ tiền tạm thời của đơn hàng
- **PaymentHistory**: Lịch sử thanh toán của user
- **TransactionHistory**: Nhật ký biến động tài chính
- **WalletBalance**: Số dư ví của seller/admin

gradlew.bat bootRun

gradlew.bat --stop

---

## Ghi chú về mô hình escrow

- Seller đăng ký tại `/register/seller` và cần khai báo ngân hàng ngay từ đầu.
- Admin duyệt seller có thể xem thông tin ngân hàng trực tiếp trên màn chi tiết duyệt.
- Khi đơn hàng hoàn tất, tiền được đi qua luồng escrow và được chia theo từng seller tự động.
- Seller không còn luồng rút tiền thủ công; email duyệt seller sẽ nhắc lại bank info và quy trình escrow.

## Kiểm thử đã bổ sung

- Unit test cho `EscrowServiceImpl`:
  - tạo escrow
  - cộng tổng tiền escrow
  - cộng tổng hoa hồng admin
  - settlement cho 1 seller
  - settlement cho nhiều seller
  - trường hợp escrow không tồn tại


