# Checklist Vận Hành Hàng Ngày — BẮC TRUNG HẢI LOGISTICS

**In ra giấy hoặc dán lên bàn làm việc. Đánh dấu ✓ mỗi mục đã kiểm tra.**

**Website:** https://bactrunghai.vn | **Hotline:** 0901 234 567

---

## 1. Checklist Buổi Sáng (Mở Ca)

> **Ai làm:** Admin / Trưởng ca
> **Khi nào:** Đầu ngày, trước 9:00

### Hệ thống

- [ ] Truy cập https://bactrunghai.vn — trang mở bình thường
- [ ] Đăng nhập tài khoản Admin — vào được dashboard
- [ ] Kiểm tra `pm2 status` — app hiện **online** (nếu có quyền server)

### Đơn hàng

- [ ] Xem dashboard Admin — có đơn mới qua đêm không
- [ ] Kiểm tra chip **"Chờ mua"** — bao nhiêu đơn chưa đặt hàng
- [ ] Kiểm tra chip **"Đang chờ lâu"** — có đơn PENDING > 3 ngày không
- [ ] Kiểm tra chip **"Khẩn cấp"** — có đơn ưu tiên đỏ cần xử lý ngay không

### Hàng tồn

- [ ] Kiểm tra đơn trạng thái **"Về kho VN"** — hàng chờ giao cho khách
- [ ] Kiểm tra đơn trạng thái **"Về kho TQ"** — hàng chờ đóng kiện chuyển về

### Chatbot

- [ ] Gửi tin nhắn test vào Zalo OA → bot có trả lời không
- [ ] Gửi tin nhắn test vào Telegram bot → bot có trả lời không
- [ ] Xem **Câu hỏi chưa trả lời** — có câu mới qua đêm không

### Thông báo

- [ ] Kiểm tra **Trạng thái kênh thông báo** trong Cài đặt
  - Telegram: Bật
  - Zalo OA: Bật
  - Messenger: Bật

---

## 2. Checklist Kho Trung Quốc

> **Ai làm:** Nhân viên kho TQ
> **Khi nào:** Khi có hàng mới đến kho

### Nhận hàng

- [ ] Scan barcode / nhập mã kiện cho từng hàng mới đến
- [ ] Nhập cân nặng (kg) chính xác cho mỗi kiện
- [ ] Kiểm tra cân nặng đã nhập đúng chưa trước khi lưu

### Tạo kiện

- [ ] Gom đơn hàng vào kiện theo lô chuyển về VN
- [ ] Nhập cân nặng tổng kiện
- [ ] In nhãn barcode cho kiện mới

### Kiểm tra lỗi

- [ ] Có kiện nào **thiếu barcode** không → dán barcode bổ sung
- [ ] Có kiện nào **không match đơn hàng** không → báo Admin
- [ ] Có hàng nào **bị hư hỏng** không → chụp ảnh + ghi chú + báo Admin
- [ ] Có hàng nào **chờ quá lâu** (> 3 ngày) chưa đóng kiện không → xử lý hoặc báo Admin

### Cuối ca kho TQ

- [ ] Tất cả hàng mới đã scan xong
- [ ] Cân nặng đã nhập đủ
- [ ] Kiện mới đã tạo và dán nhãn
- [ ] Báo Admin số kiện chuyển về VN trong ngày

---

## 3. Checklist Kho Việt Nam

> **Ai làm:** Nhân viên kho VN
> **Khi nào:** Khi hàng về kho VN + khi giao hàng

### Nhận hàng về kho

- [ ] Scan barcode kiện nhận từ TQ
- [ ] Kiểm tra số kiện nhận đúng với manifest không
- [ ] Có kiện nào **không có trong hệ thống** không → liên hệ kho TQ
- [ ] Có kiện nào **bị hư hỏng khi vận chuyển** không → chụp ảnh + báo Admin

### Giao hàng (Dispatch)

- [ ] Chọn kiện cần giao trong ngày
- [ ] Bấm **Xuất kho** → trạng thái chuyển sang "Đang giao"
- [ ] Xác nhận địa chỉ giao với khách (nếu cần)
- [ ] Liên hệ khách trước khi giao (điện thoại / Zalo)

### Hoàn tất giao hàng

- [ ] Khách đã nhận hàng → bấm **Hoàn thành**
- [ ] Giao thất bại → ghi chú lý do + hẹn giao lại
- [ ] Kiểm tra cuối ngày: còn đơn nào **"Đang giao"** chưa hoàn thành không

