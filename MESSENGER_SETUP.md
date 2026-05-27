# Facebook Messenger — Hướng dẫn kết nối Production

Hướng dẫn kết nối webhook Messenger với Meta Developer Platform cho production.

**Webhook URL:** `https://bactrunghai.vn/api/messenger/webhook`

---

## 1. Tạo Meta Developer App

1. Truy cập [Meta for Developers](https://developers.facebook.com/)
2. Chọn **My Apps** → **Create App**
3. Chọn loại **Business** → **Next**
4. Đặt tên app (ví dụ: "Bắc Trung Hải Logistics Bot")
5. Chọn Business Account (nếu có) → **Create App**

---

## 2. Thêm Messenger Product

1. Trong app dashboard, chọn **Add Product**
2. Tìm **Messenger** → **Set Up**
3. Messenger sẽ xuất hiện trong sidebar

---

## 3. Cấu hình Webhook

1. Trong Messenger Settings → **Webhooks** → **Add Callback URL**
2. Điền thông tin:
   - **Callback URL:** `https://bactrunghai.vn/api/messenger/webhook`
   - **Verify Token:** giá trị trùng với `MESSENGER_VERIFY_TOKEN` trong `.env` production
3. Nhấn **Verify and Save**
4. Meta sẽ gửi GET request với `hub.verify_token` — server trả về `hub.challenge` nếu token khớp

### Subscription Fields

Chọn các webhook events cần nhận:
- `messages` — tin nhắn từ người dùng
- `messaging_postbacks` — postback buttons

---

## 4. Environment Variables

Thêm vào `.env` production:

```env
MESSENGER_VERIFY_TOKEN=your_custom_verify_token_here
MESSENGER_PAGE_ACCESS_TOKEN=your_page_access_token_here
```

- `MESSENGER_VERIFY_TOKEN` — token tự đặt, phải trùng với giá trị nhập trong Meta webhook config
- `MESSENGER_PAGE_ACCESS_TOKEN` — token từ Meta, dùng để gửi reply (chưa sử dụng trong foundation)

---

## 5. Quyền cần thiết (Permissions)

| Quyền | Mục đích |
|-------|----------|
| `pages_messaging` | Gửi/nhận tin nhắn qua Page |
| `pages_manage_metadata` | Quản lý webhook subscriptions |

### Cách yêu cầu quyền:

1. Trong app dashboard → **App Review** → **Permissions and Features**
2. Request `pages_messaging` (bắt buộc cho production)
3. Cung cấp mô tả use case khi submit review

> **Lưu ý:** Ở chế độ Development, chỉ admin/tester của app mới gửi được tin nhắn. Cần App Review để mở cho public.

---

## 6. Generate Page Access Token

1. Trong Messenger Settings → **Access Tokens**
2. Chọn Facebook Page liên kết với bot
3. Nhấn **Generate Token**
4. Copy token → lưu vào `MESSENGER_PAGE_ACCESS_TOKEN` trong `.env`

> **Quan trọng:** Token này có thời hạn. Để có long-lived token, sử dụng [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) hoặc exchange flow.

---

## 7. Kiểm tra Webhook Verification

### Từ Meta Developer Console

1. Sau khi nhấn **Verify and Save** ở bước 3
2. Nếu thành công: webhook URL hiển thị ✓ đã xác nhận
3. Nếu thất bại: kiểm tra lỗi bên dưới

### Từ command line (test thủ công)

```bash
curl -s "https://bactrunghai.vn/api/messenger/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
# Kết quả mong đợi: test123
```

### Kiểm tra nhận tin nhắn (test payload)

```bash
curl -s -X POST https://bactrunghai.vn/api/messenger/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "123",
      "time": 1700000000,
      "messaging": [{
        "sender": {"id": "456"},
        "recipient": {"id": "123"},
        "timestamp": 1700000000,
        "message": {"mid": "m1", "text": "Xin chào"}
      }]
    }]
  }'
# Kết quả mong đợi: {"ok":true}
```

Kiểm tra PM2 logs để xác nhận event được ghi nhận:
```bash
pm2 logs --lines 10
# Tìm: [messenger/webhook] Text message from 456 at 1700000000: "Xin chào"
```

---

## 8. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| Webhook verification failed | `MESSENGER_VERIFY_TOKEN` không khớp | Kiểm tra giá trị trong `.env` trùng với Meta config |
| 403 Forbidden | Token rỗng hoặc sai | Đảm bảo `MESSENGER_VERIFY_TOKEN` đã set trong `.env` |
| 401 Unauthorized | Route chưa public | Kiểm tra `/api/messenger/webhook` có trong `publicPaths` (proxy.ts) |
| Timeout khi verify | Server chưa deploy code mới | PM2 restart sau khi pull latest main |
| Không nhận webhook events | Chưa subscribe fields | Chọn `messages` và `messaging_postbacks` trong webhook config |
| Tin nhắn không đến | App ở chế độ Development | Chỉ admin/tester gửi được; cần App Review cho public |

---

## 9. Bảo mật

- **Không bao giờ** commit `MESSENGER_PAGE_ACCESS_TOKEN` hoặc `MESSENGER_VERIFY_TOKEN` vào source code
- Lưu tokens trong `.env` production (file này nằm trong `.gitignore`)
- Không log token values — chỉ log event metadata (sender ID, timestamp)
- Webhook route chỉ log nội dung tin nhắn cho debugging — cân nhắc giảm log level ở production
- Cân nhắc thêm [X-Hub-Signature](https://developers.facebook.com/docs/messenger-platform/webhooks#validate-payloads) validation trong tương lai để xác thực payload từ Meta

---

## Tham khảo

- [Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform/)
- [Webhook Setup Guide](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Access Token Guide](https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start)
