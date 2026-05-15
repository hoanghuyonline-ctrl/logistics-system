# Hướng Dẫn Quản Trị Hệ Thống Logistics — Dành Cho Admin, Kế Toán & Kho

> **Phiên bản:** 1.0 — Tháng 5/2026
> **Hệ thống:** Bắc Trung Hải Logistics CRM
> **Ngôn ngữ:** Tiếng Việt (mặc định) · English · 中文

---

## Mục Lục

1. [Tổng quan vai trò](#1-tổng-quan-vai-trò)
2. [Admin Dashboard](#2-admin-dashboard)
3. [Quản lý người dùng](#3-quản-lý-người-dùng)
4. [Quản lý đơn hàng](#4-quản-lý-đơn-hàng)
5. [Quản lý kiện hàng](#5-quản-lý-kiện-hàng)
6. [Quy trình kho Trung Quốc](#6-quy-trình-kho-trung-quốc)
7. [Quy trình kho Việt Nam](#7-quy-trình-kho-việt-nam)
8. [Quét mã barcode](#8-quét-mã-barcode)
9. [Kế toán & Tài chính](#9-kế-toán--tài-chính)
10. [Thông báo & Kênh liên lạc](#10-thông-báo--kênh-liên-lạc)
11. [CRM — Quản lý khách hàng tiềm năng](#11-crm--quản-lý-khách-hàng-tiềm-năng)
12. [Quy trình Follow-up](#12-quy-trình-follow-up)
13. [Chiến dịch Marketing](#13-chiến-dịch-marketing)
14. [Quản lý khiếu nại & Hỗ trợ](#14-quản-lý-khiếu-nại--hỗ-trợ)
15. [Knowledge Base hỗ trợ (Chatbot)](#15-knowledge-base-hỗ-trợ-chatbot)
16. [Phân tích & Báo cáo](#16-phân-tích--báo-cáo)
17. [Cấu hình hệ thống](#17-cấu-hình-hệ-thống)
18. [Nhật ký hoạt động (Audit Log)](#18-nhật-ký-hoạt-động-audit-log)
19. [Sức khỏe hệ thống](#19-sức-khỏe-hệ-thống)
20. [Ghi chú nội bộ (Staff Notes)](#20-ghi-chú-nội-bộ-staff-notes)
21. [Đơn bị kẹt (Stuck Shipments)](#21-đơn-bị-kẹt-stuck-shipments)
22. [Sản xuất & Triển khai](#22-sản-xuất--triển-khai)
23. [Sao lưu & Khôi phục](#23-sao-lưu--khôi-phục)
24. [Các lỗi thường gặp & Cách xử lý](#24-các-lỗi-thường-gặp--cách-xử-lý)
25. [Ví dụ vận hành thực tế](#25-ví-dụ-vận-hành-thực-tế)

---

## 1. Tổng quan vai trò

Hệ thống có **5 vai trò** (Role), mỗi vai trò có quyền truy cập khác nhau:

| Vai trò | Mã hệ thống | Quyền chính |
|---------|-------------|-------------|
| **Khách hàng** | `CUSTOMER` | Đặt đơn, xem ví, nạp tiền, gửi khiếu nại |
| **Quản trị viên** | `ADMIN` | Toàn quyền: quản lý user, đơn hàng, tài chính, CRM, cấu hình |
| **Kho Trung Quốc** | `WAREHOUSE_CN` | Nhận hàng, quét mã, đóng kiện, chuyển trạng thái tại kho TQ |
| **Kho Việt Nam** | `WAREHOUSE_VN` | Nhận kiện, quét mã, giao hàng, chuyển trạng thái tại kho VN |
| **Kế toán** | `ACCOUNTANT` | Dashboard tài chính, xác nhận nạp tiền, quản lý giao dịch |

### Đường dẫn theo vai trò

| Vai trò | Đường dẫn | Trang chính |
|---------|-----------|-------------|
| Customer | `/dashboard` | Dashboard cá nhân |
| Admin | `/admin/dashboard` | Dashboard quản trị |
| Warehouse CN | `/warehouse/china/dashboard` | Dashboard kho TQ |
| Warehouse VN | `/warehouse/vietnam/dashboard` | Dashboard kho VN |
| Accountant | `/accountant/dashboard` | Dashboard kế toán |

---

## 2. Admin Dashboard

Truy cập: `/admin/dashboard`

### Các mục hiển thị:

| KPI | Ý nghĩa |
|-----|---------|
| Tổng đơn hàng | Số đơn trong hệ thống |
| Đơn chờ xử lý | Đơn ở trạng thái PENDING |
| Đơn hoàn thành | Đơn COMPLETED |
| Doanh thu | Tổng giá trị đơn hàng |
| Người dùng | Tổng số tài khoản |

### Menu quản trị (sidebar):

- Dashboard
- Đơn hàng
- Kiện hàng
- Người dùng
- Tài chính
- CRM
- Chiến dịch
- Khiếu nại
- Knowledge Base
- Analytics
- Analytics Summary
- Cài đặt
- Ghi chú nội bộ
- Audit Log
- Sức khỏe hệ thống
- Đơn bị kẹt
- Lỗi thông báo

---

## 3. Quản lý người dùng

Truy cập: `/admin/users`

### 3.1. Xem danh sách

Bảng hiển thị tất cả người dùng với:
- Họ tên, email, vai trò
- Số dư ví, nợ
- Trạng thái (Hoạt động / Đã khóa)
- **Badge nhanh:** Số đơn hàng, trạng thái Zalo, hoạt động gần đây

**Tìm kiếm:** Nhập tên, email hoặc SĐT vào ô tìm kiếm.

**Lọc theo vai trò:** Dropdown chọn vai trò.

### 3.2. Chỉnh sửa người dùng

1. Nhấn nút **"Sửa"** (icon bút chì) trên dòng người dùng
2. Modal hiện ra cho phép thay đổi:
   - Họ tên
   - Email (kiểm tra trùng lặp tự động)
   - Vai trò (CUSTOMER, ADMIN, WAREHOUSE_CN, WAREHOUSE_VN, ACCOUNTANT)
   - Trạng thái hoạt động (bật/tắt)
3. Nhấn **"Lưu thay đổi"**

> **Cẩn thận:** Thay đổi vai trò sẽ ảnh hưởng ngay lập tức đến quyền truy cập của người dùng.

### 3.3. Khóa / Mở khóa tài khoản

- Hệ thống dùng **khóa mềm** (deactivate) thay vì xóa cứng
- **Tại sao không xóa?** Vì người dùng có quan hệ với đơn hàng, giao dịch, thông báo — xóa cứng sẽ phá vỡ dữ liệu
- Người dùng bị khóa không thể đăng nhập
- Admin **không thể khóa chính mình** (bảo vệ tự động)

### 3.4. Xuất Excel

Nhấn nút **"Xuất Excel"** để tải xuống file `.xlsx` chứa:

| Cột | Nội dung |
|-----|---------|
| Họ tên | Tên đầy đủ |
| Email | Địa chỉ email |
| Vai trò | ADMIN/CUSTOMER/… |
| Số dư | Số dư ví hiện tại |
| Trạng thái | Hoạt động / Đã khóa |

Tên file: `users-export-YYYY-MM-DD.xlsx`

> **Ví dụ thực tế:** Cuối tháng, kế toán cần danh sách khách hàng có nợ → Xuất Excel → Lọc cột "Số dư" → Tìm giá trị âm.

---

## 4. Quản lý đơn hàng

Truy cập: `/admin/orders`

### 4.1. Tổng quan

Trang hiển thị **toàn bộ đơn hàng** của tất cả khách hàng với:
- Mã đơn, khách hàng, sản phẩm, trạng thái, tổng tiền, ngày tạo
- Hoạt động gần nhất (ai, khi nào, vai trò gì)
- Nút copy mã đơn / SĐT nhanh
- **Badge cảnh báo:** Đơn kẹt, thiếu dữ liệu, cần kiểm tra

### 4.2. Bộ lọc nhanh (Quick Filters)

**Lọc theo trạng thái (thanh badge):**
- Chờ mua | Đã mua | Đang vận chuyển | Tới kho VN | Hoàn thành

**Lọc theo tiêu chí:**

| Bộ lọc | Icon | Ý nghĩa |
|--------|------|---------|
| Có ghi chú | 📝 | Đơn có ghi chú |
| Có cập nhật KH | 📢 | Có ghi chú trạng thái tùy chỉnh |
| Đang chờ lâu | ⏳ | PENDING > 3 ngày |
| Đã hủy | ❌ | Đơn bị hủy |
| Hôm nay | 📅 | Đơn tạo hôm nay |
| Chưa hoàn thành | 📦 | Tất cả đơn chưa COMPLETED/CANCELLED |
| Khẩn cấp | 🔴 | Priority = URGENT |

### 4.3. Chuyển trạng thái nhanh

Mỗi dòng đơn hàng có nút **chuyển trạng thái** nhanh:
- Ví dụ: Đơn "PENDING" → hiện nút `→ Đã mua` và `→ Hủy`
- Nhấn nút → trạng thái chuyển ngay lập tức
- Hệ thống tự động ghi log + gửi thông báo cho khách

### 4.4. Cảnh báo vận hành (Shipment Warnings)

Hệ thống tự động phát hiện vấn đề và hiển thị badge dưới trạng thái:

| Badge | Màu | Điều kiện |
|-------|-----|-----------|
| **Chưa cập nhật** | 🟠 Cam | Không chuyển trạng thái > 5 ngày |
| **Thiếu dữ liệu** | 🔴 Đỏ | Qua kho TQ nhưng chưa có cân nặng |
| **Cần kiểm tra** | 🟡 Vàng | Đã gửi nhưng thiếu mã vận đơn |
| **Chờ khách xác nhận** | 🔵 Xanh | Có ghi chú trạng thái tùy chỉnh |

> **Tại sao cần cảnh báo?** Giúp nhân viên vận hành phát hiện nhanh các đơn bị "rơi" (không ai xử lý), tránh khiếu nại từ khách hàng.

### 4.5. Chi tiết đơn hàng (Admin)

Truy cập: `/admin/orders/[id]`

Admin có thể:
- Xem toàn bộ thông tin đơn (giống khách, nhưng thêm thông tin nội bộ)
- Thêm ghi chú nội bộ
- Cập nhật trạng thái
- Xem thông tin khách hàng (tên, email, SĐT)
- Xem chi tiết kiện hàng liên quan

---

## 5. Quản lý kiện hàng

Truy cập: `/admin/packages`

### 5.1. Kiện hàng là gì?

Một **kiện hàng** (Package) là đơn vị vật lý chứa một hoặc nhiều đơn hàng, dùng để vận chuyển từ kho TQ về kho VN.

### 5.2. Tạo kiện hàng

1. Nhấn **"Tạo kiện hàng"**
2. Điền thông tin:
   - **ID đơn hàng:** Danh sách UUID đơn hàng (cách nhau bằng dấu phẩy)
   - **Cân nặng (kg):** Tổng cân nặng kiện
   - **Kích thước:** Dài × Rộng × Cao (cm) — tùy chọn
3. Nhấn **"Tạo"**

Hệ thống tự động:
- Tạo mã kiện (ví dụ: PKG-20260515-001)
- Tạo mã vạch (barcode) nếu có
- Liên kết kiện với các đơn hàng

### 5.3. Trạng thái kiện hàng

| Trạng thái | Ý nghĩa |
|-----------|---------|
| `AT_CHINA_WH` | Đang ở kho Trung Quốc |
| `SHIPPING` | Đang trên đường về Việt Nam |
| `AT_VIETNAM_WH` | Đã đến kho Việt Nam |
| `DELIVERED` | Đã giao cho khách |

### 5.4. Chi tiết kiện hàng

Truy cập: `/admin/packages/[id]`

- Mã kiện, mã vạch, cân nặng, kích thước
- Danh sách đơn hàng trong kiện
- Ảnh kiện hàng (nếu có upload)
- Timeline trạng thái

---

## 6. Quy trình kho Trung Quốc

Truy cập: `/warehouse/china/dashboard`

### 6.1. Dashboard kho TQ

Hiển thị:
- Số kiện đang ở kho
- Kiện cần xử lý
- Kiện đã gửi đi

### 6.2. Nhận hàng (Receive)

Truy cập: `/warehouse/china/receive`

1. Hàng về kho → nhân viên nhập thông tin
2. Cân nặng, kiểm tra chất lượng
3. Chuyển trạng thái đơn → `ARRIVED_CHINA_WH`

### 6.3. Đóng kiện (Packages)

Truy cập: `/warehouse/china/packages`

1. Gom các đơn hàng cùng đợt vận chuyển
2. Tạo kiện hàng mới
3. Gán barcode, cân nặng, kích thước
4. Chuyển trạng thái kiện → `SHIPPING`

### 6.4. Quét mã (Scan)

Truy cập: `/warehouse/china/scan`

- Nhập mã barcode (gõ tay hoặc quét bằng camera)
- Hệ thống tra cứu kiện hàng tương ứng
- Hiển thị thông tin kiện + danh sách đơn hàng bên trong
- Nhấn nút chuyển trạng thái phù hợp

---

## 7. Quy trình kho Việt Nam

Truy cập: `/warehouse/vietnam/dashboard`

### 7.1. Nhận kiện (Receive)

Truy cập: `/warehouse/vietnam/receive`

1. Kiện hàng về kho VN → quét mã barcode
2. Kiểm tra số lượng, tình trạng
3. Chuyển trạng thái kiện → `AT_VIETNAM_WH`
4. Các đơn hàng bên trong tự động chuyển → `ARRIVED_VIETNAM_WH`
5. Hệ thống tự gửi thông báo cho khách: "Hàng đã về kho Việt Nam"

### 7.2. Giao hàng (Delivery)

Truy cập: `/warehouse/vietnam/delivery`

1. Chọn các đơn hàng cần giao
2. Chuyển trạng thái → `OUT_FOR_DELIVERY`
3. Sau khi giao thành công → `COMPLETED`

### 7.3. Quét mã (Scan)

Truy cập: `/warehouse/vietnam/scan`

Quy trình tương tự kho TQ:
- Quét barcode → xem thông tin kiện
- Chuyển trạng thái kiện/đơn hàng

---

## 8. Quét mã barcode

### 8.1. Hai cách nhập mã

| Cách | Mô tả | Khi nào dùng |
|------|--------|-------------|
| **Gõ tay** | Nhập mã vào ô input | Khi không có máy quét |
| **Camera** | Dùng camera thiết bị để quét | Nhanh hơn khi có nhiều kiện |

### 8.2. Quy trình quét

1. Mở trang Scan (`/warehouse/china/scan` hoặc `/warehouse/vietnam/scan`)
2. Nhập hoặc quét mã barcode/mã kiện
3. Nhấn **Enter** hoặc nhấn nút tìm kiếm
4. Hệ thống hiển thị:
   - Mã kiện, mã vạch, trạng thái
   - Cân nặng
   - Danh sách đơn hàng bên trong (mã đơn, sản phẩm, số lượng, khách hàng)
5. Nhấn nút chuyển trạng thái (ví dụ: "Đánh dấu đang vận chuyển")
6. Hệ thống tự động:
   - Cập nhật trạng thái kiện + tất cả đơn hàng bên trong
   - Gửi thông báo cho khách hàng liên quan

### 8.3. Quét bằng camera

1. Nhấn nút **"Bật camera"** trên trang Scan
2. Đưa barcode vào khung camera
3. Hệ thống tự động nhận dạng và tra cứu
4. Tiếp tục quy trình bình thường

> **Mẹo:** Đảm bảo đủ ánh sáng và barcode không bị nhòe. Camera hoạt động tốt nhất trên thiết bị di động.

### 8.4. Lịch sử quét

Sau mỗi lần quét và chuyển trạng thái, hệ thống hiển thị thông tin cập nhật gần nhất:
- Mã kiện vừa xử lý
- Trạng thái mới
- Danh sách mã đơn đã cập nhật
- Thời gian xử lý

---

## 9. Kế toán & Tài chính

### 9.1. Dashboard kế toán

Truy cập: `/accountant/dashboard`

**Thông tin tổng quan:**
- Tổng nạp tiền hôm nay
- Tổng thanh toán đơn hàng
- Nạp tiền chờ xác nhận
- Tổng nợ khách hàng

**Chỉ báo sức khỏe tài chính:**

| Chỉ báo | Icon | Ý nghĩa | Màu cảnh báo |
|---------|------|---------|-------------|
| Khách có nợ | 💳 | Số khách có debt > 0 | 🔴 Đỏ nếu > 0 |
| Chờ xác nhận | ⏳ | Yêu cầu nạp tiền pending | 🟠 Cam nếu > 0 |
| Hoàn tiền hôm nay | ↩️ | Số giao dịch REFUND hôm nay | 🔵 Xanh |
| Đơn giá trị cao | 💎 | Đơn > 5 triệu VND hôm nay | 🟣 Tím |
| Số dư âm | ⚠️ | Ví có balance < 0 | 🔴 Đỏ nếu > 0 |

### 9.2. Xác nhận nạp tiền

Khi khách gửi yêu cầu nạp tiền:
1. Xem danh sách yêu cầu PENDING trên dashboard
2. Kiểm tra thông tin: Số tiền, ngân hàng, tên CK, mã tham chiếu
3. Đối chiếu với sao kê ngân hàng thực tế
4. Nhấn **"Xác nhận"** → Tiền tự động cộng vào ví khách
5. Hoặc nhấn **"Từ chối"** nếu thông tin không khớp

> **Quan trọng:** Luôn đối chiếu sao kê ngân hàng thật trước khi xác nhận. Không xác nhận nếu chưa thấy tiền vào tài khoản công ty.

### 9.3. Trang tài chính Admin

Truy cập: `/admin/finance`

Hiển thị:
- Lợi nhuận gộp, doanh thu, chi phí
- Biểu đồ xu hướng
- Chỉ báo sức khỏe tài chính (giống dashboard kế toán)

### 9.4. Webhook ngân hàng tự động

Hệ thống hỗ trợ nhận webhook từ ngân hàng để tự động đối soát:
- Giao dịch đến được log vào `BankWebhookLog`
- So sánh mã tham chiếu với yêu cầu nạp tiền
- Tự động xác nhận nếu khớp

---

## 10. Thông báo & Kênh liên lạc

### 10.1. Tổng quan kênh

| Kênh | Cần cấu hình | Cách hoạt động |
|------|-------------|---------------|
| **System** | Không | Thông báo trong app, luôn bật |
| **Zalo OA** | Access Token + bật gửi | Gửi tin nhắn qua Zalo Official Account |
| **Telegram** | Bot Token + Chat ID | Gửi qua Telegram Bot |
| **Email (SMTP)** | Cấu hình SMTP server | Gửi email qua SMTP |

### 10.2. Cấu hình thông báo

Truy cập: `/admin/settings` → phần **Kênh thông báo**

**Zalo OA:**
1. Đăng ký Zalo Official Account
2. Lấy Access Token từ Zalo OA Dashboard
3. Nhập vào cấu hình hệ thống
4. Bật `ZALO_SEND_ENABLED = true`

**Telegram:**
1. Tạo bot qua `@BotFather` trên Telegram
2. Lấy Bot Token
3. Nhập Bot Token vào cấu hình
4. Nhập Chat ID nhóm/kênh nhận thông báo

**Email SMTP:**
1. Chuẩn bị thông tin SMTP (host, port, user, pass)
2. Nhập vào các trường tương ứng trong Settings

### 10.3. Khi nào gửi thông báo?

Hệ thống tự động gửi khi:
- Đơn hàng chuyển trạng thái
- Nạp tiền được xác nhận
- Khiếu nại được cập nhật
- Đơn bị delay (cảnh báo)

### 10.4. Xử lý lỗi thông báo

Truy cập: `/admin/notification-failures`

Khi thông báo gửi thất bại:
- Hệ thống ghi log lỗi (kênh, đơn hàng, lý do)
- Hiển thị số lần thử lại
- Admin có thể xem và xử lý (đánh dấu resolved)
- Phân loại lỗi: token hết hạn, ID không hợp lệ, lỗi mạng

---

## 11. CRM — Quản lý khách hàng tiềm năng

Truy cập: `/admin/crm`

### 11.1. Lead là gì?

**Lead** = khách hàng tiềm năng chưa đăng ký tài khoản. Họ có thể đến từ Zalo, Facebook, website, hoặc giới thiệu.

### 11.2. Nguồn Lead

| Nguồn | Mô tả |
|-------|--------|
| `ZALO` | Khách nhắn tin qua Zalo OA |
| `FACEBOOK` | Khách từ Facebook/Messenger |
| `WEBSITE` | Khách từ website |
| `REFERRAL` | Được giới thiệu bởi khách cũ |
| `OTHER` | Nguồn khác |

### 11.3. Trạng thái Lead

```
NEW → CONTACTED → INTERESTED → CONVERTED (thành khách hàng)
                              → LOST (không mua)
```

| Trạng thái | Ý nghĩa | Hành động tiếp theo |
|-----------|---------|-------------------|
| `NEW` | Mới, chưa liên hệ | Gọi điện/nhắn tin lần đầu |
| `CONTACTED` | Đã liên hệ | Theo dõi phản hồi |
| `INTERESTED` | Quan tâm, đang cân nhắc | Follow-up, gửi thông tin thêm |
| `CONVERTED` | Đã chuyển đổi thành KH | Tạo tài khoản cho KH |
| `LOST` | Không mua, mất liên lạc | Ghi chú lý do, archive |

### 11.4. Thống kê CRM

Dashboard CRM hiển thị:
- Tổng lead, lead mới, đã chuyển đổi
- Lead hôm nay, cần follow-up hôm nay, quá hạn
- Tỷ lệ chuyển đổi (conversion rate)

### 11.5. Tạo Lead mới

1. Nhấn **"Thêm Lead"**
2. Điền: Tên, SĐT, email, nguồn, ghi chú
3. Phân công cho nhân viên (tùy chọn)
4. Nhấn **"Tạo"**

### 11.6. Lead tự động

Hệ thống tự động tạo lead khi:
- Khách nhắn tin qua Zalo OA (lần đầu)
- Khách nhắn tin qua Facebook Messenger (lần đầu)
- Lead tự động có flag `isAutoCreated = true`

### 11.7. Chuyển đổi Lead → Khách hàng

1. Mở lead có trạng thái INTERESTED
2. Nhấn **"Chuyển đổi"**
3. Hệ thống tạo tài khoản User cho lead
4. Lead chuyển trạng thái → CONVERTED
5. Liên kết lead với tài khoản mới

---

## 12. Quy trình Follow-up

### 12.1. Đặt lịch Follow-up

Khi chăm sóc lead:
1. Mở chi tiết lead
2. Đặt **"Ngày follow-up tiếp theo"** (nextFollowUpAt)
3. Ghi **"Ghi chú follow-up"** — nội dung cần trao đổi
4. Lưu

### 12.2. Xem Follow-up hôm nay

Trên dashboard CRM:
- **"Cần follow-up hôm nay"** — số lead có nextFollowUpAt = hôm nay
- **"Quá hạn"** — lead có nextFollowUpAt đã qua mà chưa xử lý

### 12.3. Ghi nhận hoạt động

Mọi tương tác với lead đều được ghi log:

| Loại hoạt động | Ý nghĩa |
|---------------|---------|
| `CREATED` | Tạo lead |
| `STATUS_CHANGED` | Đổi trạng thái |
| `NOTE_UPDATED` | Cập nhật ghi chú |
| `ASSIGNED` | Phân công nhân viên |
| `CONTACTED` | Đã liên hệ |
| `FOLLOW_UP_SET` | Đặt lịch chăm sóc |
| `CONVERTED` | Chuyển đổi thành KH |
| `AUTO_CREATED` | Hệ thống tự tạo |
| `MESSAGE_RECEIVED` | Nhận tin nhắn |

---

## 13. Chiến dịch Marketing

Truy cập: `/admin/campaigns`

### 13.1. Tạo chiến dịch

1. Nhấn **"Tạo chiến dịch"**
2. Điền thông tin:

| Trường | Mô tả |
|--------|--------|
| Tên chiến dịch | Tên mô tả (ví dụ: "Khuyến mãi tháng 6") |
| Kênh | Zalo / Facebook / Email / SMS |
| Đối tượng | Lọc lead theo trạng thái |
| Mẫu tin nhắn | Nội dung gửi cho lead |
| Lịch gửi | Ngày/giờ gửi (hoặc gửi ngay) |
| Ghi chú | Ghi chú nội bộ |

3. Nhấn **"Tạo"** → Chiến dịch ở trạng thái DRAFT

### 13.2. Trạng thái chiến dịch

| Trạng thái | Ý nghĩa |
|-----------|---------|
| `DRAFT` | Nháp, chưa gửi |
| `SCHEDULED` | Đã lên lịch gửi |
| `COMPLETED` | Đã gửi xong |
| `CANCELLED` | Đã hủy |

### 13.3. Kênh gửi

- **Zalo:** Gửi qua Zalo OA (cần cấu hình token)
- **Facebook:** Gửi qua Messenger (cần cấu hình)
- **Email:** Gửi qua SMTP
- **SMS:** Gửi tin nhắn SMS (cần tích hợp provider)

---

## 14. Quản lý khiếu nại & Hỗ trợ

Truy cập: `/admin/customer-issues`

### 14.1. Xem danh sách khiếu nại

Bảng hiển thị:
- Khách hàng, mã đơn, loại vấn đề
- Mô tả, trạng thái, mức ưu tiên
- Người phụ trách, ngày tạo

### 14.2. Xử lý khiếu nại

1. Nhấn vào khiếu nại cần xử lý
2. Xem chi tiết: Loại vấn đề, mô tả, đơn hàng liên quan
3. Phân công nhân viên phụ trách (nếu chưa có)
4. Cập nhật trạng thái:
   - `NEW` → `IN_PROGRESS` → `RESOLVED`
5. Nhập phản hồi / giải pháp
6. Lưu → khách hàng nhận thông báo

### 14.3. Loại vấn đề thường gặp

| Loại | Tần suất | Cách xử lý tiêu biểu |
|------|---------|---------------------|
| Giao chậm | Cao | Kiểm tra trạng thái kho, thông báo khách |
| Thiếu hàng | Trung bình | Đối chiếu đơn với kiện, liên hệ kho TQ |
| Hỏng hàng | Thấp | Xác minh ảnh chụp, bồi thường nếu cần |
| Sai cân nặng | Trung bình | Cân lại, điều chỉnh phí nếu sai |
| Phí sai | Thấp | Kiểm tra cấu hình tỷ giá, điều chỉnh giao dịch |

---

## 15. Knowledge Base hỗ trợ (Chatbot)

Truy cập: `/admin/support-knowledge`

### 15.1. Mục đích

Knowledge Base chứa **câu hỏi – câu trả lời mẫu** để chatbot (Zalo/Telegram/Messenger) tự động trả lời khách hàng.

### 15.2. Tạo / Quản lý bài viết

| Trường | Mô tả |
|--------|--------|
| Tiêu đề | Tiêu đề câu hỏi (ví dụ: "Phí ship quốc tế bao nhiêu?") |
| Nội dung | Câu trả lời chi tiết |
| Danh mục | Phân loại (Vận chuyển, Thanh toán, Khiếu nại…) |
| Từ khóa | Các từ khóa để chatbot nhận dạng |
| Trạng thái | Bật/Tắt |

### 15.3. Thống kê

Mỗi bài viết hiển thị:
- Số lần match (tổng)
- Số lần match theo kênh (Zalo/Telegram/Messenger)
- Lần match cuối cùng

### 15.4. Câu hỏi chưa trả lời

Hệ thống ghi lại các câu hỏi chatbot **không tìm được câu trả lời** (`ChatbotUnansweredQuestion`):
- Kênh gửi
- Nội dung câu hỏi
- Trạng thái: Chưa xử lý / Đã xử lý
- Admin xem để bổ sung Knowledge Base

> **Ví dụ thực tế:** Chatbot Zalo nhận câu hỏi "Ship về Đà Nẵng mất bao lâu?" nhưng không có bài nào match → Ghi vào "Chưa trả lời" → Admin thêm bài KB mới về thời gian ship theo vùng miền.

---

## 16. Phân tích & Báo cáo

### 16.1. Analytics cơ bản

Truy cập: `/admin/analytics`

- **Biểu đồ đơn hàng:** Số đơn theo ngày (7/30/90 ngày)
- **Biểu đồ doanh thu:** Doanh thu theo ngày
- **KPI tổng:** Tổng đơn, tổng doanh thu trong kỳ

### 16.2. Analytics Summary

Truy cập: `/admin/analytics-summary`

Dashboard tổng hợp nâng cao với:
- KPI cards: Tổng đơn, doanh thu, khách hàng mới, tỷ lệ hoàn thành
- Biểu đồ xu hướng
- Top khách hàng
- Phân bổ trạng thái đơn

### 16.3. Cách đọc báo cáo

| Chỉ số | Ý nghĩa | Mục tiêu |
|--------|---------|----------|
| Tổng đơn/ngày | Số đơn mới mỗi ngày | Tăng đều |
| Doanh thu/ngày | Giá trị đơn hàng/ngày | Tăng đều |
| Tỷ lệ hoàn thành | % đơn COMPLETED / tổng | > 90% |
| Thời gian xử lý TB | Từ PENDING → COMPLETED | < 15 ngày |
| Tỷ lệ hủy | % đơn CANCELLED | < 5% |

---

## 17. Cấu hình hệ thống

Truy cập: `/admin/settings`

### 17.1. Cấu hình tỷ giá & Phí

| Key | Mô tả | Ví dụ |
|-----|--------|-------|
| `exchange_rate` | Tỷ giá CNY → VND | 3500 |
| `service_fee_percent` | Phí dịch vụ (%) | 5 |
| `china_domestic_shipping_default` | Phí ship nội địa TQ mặc định (VND) | 50000 |
| `intl_shipping_rate_per_kg` | Phí ship quốc tế/kg (VND) | 35000 |
| `vietnam_delivery_fee` | Phí giao nội địa VN (VND) | 30000 |

### 17.2. Cấu hình nạp tiền

| Key | Mô tả |
|-----|--------|
| `topup_bank_name` | Tên ngân hàng nhận tiền |
| `topup_bank_bin` | Mã BIN ngân hàng (cho QR) |
| `topup_bank_account` | Số tài khoản |
| `topup_bank_account_holder` | Chủ tài khoản |
| `topup_transfer_prefix` | Prefix nội dung chuyển khoản |

### 17.3. Cấu hình kênh thông báo

Xem [mục 10.2](#102-cấu-hình-thông-báo) chi tiết.

> **Cẩn thận:** Thay đổi tỷ giá hoặc phí sẽ ảnh hưởng đến **tất cả đơn hàng mới** từ thời điểm đó. Đơn cũ giữ nguyên tỷ giá lúc đặt.

---

## 18. Nhật ký hoạt động (Audit Log)

Truy cập: `/admin/audit-log`

### Mục đích

Ghi lại **mọi thao tác quan trọng** trên hệ thống để:
- Truy vết ai làm gì, khi nào
- Giải quyết tranh chấp
- Đảm bảo bảo mật

### Thông tin ghi lại

- Thao tác (tạo đơn, chuyển trạng thái, xác nhận nạp tiền, thay đổi cấu hình…)
- Người thực hiện
- Thời gian
- Chi tiết thay đổi

---

## 19. Sức khỏe hệ thống

Truy cập: `/admin/system-health`

Dashboard giám sát:
- Trạng thái các kênh thông báo (Zalo, Telegram, Email, Messenger)
- Số lỗi thông báo gần đây
- Trạng thái kết nối database
- Tổng quan hoạt động hệ thống

---

## 20. Ghi chú nội bộ (Staff Notes)

Truy cập: `/admin/staff-notes`

### Mục đích

Cho phép nhân viên nội bộ ghi chú riêng, không hiển thị cho khách hàng. Dùng để:
- Ghi nhớ công việc cần làm
- Ghi chú về đơn hàng cụ thể
- Chia sẻ thông tin nội bộ giữa các nhân viên

### Cách sử dụng

1. Nhấn **"Thêm ghi chú"**
2. Điền: Tiêu đề, nội dung, mã đơn (tùy chọn), mức ưu tiên
3. Đánh dấu "Đã xong" khi hoàn tất

---

## 21. Đơn bị kẹt (Stuck Shipments)

Truy cập: `/admin/stuck-shipments`

### Mục đích

Danh sách tự động các đơn hàng **bị kẹt** — không chuyển trạng thái trong thời gian bất thường.

### Tiêu chí phát hiện

- PENDING > 3 ngày
- PURCHASED > 5 ngày (shop chưa gửi)
- Tại kho TQ > 5 ngày (chưa đóng kiện)
- Ship về VN > 10 ngày
- Tại kho VN > 3 ngày (chưa giao)
- Đang giao > 2 ngày

> **Ví dụ thực tế:** Đơn ORD-20260510-042 ở trạng thái "Đang vận chuyển về VN" đã 12 ngày → Xuất hiện trong danh sách "Đơn bị kẹt" → Admin kiểm tra với đối tác vận chuyển → Phát hiện kẹt biên → Thông báo cho khách.

---

## 22. Sản xuất & Triển khai

### 22.1. Stack kỹ thuật

| Thành phần | Công nghệ | Phiên bản |
|-----------|----------|----------|
| Frontend + Backend | Next.js (App Router) | 16 |
| UI Framework | React | 19 |
| CSS | Tailwind CSS | 4 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 16 |
| Runtime | Node.js | LTS |
| Process Manager | PM2 | — |

### 22.2. Quy trình triển khai cơ bản

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Cài đặt dependencies
npm install

# 3. Chạy migration (nếu có thay đổi schema)
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate

# 5. Build ứng dụng
npm run build

# 6. Khởi động lại
pm2 restart all
```

### 22.3. Kiểm tra sau deploy

- [ ] Website truy cập được
- [ ] Đăng nhập hoạt động
- [ ] Tạo đơn hàng test
- [ ] Kiểm tra kênh thông báo
- [ ] Kiểm tra trang Scan kho

### 22.4. Biến môi trường

| Biến | Mô tả |
|------|--------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `NEXTAUTH_SECRET` | Secret cho NextAuth.js |
| `NEXTAUTH_URL` | URL base của ứng dụng |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram |
| `ZALO_OA_ACCESS_TOKEN` | Access token Zalo OA |
| `SMTP_HOST` | Host SMTP server |
| `SMTP_PORT` | Port SMTP |
| `SMTP_USER` | Username SMTP |
| `SMTP_PASS` | Password SMTP |
| `SMTP_FROM` | Email gửi |

> **Quan trọng:** Không bao giờ commit file `.env` lên Git. Luôn dùng biến môi trường trên server.

---

## 23. Sao lưu & Khôi phục

### 23.1. Sao lưu database

**Lệnh backup PostgreSQL:**

```bash
pg_dump -U postgres -d logistics_db -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

**Tần suất khuyến nghị:**

| Loại | Tần suất | Lý do |
|------|---------|-------|
| **Backup đầy đủ** | Hàng ngày (3:00 AM) | Bảo vệ toàn bộ dữ liệu |
| **Backup trước deploy** | Mỗi lần deploy | Phòng trường hợp migration lỗi |
| **Backup off-site** | Hàng tuần | Phòng sự cố server vật lý |

### 23.2. Khôi phục database

```bash
pg_restore -U postgres -d logistics_db -c backup_20260515_030000.dump
```

### 23.3. Checklist sao lưu

- [ ] Backup hàng ngày tự động (cron job)
- [ ] Kiểm tra file backup có dung lượng hợp lý
- [ ] Copy backup ra thiết bị/storage ngoài (S3, Google Drive, NAS)
- [ ] Test khôi phục định kỳ (ít nhất 1 lần/tháng)
- [ ] Lưu trữ ít nhất 30 ngày backup

### 23.4. Script backup tự động

```bash
#!/bin/bash
# backup.sh — Chạy hàng ngày qua cron
BACKUP_DIR="/backups/postgres"
DB_NAME="logistics_db"
DB_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# Xóa backup cũ hơn 30 ngày
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete

echo "Backup completed: backup_$DATE.dump"
```

**Thêm vào crontab:**
```
0 3 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

---

## 24. Các lỗi thường gặp & Cách xử lý

### 24.1. Lỗi vận hành

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|------------|-----------|
| Đơn kẹt PENDING lâu | Nhân viên chưa xử lý | Kiểm tra danh sách "Đơn bị kẹt", phân công |
| Khách phàn nàn ship chậm | Kẹt biên, tắc xe | Kiểm tra với đối tác, thông báo khách |
| Nạp tiền không khớp | Sai nội dung CK | Yêu cầu khách gửi ảnh chụp CK, đối chiếu thủ công |
| Zalo không gửi được | Token hết hạn | Vào Settings → Lấy token mới |
| Email không gửi được | Sai cấu hình SMTP | Kiểm tra host/port/user/pass |
| Cân nặng sai | Nhập sai tại kho | Cân lại, điều chỉnh giao dịch cho khách |

### 24.2. Lỗi kỹ thuật

| Vấn đề | Cách xử lý |
|--------|-----------|
| Trang trắng / 500 | Kiểm tra log PM2: `pm2 logs` |
| Database connection error | Kiểm tra PostgreSQL: `sudo systemctl status postgresql` |
| Build fail | Kiểm tra lỗi TypeScript: `npm run build` |
| Migration fail | Kiểm tra schema Prisma, chạy `npx prisma migrate reset` (DEV only!) |

### 24.3. Lỗi thường gặp của nhân viên kho

| Sai lầm | Hậu quả | Phòng tránh |
|---------|---------|-------------|
| Quét nhầm mã | Chuyển trạng thái sai kiện | Kiểm tra thông tin kiện trước khi nhấn nút |
| Nhập sai cân nặng | Phí tính sai cho khách | Cân 2 lần, so sánh với ước lượng |
| Quên quét mã khi nhận kiện | Khách không nhận thông báo | Quy trình: nhận → quét → xác nhận |
| Giao nhầm kiện | Khách nhận sai hàng | Kiểm tra tên + SĐT + mã đơn trước khi giao |

---

## 25. Ví dụ vận hành thực tế

### Ví dụ 1: Ngày làm việc bình thường của Admin

```
08:00  Mở Dashboard → Kiểm tra tổng quan
08:10  Xem "Đơn bị kẹt" → 3 đơn PENDING > 3 ngày → Phân công nhân viên mua
08:30  Xem "Khiếu nại mới" → 2 khiếu nại → Phân công + phản hồi
09:00  Kiểm tra CRM → 5 lead cần follow-up → Gọi điện/Zalo
10:00  Xác nhận nạp tiền → 8 yêu cầu pending → Đối chiếu sao kê → Xác nhận
11:00  Kiểm tra kho → Quét mã 15 kiện về kho VN
14:00  Cập nhật trạng thái → 10 đơn chuyển từ "Đã mua" → "Shop đã gửi"
15:00  Xem Analytics → Doanh thu tuần tăng 12%
16:00  Cập nhật Knowledge Base → Thêm FAQ mới về thời gian ship Tết
17:00  Backup database cuối ngày
```

### Ví dụ 2: Xử lý khiếu nại "Hàng hỏng"

```
1. Khách gửi khiếu nại: "Hàng bị vỡ, mã đơn ORD-20260512-087"
2. Admin mở khiếu nại → Xem ảnh chụp khách gửi
3. Kiểm tra kiện hàng PKG-20260510-022 → Xem ảnh đóng kiện
4. Xác nhận hàng bị hỏng do va đập
5. Tạo giao dịch REFUND 500,000 VND cho khách
6. Cập nhật khiếu nại → RESOLVED
7. Ghi chú nội bộ: "Cần thêm xốp chống sốc cho kiện từ kho TQ"
8. Khách nhận thông báo: "Khiếu nại đã được xử lý, hoàn tiền 500,000 VND"
```

### Ví dụ 3: Đợt nhận hàng tại kho Việt Nam

```
1. Xe vận chuyển đến → 50 kiện hàng
2. Mở trang Scan kho VN (/warehouse/vietnam/scan)
3. Lần lượt quét barcode từng kiện:
   - PKG-20260508-001 → Đã nhận → Khách Nguyễn Văn A nhận thông báo
   - PKG-20260508-002 → Đã nhận → Khách Trần Thị B nhận thông báo
   - ...
4. Kiểm tra: 48/50 kiện khớp → 2 kiện thiếu
5. Ghi chú nội bộ: "Thiếu 2 kiện, liên hệ kho TQ"
6. Tạo khiếu nại nội bộ cho 2 kiện thiếu
```

### Ví dụ 4: Tạo chiến dịch marketing

```
1. Vào CRM → Lọc lead trạng thái "INTERESTED" → 45 lead
2. Vào Chiến dịch → Tạo mới:
   - Tên: "Khuyến mãi ship free tháng 6"
   - Kênh: Zalo
   - Đối tượng: INTERESTED
   - Mẫu tin: "Chào [tên], BTH Logistics miễn phí ship nội địa TQ cho 3 đơn đầu tiên! Liên hệ ngay."
   - Lịch gửi: 01/06/2026 09:00
3. Lưu → Trạng thái SCHEDULED
4. Ngày 01/06 → Hệ thống tự gửi → Trạng thái COMPLETED
5. Kiểm tra CRM → Có 12 lead chuyển từ INTERESTED → CONVERTED
```

---

## Phụ lục: Vị trí ảnh chụp màn hình

> Các ảnh chụp màn hình minh họa sẽ được bổ sung trong phiên bản tiếp theo.

| # | Màn hình | Tên file gợi ý |
|---|----------|----------------|
| 1 | Admin Dashboard | `screenshots/admin-dashboard.png` |
| 2 | Quản lý người dùng | `screenshots/admin-users.png` |
| 3 | Quản lý đơn hàng + Cảnh báo | `screenshots/admin-orders.png` |
| 4 | Chi tiết đơn (Admin) | `screenshots/admin-order-detail.png` |
| 5 | Quản lý kiện hàng | `screenshots/admin-packages.png` |
| 6 | Trang Scan kho TQ | `screenshots/warehouse-china-scan.png` |
| 7 | Trang Scan kho VN | `screenshots/warehouse-vietnam-scan.png` |
| 8 | Dashboard kế toán | `screenshots/accountant-dashboard.png` |
| 9 | Xác nhận nạp tiền | `screenshots/topup-confirm.png` |
| 10 | CRM Lead Management | `screenshots/crm-leads.png` |
| 11 | Chiến dịch Marketing | `screenshots/campaigns.png` |
| 12 | Khiếu nại khách hàng | `screenshots/customer-issues.png` |
| 13 | Knowledge Base | `screenshots/support-knowledge.png` |
| 14 | Analytics Dashboard | `screenshots/analytics.png` |
| 15 | Cấu hình hệ thống | `screenshots/admin-settings.png` |
| 16 | Audit Log | `screenshots/audit-log.png` |
| 17 | Sức khỏe hệ thống | `screenshots/system-health.png` |
| 18 | Đơn bị kẹt | `screenshots/stuck-shipments.png` |
| 19 | Ghi chú nội bộ | `screenshots/staff-notes.png` |
| 20 | Lỗi thông báo | `screenshots/notification-failures.png` |

---

> **Cần hỗ trợ kỹ thuật?** Liên hệ đội ngũ phát triển hoặc xem thêm `PROJECT_SNAPSHOT.md` và `PROJECT_RULES.md` trong repo.
>
> Tài liệu này được cập nhật lần cuối: **Tháng 5/2026**