### Hàng tồn kho

- [ ] Kiểm tra đơn **"Về kho VN"** > 3 ngày chưa giao → liên hệ khách / Admin
- [ ] Có kiện nào **không rõ khách** không → để riêng + báo Admin
- [ ] Có kiện nào **không có mã đơn** không → liên hệ Admin kiểm tra

---

## 4. Checklist Kế Toán

> **Ai làm:** Kế toán
> **Khi nào:** Mỗi sáng + cuối ngày

### Buổi sáng

- [ ] Xem dashboard kế toán — doanh thu, lợi nhuận, công nợ
- [ ] Kiểm tra **tiền nạp mới** — đối chiếu với sổ chuyển khoản ngân hàng
- [ ] Nạp tiền đã khớp → xác nhận với Admin để cộng ví cho khách
- [ ] Có khoản nạp **chưa rõ nội dung** → liên hệ khách xác nhận

### Công nợ

- [ ] Xem danh sách khách có **công nợ cao** → nhắc nạp tiền
- [ ] Khách công nợ > hạn mức → báo Admin tạm ngưng dịch vụ
- [ ] Kiểm tra đơn **Hoàn thành** hôm nay đã trừ tiền đúng chưa

### Giao dịch bất thường

- [ ] Có giao dịch **hoàn tiền** nào không hợp lý không
- [ ] Có đơn **Đã huỷ** chưa hoàn tiền cho khách không
- [ ] Số dư ví khách có **âm** bất thường không

### Cuối ngày

- [ ] Tổng kết doanh thu trong ngày
- [ ] Ghi nhận đơn chờ thanh toán
- [ ] Lưu số liệu đối soát (nếu cần)

---

## 5. Checklist Hỗ Trợ Khách Hàng

> **Ai làm:** Nhân viên CSKH / Admin
> **Khi nào:** Liên tục trong ngày + cuối ngày

### Chatbot & Tri thức

- [ ] Xem **Câu hỏi chưa trả lời** — có câu mới không
- [ ] Dùng chip **"Hỏi nhiều nhất"** — xử lý câu lặp lại nhiều trước
- [ ] Dùng chip **"Chưa có tri thức"** — câu chưa ai xử lý
- [ ] Với câu hỏi phổ biến → bấm **"+ Tạo tri thức"** để thêm câu trả lời
- [ ] Xem **Hiệu quả chatbot** — tổng câu hỏi / chưa xử lý / đã xử lý

### Khách VIP / Đơn lớn

- [ ] Kiểm tra đơn có tag **"Khẩn cấp"** → xử lý ưu tiên
- [ ] Kiểm tra đơn có tag **"Ưu tiên"** → cập nhật trạng thái sớm
- [ ] Khách VIP có đơn chờ lâu → liên hệ chủ động

### Đơn bị chậm

- [ ] Bấm chip **"Đang chờ lâu"** → xem đơn PENDING > 3 ngày
- [ ] Đơn chậm do supplier TQ → liên hệ supplier hỏi tiến độ
- [ ] Đơn chậm do tắc biên / ngày lễ → ghi status note cho khách biết
- [ ] Đơn chậm không rõ lý do → báo Admin kiểm tra

### Khách chưa phản hồi

- [ ] Đơn cần xác nhận địa chỉ nhưng khách chưa trả lời → nhắn lại
- [ ] Khách gửi link sai nhưng chưa gửi lại → nhắc lần 2
- [ ] Đơn chờ thanh toán > 3 ngày → nhắc khách nạp tiền

---

## 6. Checklist Cuối Ngày (Đóng Ca)

> **Ai làm:** Admin / Trưởng ca
> **Khi nào:** Cuối ngày, trước khi nghỉ

### Backup

- [ ] Backup database đã chạy hôm nay chưa (kiểm tra file trong `backups/`)
- [ ] File backup có dung lượng hợp lý (> 100KB)
- [ ] Nếu chưa backup → chạy: `docker exec logistics-postgres pg_dump -U postgres logistics_db > backups/backup_$(date +%Y%m%d).sql`

### Đơn hàng tồn đọng

- [ ] Còn bao nhiêu đơn **"Chờ mua"** — ghi lại số lượng
- [ ] Còn bao nhiêu đơn **"Đang vận chuyển"** — theo dõi hôm sau
- [ ] Có đơn nào **"Đang giao"** chưa hoàn thành → liên hệ shipper

### Hàng tắc / treo

