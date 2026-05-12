# Telegram Bot — Checklist kiểm tra trên thiết bị thật

**Bot:** [@bactrunghai_bot](https://t.me/bactrunghai_bot)
**Production:** https://thue.eu.cc
**Webhook:** `POST /api/telegram/webhook`

---

## 1. Lệnh /start

- [ ] Gửi `/start` → nhận tin nhắn chào mừng tiếng Việt
- [ ] Hiển thị danh sách lệnh hỗ trợ (`/help`, `/status`)
- [ ] Có ví dụ mã đơn hàng (`BTH123456`)
- [ ] Gửi `/start@bactrunghai_bot` → cùng kết quả

## 2. Lệnh /help

- [ ] Gửi `/help` → nhận hướng dẫn sử dụng tiếng Việt
- [ ] Liệt kê đầy đủ lệnh hỗ trợ
- [ ] Gửi `/help@bactrunghai_bot` → cùng kết quả

## 3. Lệnh /status

- [ ] Gửi `/status` → nhận hướng dẫn tra cứu trạng thái
- [ ] Có ví dụ mã đơn hàng
- [ ] Gửi `/status@bactrunghai_bot` → cùng kết quả

## 4. Tra cứu mã đơn hàng hợp lệ

- [ ] Gửi mã đơn có trong hệ thống → nhận thông tin đơn hàng
- [ ] Hiển thị: mã đơn, trạng thái, khối lượng (nếu có), tổng tiền (nếu > 0)
- [ ] Có dòng "Cảm ơn quý khách đã sử dụng Bắc Trung Hải Logistics"
- [ ] Định dạng dễ đọc trên điện thoại

## 5. Mã đơn hàng không tồn tại

- [ ] Gửi mã đơn không có trong DB (ví dụ: `BTH999999`) → nhận hướng dẫn
- [ ] Có ví dụ mã đơn đúng định dạng
- [ ] Có gợi ý liên hệ Bắc Trung Hải Logistics

## 6. Lệnh không hỗ trợ

- [ ] Gửi `/abc` hoặc `/test` → nhận thông báo "Bot chưa hỗ trợ lệnh này"
- [ ] Liệt kê lệnh hỗ trợ: `/start`, `/help`, `/status`
- [ ] Gợi ý gửi mã đơn hàng trực tiếp

## 7. Văn bản không hợp lệ

- [ ] Gửi `hello` hoặc `xin chào` → nhận hướng dẫn gửi đúng mã đơn
- [ ] Có ví dụ mã đơn (`BTH123456`)
- [ ] Gợi ý dùng `/help`

## 8. Giao diện Telegram trên điện thoại

- [ ] Tin nhắn không bị cắt hoặc tràn
- [ ] Emoji hiển thị đúng (📦, 📌, ⚖️, 💰, 👋, 📚)
- [ ] Code format (`BTH123456`) hiển thị đúng dạng monospace
- [ ] Bold text hiển thị đúng

## 9. Kiểm tra tiếng Việt

- [ ] Tất cả tin nhắn bot trả về bằng tiếng Việt
- [ ] Không có từ tiếng Anh lẫn vào nội dung chính
- [ ] Dấu tiếng Việt hiển thị đúng
- [ ] Văn phong tự nhiên, chuyên nghiệp

## 10. Tốc độ phản hồi

- [ ] `/start` phản hồi < 3 giây
- [ ] `/help` phản hồi < 3 giây
- [ ] Tra cứu đơn hàng phản hồi < 5 giây
- [ ] Không có lỗi timeout
