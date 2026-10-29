const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/**
 * Gửi OTP xác thực đăng ký
 */
const sendOTPEmail = async (email, otp, fullName) => {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: '🌿 ORGO – Xác thực tài khoản của bạn',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#2d6a4f,#52b788);padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🌿 ORGO</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Thực phẩm hữu cơ – Sức khoẻ đích thực</p>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 8px;">Xin chào, ${fullName}! 👋</h2>
            <p style="color:#666;line-height:1.6;margin:0 0 32px;">Cảm ơn bạn đã đăng ký tài khoản ORGO. Nhập mã OTP dưới đây để kích hoạt tài khoản:</p>
            <div style="text-align:center;margin:0 0 32px;">
              <div style="display:inline-block;background:#f0faf4;border:2px dashed #52b788;border-radius:16px;padding:20px 40px;">
                <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#2d6a4f;">${otp}</span>
              </div>
              <p style="color:#888;font-size:13px;margin:12px 0 0;">⏱ Mã có hiệu lực trong <strong>5 phút</strong></p>
            </div>
            <div style="background:#fff8e1;border-left:4px solid #f4c542;border-radius:8px;padding:14px 16px;margin:0 0 24px;">
              <p style="margin:0;color:#7a6000;font-size:13px;">⚠️ Không chia sẻ mã này với bất kỳ ai. ORGO không bao giờ hỏi mã OTP của bạn.</p>
            </div>
            <p style="color:#aaa;font-size:12px;margin:0;">Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
          </div>
          <div style="background:#f9f9f7;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#bbb;font-size:12px;">© 2024 ORGO – Nền tảng thực phẩm hữu cơ</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email reset mật khẩu
 */
const sendResetPasswordEmail = async (email, fullName, resetLink) => {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: '🌿 ORGO – Đặt lại mật khẩu',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#2d6a4f,#52b788);padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">🌿 ORGO</h1>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 8px;">Xin chào, ${fullName}!</h2>
            <p style="color:#666;line-height:1.6;margin:0 0 32px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút dưới đây:</p>
            <div style="text-align:center;margin:0 0 32px;">
              <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#2d6a4f,#52b788);color:#fff;text-decoration:none;padding:14px 40px;border-radius:100px;font-weight:600;font-size:16px;">Đặt lại mật khẩu</a>
            </div>
            <p style="color:#888;font-size:13px;margin:0 0 8px;">Hoặc copy link này:</p>
            <p style="color:#52b788;font-size:12px;word-break:break-all;margin:0 0 24px;">${resetLink}</p>
            <div style="background:#fff8e1;border-left:4px solid #f4c542;border-radius:8px;padding:14px 16px;">
              <p style="margin:0;color:#7a6000;font-size:13px;">⚠️ Link có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            </div>
          </div>
          <div style="background:#f9f9f7;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#bbb;font-size:12px;">© 2024 ORGO – Nền tảng thực phẩm hữu cơ</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email thông báo đơn hàng
 */
const sendOrderConfirmEmail = async (email, fullName, order) => {
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject: `🌿 ORGO – Xác nhận đơn hàng #${order.orderCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#2d6a4f,#52b788);padding:40px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">🌿 ORGO</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Đặt hàng thành công!</p>
          </div>
          <div style="padding:40px 32px;">
            <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">Chào ${fullName},</h2>
            <p style="color:#666;line-height:1.6;margin:0 0 24px;">Đơn hàng <strong>#${order.orderCode}</strong> của bạn đã được đặt thành công!</p>
            <div style="background:#f0faf4;border-radius:12px;padding:20px;margin:0 0 24px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#666;">Mã đơn:</span>
                <strong style="color:#2d6a4f;">#${order.orderCode}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#666;">Tổng tiền:</span>
                <strong>${order.total?.toLocaleString('vi-VN')}đ</strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#666;">Thanh toán:</span>
                <span>${order.paymentMethod}</span>
              </div>
            </div>
            <a href="${process.env.APP_URL}/user/orders/${order._id}" style="display:inline-block;background:linear-gradient(135deg,#2d6a4f,#52b788);color:#fff;text-decoration:none;padding:12px 32px;border-radius:100px;font-weight:600;">Xem đơn hàng</a>
          </div>
        </div>
      </body>
      </html>
    `
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendResetPasswordEmail, sendOrderConfirmEmail };
