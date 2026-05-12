# Messenger — Checklist kiểm tra production

Checklist kiểm tra thực tế cho Messenger order lookup MVP trên production.

**Yêu cầu trước khi test:**
- Production đã deploy code mới nhất (`main`)
- `MESSENGER_VERIFY_TOKEN` đã set trong `.env`
- `MESSENGER_PAGE_ACCESS_TOKEN` đã set trong `.env`
- Webhook đã đăng ký trên Meta Developer Console
- PM2 online

---

## 1. Webhook verification test

- [ ] Gửi verification request từ Meta Developer Console
- [ ] Server trả về `hub.challenge` thành công
- [ ] Meta hiển thị webhook đã xác nhận

**Test thủ công:**
```bash
curl -s "https://thue.eu.cc/api/messenger/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
# Mong đợi: test123
```

---

## 2. Welcome reply test

- [ ] Gửi tin nhắn bình thường (ví dụ: "xin chào") qua Messenger
- [ ] Bot trả lời đúng nội dung welcome:

> Chào mừng đến với Bắc Trung Hải Logistics.
>
> Vui lòng gửi mã đơn hàng để tra cứu trạng thái vận chuyển.
>
> Ví dụ:
> ORD-20260504-I9J0

---

## 3. Valid order code lookup

- [ ] Gửi mã đơn hàng thật (có trong database) qua Messenger
- [ ] Bot trả lời với thông tin:
  - 📦 Mã đơn hàng
  - 📌 Trạng thái (tiếng Việt)
  - ⚖️ Khối lượng (nếu có)
  - 💰 Tổng tiền (nếu > 0)
  - Lời cảm ơn cuối

---

## 4. Invalid order code

- [ ] Gửi mã đơn hàng không tồn tại (ví dụ: `ORD-99999999-XXXX`)
- [ ] Bot trả lời hướng dẫn tiếng Việt:

> Không tìm thấy đơn hàng với mã này.
>
> Vui lòng kiểm tra lại mã đơn hàng...

---

## 5. Random normal text

- [ ] Gửi text không phải mã đơn (ví dụ: "tôi cần hỗ trợ", "hello", "giá ship")
- [ ] Bot trả lời welcome message (không crash, không lỗi)

---

## 6. Vietnamese wording review

- [ ] Tất cả reply đều bằng tiếng Việt chuẩn
- [ ] Không có text tiếng Anh lẫn vào reply
- [ ] Trạng thái đơn hàng hiển thị đúng tiếng Việt:
  - Đang chờ xử lý / Đã đặt mua / Shop đã gửi hàng / ...
- [ ] Emoji hiển thị đúng: 📦 📌 ⚖️ 💰
- [ ] Dấu tiếng Việt hiển thị đúng (không bị lỗi encoding)

---

## 7. Mobile Messenger UI readability

- [ ] Mở Messenger trên điện thoại thật (iOS hoặc Android)
- [ ] Reply hiển thị đầy đủ, không bị cắt
- [ ] Line breaks đúng vị trí
- [ ] Emoji hiển thị đúng trên mobile
- [ ] Font size dễ đọc

---

## 8. Response speed

- [ ] Reply trả về trong < 3 giây (text thường)
- [ ] Reply trả về trong < 5 giây (order lookup — có query DB)
- [ ] Không timeout khi gửi liên tục 3-5 tin nhắn

---

## 9. Ensure only safe order fields are exposed

- [ ] Reply chỉ chứa: mã đơn hàng, trạng thái, khối lượng, tổng tiền
- [ ] Không hiển thị: tên khách, email, số điện thoại, địa chỉ, ghi chú nội bộ
- [ ] Không hiển thị thông tin thanh toán chi tiết
- [ ] Không hiển thị user ID hoặc internal ID

---

## 10. PM2 stability after webhook traffic

- [ ] Sau khi test xong, kiểm tra PM2 status:
```bash
pm2 status
# Mong đợi: online, không restart bất thường
```
- [ ] Kiểm tra PM2 logs không có error nghiêm trọng:
```bash
pm2 logs --lines 20
# Tìm: [messenger/webhook] logs bình thường, không có uncaught exception
```
- [ ] Memory usage ổn định (không tăng bất thường)
- [ ] Telegram bot và web tracking vẫn hoạt động bình thường

---

## Kết quả tổng hợp

| # | Test | Kết quả |
|---|------|---------|
| 1 | Webhook verification | ⬜ |
| 2 | Welcome reply | ⬜ |
| 3 | Valid order lookup | ⬜ |
| 4 | Invalid order code | ⬜ |
| 5 | Random normal text | ⬜ |
| 6 | Vietnamese wording | ⬜ |
| 7 | Mobile UI readability | ⬜ |
| 8 | Response speed | ⬜ |
| 9 | Safe fields only | ⬜ |
| 10 | PM2 stability | ⬜ |

**Tổng: __ / 10 PASS**
