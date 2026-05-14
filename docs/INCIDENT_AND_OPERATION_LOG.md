# Nhật Ký Sự Cố & Vận Hành — BẮC TRUNG HẢI LOGISTICS

**In bảng ghi sự cố ra giấy hoặc dùng file Excel tương ứng. Ghi lại MỌI sự cố để rút kinh nghiệm.**

**Website:** https://thue.eu.cc | **Hotline:** 0901 234 567

---

## Mục Lục

1. [Mức độ sự cố](#1-mức-độ-sự-cố)
2. [Ví dụ sự cố thường gặp](#2-ví-dụ-sự-cố-thường-gặp)
3. [Mẫu ghi nhận sự cố](#3-mẫu-ghi-nhận-sự-cố)
4. [Ghi chú vận hành hàng ngày](#4-ghi-chú-vận-hành-hàng-ngày)
5. [Rút kinh nghiệm (Lessons Learned)](#5-rút-kinh-nghiệm-lessons-learned)
6. [Hướng dẫn giao tiếp khi có sự cố](#6-hướng-dẫn-giao-tiếp-khi-có-sự-cố)

---

## 1. Mức Độ Sự Cố

| Mức độ | Ký hiệu | Mô tả | Thời gian xử lý | Ai cần biết |
|--------|---------|-------|-----------------|-------------|
| **Thấp** | 🟢 | Lỗi nhỏ, không ảnh hưởng khách hàng. Ví dụ: log cảnh báo, UI hiển thị lệch | Trong ngày | Nhân viên IT |
| **Trung bình** | 🟡 | Ảnh hưởng 1 phần chức năng. Ví dụ: 1 kênh chatbot lỗi, thông báo chậm | Trong 4 giờ | Admin + IT |
| **Cao** | 🟠 | Ảnh hưởng nhiều khách hàng. Ví dụ: không tạo được đơn, scan lỗi toàn bộ | Trong 1 giờ | Admin + IT + Quản lý |
| **Khẩn cấp** | 🔴 | Hệ thống ngừng hoạt động hoặc mất dữ liệu. Ví dụ: website down, DB mất kết nối | Ngay lập tức | Tất cả + Quản lý cấp cao |

### Quy tắc phân loại

- **Không chắc mức nào?** → Chọn mức **cao hơn** để an toàn
- Sự cố ảnh hưởng **tiền / dữ liệu** → luôn là **Cao** hoặc **Khẩn cấp**
- Sự cố ảnh hưởng **khách VIP** → tự động tăng 1 mức

---

## 2. Ví Dụ Sự Cố Thường Gặp

### 2.1 Sự cố hệ thống

| Sự cố | Mức độ | Dấu hiệu | Xử lý nhanh |
|-------|--------|----------|-------------|
| Website down | 🔴 Khẩn cấp | Không truy cập được thue.eu.cc | `pm2 restart logistics-system` → xem BACKUP_AND_RECOVERY.md |
| Chatbot không trả lời | 🟡 Trung bình | Gửi tin nhắn test không có phản hồi | Kiểm tra `pm2 status` → restart app |
| Zalo notification fail | 🟡 Trung bình | Khách không nhận thông báo Zalo | Kiểm tra ZALO_OA_ACCESS_TOKEN trong .env |
| Telegram bot lỗi | 🟡 Trung bình | Bot không reply | Kiểm tra TELEGRAM_BOT_TOKEN → restart |
| Database unreachable | 🔴 Khẩn cấp | App báo lỗi kết nối DB | `docker start logistics-postgres` → đợi 10s → restart app |
| Đơn bị kẹt trạng thái | 🟠 Cao | Đơn không chuyển được sang trạng thái kế tiếp | Kiểm tra audit log → xử lý thủ công qua Admin |
| App crash liên tục | 🔴 Khẩn cấp | PM2 hiện "errored", restart lại vẫn lỗi | Xem log: `pm2 logs --err --lines 100` → liên hệ IT |

### 2.2 Sự cố vận hành / logistics

| Sự cố | Mức độ | Dấu hiệu | Xử lý nhanh |
|-------|--------|----------|-------------|
| Khách nhận thiếu hàng | 🟠 Cao | Khách khiếu nại số lượng không đủ | Kiểm tra kiện + đối chiếu đơn → bồi thường nếu xác nhận thiếu |
| Sai cân nặng | 🟡 Trung bình | Phí tính không đúng với thực tế | Sửa cân nặng trong chi tiết kiện → tính lại phí |
| Scan nhầm kiện | 🟡 Trung bình | Kiện gắn sai đơn hàng | Gỡ kiện khỏi đơn sai → gắn lại đúng đơn |
| Hàng bị hư hỏng | 🟠 Cao | Kiện bị vỡ / ướt / biến dạng | Chụp ảnh → ghi chú → báo Admin → xử lý khiếu nại với kho TQ |
| Giao hàng thất bại | 🟡 Trung bình | Shipper không giao được | Ghi lý do → liên hệ khách hẹn lại → giao lần 2 |
| Mất kiện hàng | 🔴 Khẩn cấp | Kiện không tìm thấy trong kho | Kiểm tra scan log → truy xuất audit → báo quản lý |

### 2.3 Sự cố khách hàng

| Sự cố | Mức độ | Dấu hiệu | Xử lý nhanh |
|-------|--------|----------|-------------|
| Khách khiếu nại | 🟡–🟠 | Khách gọi/nhắn phàn nàn | Ghi nhận → xác minh → phản hồi trong 2 giờ |
| Khách gửi sai link | 🟢 Thấp | Link không mở được hoặc sai sản phẩm | Ghi status note → nhắn khách gửi lại |
| Khách nạp tiền nhưng chưa cộng ví | 🟠 Cao | Khách báo đã chuyển khoản nhưng ví chưa tăng | Kiểm tra sổ ngân hàng → cộng ví thủ công → xác nhận |
| Khách muốn huỷ đơn đã mua | 🟡 Trung bình | Khách yêu cầu huỷ sau khi đặt | Kiểm tra trạng thái → nếu chưa mua thì huỷ → nếu đã mua thì thông báo |

---

## 3. Mẫu Ghi Nhận Sự Cố

### Bảng ghi sự cố (in ra giấy hoặc dùng Excel)

| # | Thời gian | Người phát hiện | Mức độ | Mô tả sự cố | Ảnh hưởng | Cách xử lý | Kết quả | Người chịu TN | Ghi chú |
|---|----------|----------------|--------|-------------|----------|-----------|---------|--------------|---------|
| 1 | ___/___/___ ___:___ | __________ | 🟢🟡🟠🔴 | | | | ☐ Xong ☐ Chưa | __________ | |
| 2 | ___/___/___ ___:___ | __________ | 🟢🟡🟠🔴 | | | | ☐ Xong ☐ Chưa | __________ | |
| 3 | ___/___/___ ___:___ | __________ | 🟢🟡🟠🔴 | | | | ☐ Xong ☐ Chưa | __________ | |
| 4 | ___/___/___ ___:___ | __________ | 🟢🟡🟠🔴 | | | | ☐ Xong ☐ Chưa | __________ | |
| 5 | ___/___/___ ___:___ | __________ | 🟢🟡🟠🔴 | | | | ☐ Xong ☐ Chưa | __________ | |

### Ví dụ ghi sự cố thực tế

| # | Thời gian | Người phát hiện | Mức độ | Mô tả sự cố | Ảnh hưởng | Cách xử lý | Kết quả | Người chịu TN | Ghi chú |
|---|----------|----------------|--------|-------------|----------|-----------|---------|--------------|---------|
| 1 | 14/05/2026 08:30 | Hùng (Admin) | 🔴 | Website không truy cập được | Tất cả khách + nhân viên | Restart PM2 + kiểm tra DB | Xong — hoạt động lại lúc 08:45 | Hùng | DB container bị stop sau khi server restart đêm qua |
| 2 | 14/05/2026 10:15 | Lan (Kho VN) | 🟡 | Scan barcode kiện KN-2026051401 nhận sai đơn | 1 đơn hàng bị gắn nhầm kiện | Gỡ kiện khỏi đơn sai, gắn lại đúng | Xong | Lan | Barcode bị mờ, nhập tay sai 1 số |
| 3 | 14/05/2026 14:00 | Mai (CSKH) | 🟠 | Khách Nguyễn Văn A khiếu nại nhận thiếu 1 món | 1 khách hàng | Đối chiếu kiện + ảnh kho → xác nhận thiếu → gửi bù | Đang xử lý | Mai + Admin | Kho TQ đóng kiện thiếu, đã báo kho TQ |

### Mẫu chi tiết cho sự cố nghiêm trọng

Dùng mẫu này cho sự cố mức **Cao** hoặc **Khẩn cấp**:

```
═══════════════════════════════════════════════
BÁO CÁO SỰ CỐ #___

Ngày:           ___/___/___
Giờ phát hiện:  ___:___
Giờ khắc phục:  ___:___
Thời gian gián đoạn: ___ phút

Người phát hiện: _______________
Mức độ:         ☐ Cao  ☐ Khẩn cấp

MÔ TẢ SỰ CỐ:
_________________________________________________
_________________________________________________

ẢNH HƯỞNG:
- Số khách bị ảnh hưởng: ___
- Chức năng bị ảnh hưởng: _______________
- Thiệt hại ước tính: _______________

CÁC BƯỚC ĐÃ XỬ LÝ:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

KẾT QUẢ:
☐ Đã khắc phục hoàn toàn
☐ Đã khắc phục tạm thời — cần theo dõi thêm
☐ Chưa khắc phục — đang xử lý tiếp

NGƯỜI CHỊU TRÁCH NHIỆM: _______________
NGƯỜI PHÊ DUYỆT:        _______________
═══════════════════════════════════════════════
```

---

## 4. Ghi Chú Vận Hành Hàng Ngày

### Bảng ghi chú hàng ngày

| Ngày | Hạng mục | Chi tiết | Trạng thái | Ghi chú |
|------|---------|---------|-----------|---------|
| ___/___/___ | Hàng tồn kho VN | ___ kiện chờ giao | ☐ Đã xử lý | |
| ___/___/___ | Đơn chậm | ___ đơn PENDING > 3 ngày | ☐ Đã xử lý | |
| ___/___/___ | Lỗi phát sinh | | ☐ Đã xử lý | |
| ___/___/___ | Khách VIP lưu ý | | ☐ Đã xử lý | |
| ___/___/___ | Chatbot chưa trả lời | ___ câu hỏi mới | ☐ Đã xử lý | |
| ___/___/___ | Khác | | ☐ Đã xử lý | |

### 4.1 Hàng tồn cần theo dõi

- [ ] Đơn **"Về kho VN"** > 3 ngày chưa giao — ghi mã đơn: _______________
- [ ] Đơn **"Về kho TQ"** > 5 ngày chưa chuyển về — ghi mã đơn: _______________
- [ ] Kiện không rõ khách — ghi mã kiện: _______________
- [ ] Hàng hư hỏng chờ xử lý — ghi mã kiện: _______________

### 4.2 Đơn chậm cần escalate

- [ ] Đơn PENDING > 5 ngày: _______________
- [ ] Đơn "Đang vận chuyển" > 10 ngày: _______________
- [ ] Đơn "Đang giao" > 2 ngày: _______________
- [ ] Lý do chậm: ☐ Supplier TQ ☐ Tắc biên ☐ Ngày lễ ☐ Khác: _______________

### 4.3 Lỗi phát sinh trong ngày

- [ ] Lỗi 1: _______________________________________________
- [ ] Lỗi 2: _______________________________________________
- [ ] Lỗi 3: _______________________________________________

### 4.4 Khách VIP / Đặc biệt cần lưu ý

- [ ] Khách: _______________ — Lý do: _______________
- [ ] Khách: _______________ — Lý do: _______________
- [ ] Khách: _______________ — Lý do: _______________

---

## 5. Rút Kinh Nghiệm (Lessons Learned)

### Bảng rút kinh nghiệm

Ghi lại sau mỗi sự cố mức **Trung bình** trở lên:

| # | Sự cố | Nguyên nhân gốc | Cách tránh lặp lại | Người đề xuất | Đã áp dụng? |
|---|-------|----------------|-------------------|--------------|-------------|
| 1 | | | | | ☐ |
| 2 | | | | | ☐ |
| 3 | | | | | ☐ |

### Ví dụ rút kinh nghiệm

| # | Sự cố | Nguyên nhân gốc | Cách tránh lặp lại | Người đề xuất | Đã áp dụng? |
|---|-------|----------------|-------------------|--------------|-------------|
| 1 | DB mất kết nối mỗi khi server restart | Docker container không có flag `--restart=always` | Thêm `--restart=always` khi tạo container | Hùng | ✓ |
| 2 | Scan nhầm kiện do barcode mờ | Nhãn in chất lượng thấp, dùng lâu bị phai | Dùng nhãn chống nước + kiểm tra nhãn trước khi dán | Lan | ✓ |
| 3 | Khách khiếu nại không nhận thông báo | Token Zalo OA hết hạn, không ai kiểm tra | Thêm vào checklist sáng: test gửi tin Zalo | Mai | ✓ |
| 4 | Mất dữ liệu 1 ngày do không backup | Chưa cài backup tự động | Cài script backup-daily.sh chạy bằng Task Scheduler | Hùng | ✓ |

### Quy trình rút kinh nghiệm

1. **Khi nào:** Sau mỗi sự cố mức Trung bình trở lên, trong vòng 24 giờ
2. **Ai tham gia:** Người phát hiện + người xử lý + Admin
3. **Hỏi 3 câu:**
   - Tại sao sự cố xảy ra? (nguyên nhân gốc, không đổ lỗi)
   - Làm gì để không lặp lại?
   - Ai chịu trách nhiệm thực hiện biện pháp phòng ngừa?
4. **Ghi lại** vào bảng trên
5. **Theo dõi** biện pháp đã áp dụng chưa (mỗi tuần kiểm tra 1 lần)

---

## 6. Hướng Dẫn Giao Tiếp Khi Có Sự Cố

### 6.1 Báo Admin / Quản lý

**Khi nào phải báo ngay:**
- [ ] Sự cố mức **Cao** hoặc **Khẩn cấp**
- [ ] Liên quan đến tiền / dữ liệu khách hàng
- [ ] Ảnh hưởng > 5 khách hàng
- [ ] Không tự xử lý được sau 15 phút

**Cách báo:**

```
Tin nhắn mẫu (gửi qua Zalo nội bộ / điện thoại):

"[SỰ CỐ] [Mức độ: ___]
Thời gian: ___:___
Vấn đề: _______________
Ảnh hưởng: _______________
Đã làm: _______________
Cần hỗ trợ: ☐ Có ☐ Không"
```

**Ví dụ:**

```
"[SỰ CỐ] [Mức độ: Khẩn cấp]
Thời gian: 08:30
Vấn đề: Website không truy cập được
Ảnh hưởng: Tất cả khách hàng + nhân viên
Đã làm: Kiểm tra PM2 — app hiện 'stopped'
Cần hỗ trợ: Có — không biết lý do app tắt"
```

### 6.2 Thông báo khách hàng

**Nguyên tắc:**
- Phản hồi khách **trong 2 giờ** kể từ khi nhận khiếu nại
- Nói **thật** — không hứa điều không chắc chắn
- Nói **ngắn gọn** — khách không cần biết chi tiết kỹ thuật
- Nói **giải pháp** — không chỉ nói vấn đề

**Mẫu tin nhắn theo tình huống:**

**Hệ thống đang bảo trì:**
```
"Xin chào anh/chị, hệ thống đang được bảo trì nâng cấp.
Dự kiến hoạt động lại trong vòng [X] phút.
Xin lỗi về sự bất tiện. Em sẽ thông báo ngay khi xong ạ."
```

**Đơn bị chậm:**
```
"Dạ anh/chị, đơn hàng [mã đơn] hiện đang [trạng thái].
Lý do chậm: [tắc biên / supplier chậm gửi / ngày lễ].
Dự kiến cập nhật: [ngày].
Em sẽ theo dõi và báo anh/chị ngay khi có tin mới ạ."
```

**Khách nhận thiếu hàng:**
```
"Dạ anh/chị, em đã ghi nhận phản ánh thiếu hàng đơn [mã đơn].
Em đang kiểm tra lại với kho.
Em sẽ phản hồi kết quả trong vòng [X] giờ ạ.
Xin lỗi anh/chị về sự bất tiện."
```

**Sai cân nặng / phí:**
```
"Dạ anh/chị, em đã kiểm tra lại cân nặng đơn [mã đơn].
[Cân nặng đúng là X kg / Phí đã được điều chỉnh].
Số tiền chênh lệch [X]đ đã được hoàn vào ví ạ.
Xin lỗi về sự nhầm lẫn."
```

### 6.3 Cập nhật tiến độ xử lý sự cố

**Quy tắc cập nhật:**

| Mức độ | Tần suất cập nhật | Cho ai |
|--------|-------------------|--------|
| 🟢 Thấp | Khi xong | Nội bộ |
| 🟡 Trung bình | Mỗi 2 giờ | Admin + khách liên quan |
| 🟠 Cao | Mỗi 30 phút | Admin + Quản lý + khách |
| 🔴 Khẩn cấp | Mỗi 15 phút | Tất cả |

**Checklist cập nhật:**

- [ ] Đã báo Admin / Quản lý
- [ ] Đã phản hồi khách hàng (nếu khách bị ảnh hưởng)
- [ ] Đã ghi vào bảng sự cố
- [ ] Đã cập nhật status note trên đơn hàng (nếu liên quan đến đơn)
- [ ] Khi xong → thông báo kết quả cho tất cả bên liên quan

---

## Tham Khảo Nhanh

| Tài liệu | Khi nào dùng |
|----------|-------------|
| [USER_MANUAL.md](./USER_MANUAL.md) | Hướng dẫn sử dụng chi tiết từng chức năng |
| [BACKUP_AND_RECOVERY.md](./BACKUP_AND_RECOVERY.md) | Sao lưu / khôi phục database và hệ thống |
| [DAILY_OPERATIONS_CHECKLIST.md](./DAILY_OPERATIONS_CHECKLIST.md) | Checklist vận hành hàng ngày |

---

**Bắc Trung Hải Logistics** — Nhật ký sự cố & vận hành

Hotline: 0901 234 567 | Email: support@bactrunghai.vn | Web: https://thue.eu.cc