- [ ] Đơn PENDING > 5 ngày → escalate lên quản lý
- [ ] Hàng "Về kho VN" > 5 ngày chưa giao → tìm hiểu lý do
- [ ] Hàng "Về kho TQ" > 7 ngày chưa chuyển về → liên hệ kho TQ

### Chatbot

- [ ] Xem lại **Câu hỏi chưa trả lời** — ghi nhận số câu chưa xử lý
- [ ] Nếu có câu hỏi lặp lại nhiều → tạo tri thức mới trước khi nghỉ

### Ghi chú bàn giao

- [ ] Ghi lại vấn đề cần xử lý ngày mai
- [ ] Ghi lại đơn cần theo dõi đặc biệt
- [ ] Bàn giao cho ca sau (nếu có)

---

## 7. Xử Lý Khẩn Cấp (Emergency Quick Actions)

> **Khi gặp sự cố — làm ngay, không chờ.**

### 7.1 Website không truy cập được

```
1. Kiểm tra internet của bạn trước (thử mở Google)
2. Nếu internet OK → kiểm tra PM2:     pm2 status
3. App stopped → restart:               pm2 restart logistics-system
4. Vẫn lỗi → kiểm tra database:        docker ps | grep postgres
5. DB stopped:                          docker start logistics-postgres
                                        → đợi 10 giây
                                        → pm2 restart logistics-system
6. Vẫn không được → xem log:            pm2 logs logistics-system --err --lines 50
7. Liên hệ kỹ thuật viên ngay
```

### 7.2 Chatbot không trả lời

```
1. Gửi tin nhắn test vào Zalo OA / Telegram / Messenger
2. Nếu không kênh nào trả lời → app có thể đang lỗi
3. Kiểm tra PM2:                        pm2 status
4. Restart nếu cần:                     pm2 restart logistics-system
5. Kiểm tra log:                        pm2 logs logistics-system --err --lines 20
6. Nếu chỉ 1 kênh lỗi → kiểm tra webhook/API key của kênh đó
7. Liên hệ kỹ thuật viên nếu không tự khắc phục được
```

### 7.3 Database không kết nối

```
1. Kiểm tra Docker:                     docker ps
2. Container stopped:                   docker start logistics-postgres
3. Đợi 10 giây
4. Kiểm tra kết nối:                    docker exec logistics-postgres pg_isready -U postgres
5. Nếu OK → restart app:               pm2 restart logistics-system
6. Nếu container bị xóa:               → xem docs/BACKUP_AND_RECOVERY.md mục 5
7. Liên hệ kỹ thuật viên ngay
```

### 7.4 Thông báo không gửi được

```
1. Kiểm tra Cài đặt → Trạng thái kênh thông báo
2. Kênh nào hiện "Tắt" → kiểm tra API key / webhook URL
3. Telegram lỗi → kiểm tra TELEGRAM_BOT_TOKEN trong .env
4. Zalo OA lỗi → kiểm tra ZALO_OA_ACCESS_TOKEN trong .env
5. Messenger lỗi → kiểm tra MESSENGER_PAGE_ACCESS_TOKEN trong .env
6. Sau khi sửa .env → restart:         pm2 restart logistics-system
7. Test lại: gửi tin nhắn vào kênh đó
```

### 7.5 Bảng tóm tắt xử lý nhanh

| Sự cố | Bước đầu tiên | Bước tiếp theo |
|-------|--------------|---------------|
| Website down | `pm2 status` | `pm2 restart logistics-system` |
| Chatbot im lặng | Test gửi tin | `pm2 restart logistics-system` |
| DB lỗi | `docker ps` | `docker start logistics-postgres` |
| Thông báo lỗi | Kiểm tra Cài đặt | Kiểm tra .env → restart |
| App crash liên tục | `pm2 logs --err` | Liên hệ kỹ thuật viên |
| Mất dữ liệu | **DỪNG MỌI THỨ** | Restore từ backup (xem BACKUP_AND_RECOVERY.md) |

---

## Ghi Chú Vận Hành

| Ngày | Ca | Người trực | Vấn đề / Ghi chú | Đã xử lý? |
|------|-----|-----------|-------------------|-----------|
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |
| ___/___/___ | Sáng / Chiều | ___________ | | ☐ |

> **💡 Mẹo:** In trang này ra giấy A4. Mỗi ngày dùng 1 tờ. Lưu lại để đối chiếu khi cần.

---

**Bắc Trung Hải Logistics** — Checklist vận hành hàng ngày

Hotline: 0901 234 567 | Email: support@bactrunghai.vn | Web: https://bactrunghai.vn
