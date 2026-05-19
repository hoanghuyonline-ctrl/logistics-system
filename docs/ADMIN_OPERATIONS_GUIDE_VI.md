# Sổ Tay Vận Hành Nội Bộ — Bắc Trung Hải Logistics

> **Phiên bản:** 2.0 — Tháng 5/2026
> **Hệ thống:** https://thue.eu.cc
> **Đối tượng:** Admin, Kế toán, Kho TQ, Kho VN, Hỗ trợ khách hàng
> **Bảo mật:** Tài liệu nội bộ — KHÔNG chia sẻ cho khách hàng

---

## Mục Lục

1. [Giới thiệu toàn bộ hệ thống](#1-giới-thiệu-toàn-bộ-hệ-thống)
2. [Cấu trúc vai trò & Phân quyền](#2-cấu-trúc-vai-trò--phân-quyền)
3. [Dashboard Admin](#3-dashboard-admin)
4. [Operations Center](#4-operations-center)
5. [Quy trình xử lý đơn hàng đầy đủ](#5-quy-trình-xử-lý-đơn-hàng-đầy-đủ)
6. [Giải thích toàn bộ trạng thái vận chuyển](#6-giải-thích-toàn-bộ-trạng-thái-vận-chuyển)
7. [Quy trình kho Trung Quốc](#7-quy-trình-kho-trung-quốc)
8. [Quy trình kho Việt Nam](#8-quy-trình-kho-việt-nam)
9. [Mini Scanner App](#9-mini-scanner-app)
10. [Quét barcode / Package](#10-quét-barcode--package)
11. [Xác nhận nạp tiền ví](#11-xác-nhận-nạp-tiền-ví)
12. [Giá hệ thống vs Giá công ty xác nhận](#12-giá-hệ-thống-vs-giá-công-ty-xác-nhận)
13. [CRM / Leads](#13-crm--leads)
14. [Chăm sóc khách hàng](#14-chăm-sóc-khách-hàng)
15. [Khiếu nại khách hàng](#15-khiếu-nại-khách-hàng)
16. [Notification Center](#16-notification-center)
17. [Zalo OA vận hành](#17-zalo-oa-vận-hành)
18. [Telegram hỗ trợ khách](#18-telegram-hỗ-trợ-khách)
19. [Notification Failures](#19-notification-failures)
20. [SLA Alerts & Stuck Shipments](#20-sla-alerts--stuck-shipments)
21. [Audit Log](#21-audit-log)
22. [Staff Notes / Bàn giao ca](#22-staff-notes--bàn-giao-ca)
23. [Finance & Analytics](#23-finance--analytics)
24. [Daily Workflow thực tế](#24-daily-workflow-thực-tế)
25. [Checklist đầu ngày / cuối ngày](#25-checklist-đầu-ngày--cuối-ngày)
26. [Các lỗi vận hành thường gặp](#26-các-lỗi-vận-hành-thường-gặp)
27. [Quy trình xử lý sự cố](#27-quy-trình-xử-lý-sự-cố)
28. [Quy trình backup / recovery cơ bản](#28-quy-trình-backup--recovery-cơ-bản)
29. [Mẹo vận hành an toàn production](#29-mẹo-vận-hành-an-toàn-production)
30. [FAQ nội bộ](#30-faq-nội-bộ)

---

## 1. Giới thiệu toàn bộ hệ thống

### 1.1. Hệ thống là gì?

Bắc Trung Hải Logistics CRM là hệ thống quản lý dịch vụ **mua hộ & vận chuyển hàng Trung Quốc — Việt Nam**, bao gồm:

- **Website:** https://thue.eu.cc
- **Ngôn ngữ:** Tiếng Việt (mặc định), English, 中文
- **Hoạt động 24/7** với hỗ trợ chatbot tự động trên Zalo, Telegram, Messenger

### 1.2. Các module chính

| Module | Mô tả | Đối tượng sử dụng |
|--------|--------|-------------------|
| Customer Portal | Đặt đơn, ví tiền, theo dõi đơn, khiếu nại | Khách hàng |
| Admin Panel | Quản lý toàn bộ: đơn hàng, người dùng, tài chính, CRM, cấu hình | Admin |
| Warehouse China | Nhận hàng, đóng kiện, quét barcode | Nhân viên kho TQ |
| Warehouse Vietnam | Nhận kiện, giao hàng, quét barcode | Nhân viên kho VN |
| Accountant | Dashboard tài chính, xác nhận nạp tiền | Kế toán |
| Chatbot | Zalo OA + Telegram + Messenger tự động | Tự động |
| Notification | System + Zalo + Telegram + Email | Tự động |

### 1.3. Quy trình tổng quát

```
KHÁCH ĐẶT ĐƠN → ADMIN MUA HÀNG → KHO TQ NHẬN → ĐÓNG KIỆN → VẬN CHUYỂN → KHO VN NHẬN → GIAO KHÁCH → HOÀN THÀNH
```

### 1.4. Thông tin công ty

| Mục | Chi tiết |
|-----|---------|
| Công ty | Công ty TNHH Bắc Trung Hải Logistics |
| Giám đốc | Phạm Văn Tuấn |
| Ngân hàng | Vietinbank CN Lạng Sơn |
| Số tài khoản | 110003049134 |
| Website | https://thue.eu.cc |

[ẢNH: Trang chủ hệ thống — giao diện landing page]

---

## 2. Cấu trúc vai trò & Phân quyền

### 2.1. Năm vai trò hệ thống

| Vai trò | Mã hệ thống | Quyền chính |
|---------|-------------|-------------|
| Khách hàng | `CUSTOMER` | Đặt đơn, xem ví, nạp tiền, gửi khiếu nại, liên kết Zalo/Telegram |
| Quản trị viên | `ADMIN` | Toàn quyền: quản lý user, đơn hàng, tài chính, CRM, cấu hình, audit |
| Kho Trung Quốc | `WAREHOUSE_CN` | Nhận hàng, quét mã, đóng kiện, cân nặng |
| Kho Việt Nam | `WAREHOUSE_VN` | Nhận kiện, quét mã, giao hàng, hoàn thành |
| Kế toán | `ACCOUNTANT` | Dashboard tài chính, xác nhận nạp tiền, xem doanh thu/lợi nhuận |

### 2.2. Đường dẫn theo vai trò

| Vai trò | Đường dẫn sau đăng nhập | Trang chính |
|---------|------------------------|-------------|
| Customer | `/dashboard` | Dashboard cá nhân |
| Admin | `/admin/dashboard` | Dashboard quản trị |
| Warehouse CN | `/warehouse/china/dashboard` | Dashboard kho TQ |
| Warehouse VN | `/warehouse/vietnam/dashboard` | Dashboard kho VN |
| Accountant | `/accountant/dashboard` | Dashboard kế toán |

### 2.3. Quy tắc phân quyền

- Mỗi tài khoản chỉ có **1 vai trò duy nhất**
- Admin có thể thay đổi vai trò người dùng bất cứ lúc nào
- Thay đổi vai trò **có hiệu lực ngay lập tức**
- Admin **không thể tự khóa chính mình** (bảo vệ tự động)
- Hệ thống dùng **khóa mềm** (deactivate) — không xóa cứng tài khoản

> **Cảnh báo:** Thay đổi vai trò sẽ thay đổi toàn bộ menu và quyền truy cập của người dùng ngay lập tức. Cân nhắc kỹ trước khi thực hiện.

[ẢNH: Bảng quản lý người dùng — cột vai trò và trạng thái]

---

## 3. Dashboard Admin

Truy cập: `/admin/dashboard`

### 3.1. Các KPI hiển thị

| KPI | Ý nghĩa |
|-----|---------|
| Tổng đơn hàng | Tổng số đơn trong toàn hệ thống |
| Đơn chờ xử lý | Đơn ở trạng thái PENDING |
| Đơn hoàn thành | Đơn COMPLETED |
| Doanh thu | Tổng giá trị đơn hàng đã hoàn thành |
| Người dùng | Tổng số tài khoản trên hệ thống |

### 3.2. Menu quản trị (Sidebar)

Sidebar bên trái chứa tất cả menu:

- Dashboard
- Đơn hàng
- Kiện hàng
- Người dùng
- Tài chính
- CRM
- Chiến dịch
- Khiếu nại
- Knowledge Base
- Analytics / Analytics Summary
- Cài đặt (Settings)
- Ghi chú nội bộ (Staff Notes)
- Audit Log
- Sức khỏe hệ thống (System Health)
- Đơn bị kẹt (Stuck Shipments)
- Lỗi thông báo (Notification Failures)
- Trung tâm vận hành (Operations Center)

### 3.3. Hành động nhanh từ Dashboard

1. Nhấn vào số KPI → Chuyển đến trang quản lý tương ứng
2. Xem đơn hàng gần nhất → Nhấn vào dòng để xem chi tiết
3. Kiểm tra thông báo → Nhấn chuông ở góc trên phải

[ẢNH: Dashboard Admin — các card KPI và biểu đồ]

---

## 4. Operations Center

Truy cập: `/admin/operations`

### 4.1. Mục đích

Trang tổng hợp giám sát vận hành thời gian thực, gồm nhiều mục:

### 4.2. Hiệu suất SLA 7 ngày

| Chỉ số | Ý nghĩa |
|--------|---------|
| Đơn cập nhật 7 ngày | Tổng đơn có chuyển trạng thái trong 7 ngày |
| Đơn vượt SLA | Đơn đang bị trễ theo ngưỡng SLA |
| Tỷ lệ vi phạm SLA | % đơn vượt SLA / tổng |

**Đánh giá SLA:**

| Tỷ lệ | Nhãn | Màu |
|--------|------|-----|
| ≤ 5% | Đang ổn | 🟢 Xanh |
| ≤ 15% | Cần chú ý | 🟠 Cam |
| > 15% | Nguy hiểm | 🔴 Đỏ |

**Các điểm nghẽn (Bottleneck):**
- Đơn PENDING > 3 ngày
- Thiếu tracking code > 3 ngày
- Ship quốc tế chậm > 7 ngày
- Chờ tại kho VN > 2 ngày
- Giao hàng chậm > 3 ngày

### 4.3. Rủi ro khách hàng / Công nợ

Hiển thị khách hàng có rủi ro cao:

| Mức rủi ro | Điều kiện |
|-----------|-----------|
| CRITICAL | Nợ lớn + số dư âm + nhiều đơn hủy |
| HIGH | Nợ cao + đơn chưa hoàn thành |
| MEDIUM | Có nợ nhưng vẫn hoạt động |
| LOW | Ít rủi ro |

Mỗi khách hiển thị: Tên, SĐT, nợ, đơn chưa xong, đơn hủy, hoạt động cuối, lý do rủi ro.

### 4.4. Backup & Disaster Recovery

Hiển thị trạng thái backup và phục hồi hệ thống.

### 4.5. Activity Intelligence

Thống kê hoạt động hệ thống: đơn mới, giao dịch, thông báo gửi.

> **Lưu ý:** Operations Center tự động làm mới mỗi 30 giây. Không cần refresh trang.

[ẢNH: Operations Center — SLA cards và danh sách bottleneck]

---

## 5. Quy trình xử lý đơn hàng đầy đủ

Truy cập: `/admin/orders`

### 5.1. Tổng quan trang đơn hàng

Trang hiển thị **toàn bộ đơn hàng** của tất cả khách hàng:
- Mã đơn, khách hàng, sản phẩm, trạng thái, tổng tiền, ngày tạo
- Hoạt động gần nhất (ai, khi nào, vai trò gì)
- Nút copy mã đơn / SĐT nhanh
- Badge cảnh báo vận hành (đơn kẹt, thiếu dữ liệu, cần kiểm tra)

### 5.2. Status Summary Counters

Hàng badge phía trên bảng hiển thị số đơn theo trạng thái:

| Badge | Ý nghĩa |
|-------|---------|
| Chờ mua | Đơn PENDING |
| Đã mua | Đơn PURCHASED |
| Đang vận chuyển | Đơn SHIPPING_TO_VN |
| Tới kho VN | Đơn ARRIVED_VIETNAM_WH |
| Hoàn thành | Đơn COMPLETED |
| Khẩn cấp | Đơn có priority = URGENT |

→ Nhấn vào badge để lọc nhanh.

### 5.3. Quick Filter Chips

| Bộ lọc | Icon | Ý nghĩa |
|--------|------|---------|
| Có ghi chú | 📝 | Đơn có note nội bộ |
| Có cập nhật KH | 📢 | Có ghi chú trạng thái cho khách |
| Đang chờ lâu | ⏳ | PENDING > 3 ngày |
| Đã hủy | ❌ | Đơn bị hủy |
| Hôm nay | 📅 | Đơn tạo hôm nay |
| Chưa hoàn thành | 📦 | Tất cả đơn chưa COMPLETED/CANCELLED |

### 5.4. Chuyển trạng thái nhanh

Cột **"Thao tác"** trên mỗi dòng:
1. Nhấn nút chuyển trạng thái (ví dụ: `→ Đã mua`)
2. Trạng thái chuyển **ngay lập tức**
3. Hệ thống tự động: ghi audit log + gửi thông báo cho khách

### 5.5. Cảnh báo vận hành (Shipment Warnings)

| Badge | Màu | Điều kiện |
|-------|-----|-----------|
| Chưa cập nhật | 🟠 Cam | Không chuyển trạng thái > 5 ngày |
| Thiếu dữ liệu | 🔴 Đỏ | Qua kho TQ nhưng chưa có cân nặng |
| Cần kiểm tra | 🟡 Vàng | Đã gửi nhưng thiếu mã vận đơn |
| Chờ khách xác nhận | 🔵 Xanh | Có ghi chú trạng thái tùy chỉnh |

### 5.6. Chi tiết đơn hàng (Admin)

Truy cập: `/admin/orders/[id]`

**Thông tin hiển thị:**
- Mã đơn, sản phẩm, link Taobao/1688 (hiện domain gọn gàng, nhấn mở tab mới)
- Thông tin khách hàng (tên, email, SĐT) với nút copy
- Chi tiết giá: giá CNY, tỷ giá, phí dịch vụ, phí ship nội địa TQ, ship quốc tế, giao nội địa VN
- Package code, barcode, tracking code (tất cả có nút copy)
- Card "Cập nhật trạng thái" — chỉ chứa nút chuyển trạng thái
- Card "Ghi chú trạng thái" — nhập ghi chú riêng cho khách xem
- Card "Độ ưu tiên" — chọn NORMAL / HIGH / URGENT
- Card "Ghi chú nội bộ" — nhập ghi chú chỉ nhân viên thấy

### 5.7. Priority Tagging

| Mức | Nhãn | Badge |
|-----|------|-------|
| NORMAL | Bình thường | Không hiển thị |
| HIGH | Ưu tiên | 🟠 Cam |
| URGENT | Khẩn cấp | 🔴 Đỏ |

→ Đặt từ trang chi tiết đơn. Đơn khẩn cấp hiển thị ở bộ lọc riêng.

[ẢNH: Trang quản lý đơn hàng — bộ lọc, badge, và cột thao tác]

---

## 6. Giải thích toàn bộ trạng thái vận chuyển

### 6.1. Bảng trạng thái chi tiết

| # | Mã hệ thống | Tên tiếng Việt | Ai chuyển | Khi nào |
|---|-------------|---------------|-----------|---------|
| 1 | `PENDING` | Chờ mua | Tự động | Khách vừa đặt đơn |
| 2 | `PURCHASED` | Đã mua | Admin | Admin đã đặt mua từ shop TQ |
| 3 | `SELLER_SHIPPED` | Shop đã gửi | Admin | Shop TQ gửi hàng về kho TQ |
| 4 | `ARRIVED_CHINA_WH` | Về kho TQ | Kho TQ | Hàng về đến kho Trung Quốc |
| 5 | `SHIPPING_TO_VN` | Đang chuyển về VN | Kho TQ / Admin | Kiện rời kho TQ về Việt Nam |
| 6 | `ARRIVED_VIETNAM_WH` | Về kho VN | Kho VN | Kiện đã đến kho Việt Nam |
| 7 | `OUT_FOR_DELIVERY` | Đang giao | Kho VN | Đang trên đường giao cho khách |
| 8 | `COMPLETED` | Hoàn thành | Kho VN / Admin | Khách đã nhận hàng |
| 9 | `CANCELLED` | Đã hủy | Admin / Khách | Đơn bị hủy |

### 6.2. Luồng chuyển trạng thái hợp lệ

```
PENDING → PURCHASED → SELLER_SHIPPED → ARRIVED_CHINA_WH → SHIPPING_TO_VN → ARRIVED_VIETNAM_WH → OUT_FOR_DELIVERY → COMPLETED
    ↓         ↓            ↓
CANCELLED  CANCELLED   CANCELLED (chỉ trước khi ship)
```

> **Quan trọng:** Hệ thống chỉ cho phép chuyển trạng thái theo đúng luồng. Không thể nhảy cóc (ví dụ: từ PENDING thẳng sang COMPLETED).

### 6.3. Tự động khi chuyển trạng thái

Mỗi lần chuyển trạng thái, hệ thống tự động:
1. Ghi **Audit Log** (ai, thời gian, trạng thái cũ → mới)
2. Gửi **thông báo** cho khách qua tất cả kênh đã liên kết (System, Zalo, Telegram, Email)
3. Cập nhật **Hoạt động** gần nhất trên bảng đơn hàng

### 6.4. Khi nào đơn bị coi là "kẹt"

| Trạng thái | Thời gian | Đánh giá |
|-----------|-----------|----------|
| PENDING | > 3 ngày | Cần mua ngay |
| PURCHASED | > 5 ngày | Shop TQ chưa gửi |
| Tại kho TQ | > 5 ngày | Chưa đóng kiện |
| Ship về VN | > 10 ngày | Vận chuyển quá lâu |
| Tại kho VN | > 3 ngày | Chưa giao |
| Đang giao | > 2 ngày | Giao thất bại? |

[ẢNH: Luồng trạng thái đơn hàng — sơ đồ 9 bước]

---

## 7. Quy trình kho Trung Quốc

Truy cập: `/warehouse/china/dashboard`

### 7.1. Dashboard kho TQ

Hiển thị tổng quan:
- Số kiện đang ở kho
- Kiện cần xử lý (chưa đóng)
- Kiện đã gửi đi trong ngày

### 7.2. Nhận hàng (Receive)

Truy cập: `/warehouse/china/receive`

**Quy trình từng bước:**

1. Hàng về kho → Mở trang Receive
2. Nhập **mã đơn hàng** hoặc **quét barcode**
3. **Cân hàng** → Nhập cân nặng (kg) chính xác
4. Kiểm tra chất lượng hàng → Nếu hư hỏng → Chụp ảnh
5. Upload ảnh kiện hàng (JPG/PNG/WebP)
6. Nhấn **"Xác nhận nhận hàng"**
7. Hệ thống tự động: Đơn chuyển → `ARRIVED_CHINA_WH` + Thông báo khách

> **Cảnh báo:** Cân nặng quyết định phí vận chuyển cho khách. **Cân 2 lần** và kiểm tra số liệu trước khi lưu.

### 7.3. Đóng kiện (Create Package)

Truy cập: `/warehouse/china/packages`

**Quy trình:**

1. Nhấn **"Tạo kiện hàng"**
2. Chọn các đơn hàng cùng đợt vận chuyển
3. Nhập:
   - Cân nặng tổng kiện (kg)
   - Kích thước: Dài × Rộng × Cao (cm) — tùy chọn
4. Nhấn **"Tạo"**

Hệ thống tự động:
- Tạo mã kiện (ví dụ: PKG-20260515-001)
- Tạo barcode Code128
- Liên kết kiện với các đơn hàng

5. **In nhãn barcode** → Dán lên kiện
6. Chuyển trạng thái kiện → `SHIPPING` khi gửi đi

### 7.4. Lưu ý quan trọng cho kho TQ

- Luôn **scan mã** khi nhận hàng — không bỏ qua bước này
- **Chụp ảnh** bao bì trước khi đóng kiện (bằng chứng nếu khiếu nại)
- Kiện nào **không match đơn hàng** → Báo Admin ngay
- Hàng **bị hư hỏng** → Chụp ảnh + Ghi chú + Báo Admin
- Cuối ca → Báo Admin số kiện chuyển về VN trong ngày

[ẢNH: Trang nhận hàng kho TQ — nhập mã và cân nặng]
[ẢNH: Trang tạo kiện — chọn đơn hàng và in barcode]

---

## 8. Quy trình kho Việt Nam

Truy cập: `/warehouse/vietnam/dashboard`

### 8.1. Dashboard kho VN

Hiển thị:
- Kiện đang chờ nhận
- Kiện đang ở kho (chờ giao)
- Đơn đang giao

### 8.2. Nhận kiện từ TQ (Receive)

Truy cập: `/warehouse/vietnam/receive`

**Quy trình:**

1. Xe vận chuyển đến → Kiểm tra số kiện theo manifest
2. Mở trang Receive hoặc Scan
3. **Quét barcode** từng kiện:
   - Quét → Hệ thống hiển thị thông tin kiện
   - Nhấn **"Xác nhận nhận kiện"**
4. Hệ thống tự động:
   - Kiện → `AT_VIETNAM_WH`
   - Tất cả đơn hàng trong kiện → `ARRIVED_VIETNAM_WH`
   - Khách hàng nhận thông báo: "Hàng đã về kho Việt Nam"
5. Kiểm tra: Số kiện nhận = Số kiện manifest
6. Kiện thiếu → Ghi chú + Liên hệ kho TQ

### 8.3. Giao hàng (Delivery)

Truy cập: `/warehouse/vietnam/delivery`

**Quy trình:**

1. Chọn đơn hàng cần giao trong ngày
2. Liên hệ khách xác nhận địa chỉ (điện thoại / Zalo)
3. Chuyển trạng thái → `OUT_FOR_DELIVERY`
4. Đi giao hàng
5. Giao thành công → Nhấn **"Hoàn thành"** → `COMPLETED`
6. Giao thất bại → Ghi chú lý do + Hẹn giao lại

### 8.4. Lưu ý quan trọng cho kho VN

- Kiện **bị hư hỏng khi vận chuyển** → Chụp ảnh + Báo Admin **TRƯỚC KHI** giao khách
- Đơn "Về kho VN" > 3 ngày chưa giao → Liên hệ khách hoặc Admin
- Kiện **không rõ khách** → Để riêng + Báo Admin
- Cuối ngày: Kiểm tra tất cả đơn "Đang giao" đã hoàn thành chưa

[ẢNH: Trang nhận kiện kho VN — quét barcode và xác nhận]

---

## 9. Mini Scanner App

### 9.1. Giới thiệu

Mini Scanner là **tính năng quét barcode bằng camera** trên thiết bị di động, tích hợp trực tiếp trong trang Scan của kho.

### 9.2. Cách sử dụng

1. Mở trang Scan trên **điện thoại hoặc tablet**:
   - Kho TQ: `/warehouse/china/scan`
   - Kho VN: `/warehouse/vietnam/scan`
2. Nhấn nút **"Bật camera"** (hoặc icon camera)
3. Đưa barcode vào khung camera
4. Hệ thống **tự động nhận dạng** barcode
5. Kết quả hiển thị: Mã kiện, trạng thái, đơn hàng bên trong
6. Nhấn nút chuyển trạng thái phù hợp

### 9.3. Mẹo dùng camera

- Đảm bảo **đủ ánh sáng** — barcode không bị tối
- Barcode **không bị nhòe, rách** hoặc che khuất
- Giữ điện thoại **cách barcode 10-20cm**
- Camera hoạt động tốt nhất trên **Chrome mobile**
- Nếu camera không nhận → Gõ mã thủ công vào ô input

### 9.4. Khi nào dùng camera vs gõ tay

| Cách | Khi nào dùng |
|------|-------------|
| Quét camera | Nhiều kiện cần xử lý nhanh, barcode rõ ràng |
| Gõ tay | Barcode bị hỏng, ánh sáng kém, chỉ 1-2 kiện |

[ẢNH: Trang Scan trên điện thoại — camera đang quét barcode]

---

## 10. Quét barcode / Package

### 10.1. Quy trình quét chi tiết

1. Mở trang Scan (`/warehouse/china/scan` hoặc `/warehouse/vietnam/scan`)
2. **Nhập mã** barcode/mã kiện vào ô input (gõ tay hoặc quét USB scanner)
3. Nhấn **Enter** hoặc nút tìm kiếm
4. Hệ thống hiển thị:
   - Mã kiện, barcode, trạng thái hiện tại
   - Cân nặng
   - Danh sách đơn hàng bên trong (mã đơn, sản phẩm, số lượng, khách hàng)
5. Nhấn nút chuyển trạng thái (ví dụ: **"Đánh dấu đang vận chuyển"**)
6. Hệ thống tự động:
   - Cập nhật trạng thái kiện + tất cả đơn hàng bên trong
   - Ghi audit log
   - Gửi thông báo cho tất cả khách hàng liên quan

### 10.2. USB Scanner

- Kết nối máy quét USB vào máy tính
- Nhấn vào ô input trên trang Scan
- Quét barcode → Mã tự động điền vào ô + tự động tìm kiếm
- Nhanh hơn camera, phù hợp cho số lượng lớn

### 10.3. Lịch sử quét

Sau mỗi lần quét thành công, trang hiển thị:
- Mã kiện vừa xử lý
- Trạng thái mới
- Danh sách mã đơn đã cập nhật
- Thời gian xử lý

### 10.4. Quản lý kiện hàng (Admin)

Truy cập: `/admin/packages`

Admin có thể:
- Xem tất cả kiện hàng
- Tạo kiện mới
- Xem chi tiết kiện: ảnh, đơn hàng liên kết, timeline trạng thái
- In nhãn barcode

**Trạng thái kiện hàng:**

| Trạng thái | Ý nghĩa |
|-----------|---------|
| `AT_CHINA_WH` | Đang ở kho TQ |
| `SHIPPING` | Đang trên đường về VN |
| `AT_VIETNAM_WH` | Đã đến kho VN |
| `DELIVERED` | Đã giao cho khách |

[ẢNH: Trang Scan — nhập mã barcode và kết quả tra cứu kiện]

---

## 11. Xác nhận nạp tiền ví

### 11.1. Quy trình tổng quan

```
KHÁCH TẠO YÊU CẦU NẠP TIỀN → HỆ THỐNG TẠO MÃ QR (VietQR)
→ KHÁCH CHUYỂN KHOẢN → KẾ TOÁN / ADMIN KIỂM TRA SAO KÊ
→ XÁC NHẬN → TIỀN VÀO VÍ KHÁCH
```

### 11.2. Nơi xem yêu cầu nạp tiền

- **Kế toán:** Dashboard `/accountant/dashboard` → "Nạp tiền chờ xác nhận"
- **Admin:** `/admin/finance` → Xem giao dịch

### 11.3. Quy trình xác nhận (Kế toán / Admin)

1. Xem danh sách yêu cầu nạp tiền trạng thái PENDING
2. Kiểm tra thông tin:
   - Số tiền khách yêu cầu
   - Ngân hàng, tên chuyển khoản
   - **Mã tham chiếu** (ví dụ: NAPVI1A2B3C)
3. **Đối chiếu sao kê ngân hàng thực tế** (Vietinbank)
4. Nếu khớp → Nhấn **"Xác nhận"** → Tiền cộng vào ví khách tự động
5. Nếu không khớp → Nhấn **"Từ chối"** + Ghi lý do

### 11.4. Webhook ngân hàng tự động

Hệ thống hỗ trợ webhook từ ngân hàng:
- Giao dịch đến được log vào `BankWebhookLog`
- So sánh mã tham chiếu tự động
- Xác nhận tự động nếu khớp

### 11.5. Quy tắc an toàn

> **TUYỆT ĐỐI:** Không bao giờ xác nhận nạp tiền nếu chưa thấy tiền thực sự vào tài khoản công ty trên sao kê ngân hàng.

- Kiểm tra **mã tham chiếu** phải khớp chính xác
- Kiểm tra **số tiền** phải khớp chính xác
- Nạp tiền sai nội dung CK → Yêu cầu khách gửi ảnh chụp giao dịch
- Ghi chú nếu có bất thường

[ẢNH: Dashboard kế toán — danh sách nạp tiền chờ xác nhận]

---

## 12. Giá hệ thống vs Giá công ty xác nhận

### 12.1. Công thức giá hệ thống (ước lượng)

```
Tổng chi phí = (Giá CNY × Tỷ giá) + Phí dịch vụ + Phí ship nội địa TQ + Phí ship quốc tế (kg × rate) + Phí giao nội địa VN
```

| Thành phần | Cấu hình tại | Ví dụ |
|-----------|-------------|-------|
| Tỷ giá CNY → VND | `/admin/settings` → `exchange_rate` | 3,500 VND/CNY |
| Phí dịch vụ | `service_fee_percent` | 5% |
| Ship nội địa TQ | `china_domestic_shipping_default` | 50,000 VND |
| Ship quốc tế | `intl_shipping_rate_per_kg` | 35,000 VND/kg |
| Giao nội địa VN | `vietnam_delivery_fee` | 30,000 VND |

### 12.2. Giá công ty xác nhận

Giá hệ thống chỉ là **ước lượng**. Admin cần xác nhận giá thực tế:

1. Khách đặt đơn → Hệ thống tính giá tự động
2. Hàng về kho TQ → Cân nặng thực tế
3. Admin kiểm tra chi phí thực → Cập nhật giá xác nhận (`confirmedCost`)
4. Giá xác nhận = Giá cuối cùng khách phải trả

### 12.3. Khi nào giá thay đổi

| Trường hợp | Ảnh hưởng |
|-----------|-----------|
| Thay đổi tỷ giá trong Settings | Chỉ ảnh hưởng đơn **mới** từ thời điểm đó |
| Cân nặng khác ước lượng | Phí ship quốc tế thay đổi |
| Admin xác nhận giá | Giá cuối cùng = confirmedCost |

> **Cảnh báo:** Thay đổi tỷ giá hoặc phí sẽ ảnh hưởng tất cả đơn mới. Đơn cũ giữ nguyên tỷ giá lúc đặt.

[ẢNH: Chi tiết đơn hàng — phần chi tiết giá và xác nhận]

---

## 13. CRM / Leads

Truy cập: `/admin/crm`

### 13.1. Lead là gì?

**Lead** = khách hàng tiềm năng chưa đăng ký tài khoản, đến từ Zalo, Facebook, website, hoặc giới thiệu.

### 13.2. Nguồn Lead

| Nguồn | Mô tả |
|-------|--------|
| `ZALO` | Khách nhắn tin qua Zalo OA |
| `FACEBOOK` | Khách từ Facebook/Messenger |
| `WEBSITE` | Khách từ website landing page |
| `REFERRAL` | Được giới thiệu bởi khách cũ |
| `OTHER` | Nguồn khác |

### 13.3. Lead tự động

Hệ thống tự động tạo lead khi:
- Khách nhắn tin lần đầu qua **Zalo OA**
- Khách nhắn tin lần đầu qua **Facebook Messenger**
- Lead tự động có flag `isAutoCreated = true`

### 13.4. Trạng thái Lead

```
NEW → CONTACTED → INTERESTED → CONVERTED (thành khách hàng)
                              → LOST (không mua)
```

| Trạng thái | Ý nghĩa | Hành động tiếp theo |
|-----------|---------|-------------------|
| `NEW` | Mới, chưa liên hệ | Gọi điện / nhắn tin lần đầu |
| `CONTACTED` | Đã liên hệ | Theo dõi phản hồi |
| `INTERESTED` | Quan tâm, đang cân nhắc | Follow-up, gửi thông tin thêm |
| `CONVERTED` | Đã chuyển thành khách hàng | Tạo tài khoản |
| `LOST` | Không mua, mất liên lạc | Ghi chú lý do, archive |

### 13.5. Tạo Lead mới

1. Nhấn **"Thêm Lead"**
2. Điền: Tên, SĐT, email, nguồn, ghi chú
3. Phân công cho nhân viên (tùy chọn)
4. Nhấn **"Tạo"**

### 13.6. Chuyển đổi Lead → Khách hàng

1. Mở lead có trạng thái INTERESTED
2. Nhấn **"Chuyển đổi"**
3. Hệ thống tạo tài khoản User cho lead
4. Lead → CONVERTED
5. Liên kết lead với tài khoản mới

### 13.7. Follow-up

1. Mở chi tiết lead → Đặt **"Ngày follow-up tiếp theo"**
2. Ghi **"Ghi chú follow-up"** — nội dung cần trao đổi
3. Dashboard CRM hiển thị: "Cần follow-up hôm nay" và "Quá hạn"

### 13.8. Dashboard CRM

- Tổng lead, lead mới, đã chuyển đổi
- Lead hôm nay, cần follow-up hôm nay, quá hạn
- Tỷ lệ chuyển đổi (conversion rate)

### 13.9. Chiến dịch Marketing

Truy cập: `/admin/campaigns`

1. Nhấn **"Tạo chiến dịch"**
2. Điền: Tên, kênh (Zalo/Facebook/Email/SMS), đối tượng, mẫu tin nhắn, lịch gửi
3. Nhấn **"Tạo"** → DRAFT → Lên lịch → SCHEDULED → Gửi xong → COMPLETED

[ẢNH: Dashboard CRM — tổng lead, follow-up, conversion rate]

---

## 14. Chăm sóc khách hàng

### 14.1. Chatbot tự động (Knowledge Base)

Truy cập: `/admin/support-knowledge`

**Chức năng:**
- Tạo / sửa / xóa **câu hỏi — câu trả lời mẫu** để chatbot tự động trả lời
- Mỗi bài có: Tiêu đề, nội dung, danh mục, từ khóa, trạng thái bật/tắt
- Chatbot tìm câu trả lời bằng **matching từ khóa** (không AI)

### 14.2. Thêm tri thức mới

1. Nhấn **"Thêm bài"**
2. Điền tiêu đề, nội dung, danh mục, từ khóa (quan trọng!)
3. Nhấn **"Lưu"**

**Cách nhanh hơn:**
- **"Nhập tri thức hàng loạt"** → Paste document → Hệ thống tự tách thành nhiều bài
- **"Tạo tri thức mẫu"** → Tạo 10 bài mẫu sẵn (giờ làm việc, liên hệ, nạp tiền...)

### 14.3. Thử câu hỏi chatbot

Card **"Thử câu hỏi chatbot"** trên trang Knowledge:
1. Nhập câu hỏi giả lập (ví dụ: "phí ship bao nhiêu?")
2. Xem kết quả: bài nào match, điểm match, nguồn match (keywords/title/content)
3. Nếu không match → Thêm từ khóa vào bài viết phù hợp

### 14.4. Câu hỏi chưa trả lời

Mục **"Câu hỏi chưa có câu trả lời"** trên trang Knowledge:
- Hiển thị câu hỏi chatbot không tìm được câu trả lời
- Mỗi câu có: Kênh (Zalo/Telegram/Messenger), nội dung, thời gian
- Nhấn **"Tạo tri thức"** → Tạo bài mới từ nội dung câu hỏi
- Nhấn **"Đánh dấu đã xử lý"** khi đã giải quyết

### 14.5. Hiệu quả chatbot

Card **"Hiệu quả chatbot"** hiển thị:
- Tổng câu hỏi / Chưa xử lý / Đã xử lý
- Phân tích theo kênh (Zalo/Telegram/Messenger)
- Top 5 câu hỏi lặp lại nhiều nhất
- Câu hỏi chưa xử lý mới nhất

### 14.6. Quản lý người dùng

Truy cập: `/admin/users`

- Xem danh sách: Họ tên, email, vai trò, số dư ví, nợ, trạng thái
- Badge nhanh: Số đơn, trạng thái Zalo, hoạt động gần đây
- Tìm kiếm theo tên, email, SĐT
- Lọc theo vai trò
- Sửa thông tin / Thay đổi vai trò / Khóa-mở khóa
- **Xuất Excel** → File `users-export-YYYY-MM-DD.xlsx`

[ẢNH: Knowledge Base — danh sách bài viết và box thử câu hỏi]

---

## 15. Khiếu nại khách hàng

Truy cập: `/admin/customer-issues`

### 15.1. Xem danh sách khiếu nại

Bảng hiển thị:
- Khách hàng, mã đơn liên quan, loại vấn đề
- Mô tả chi tiết, trạng thái, mức ưu tiên
- Người phụ trách, ngày tạo

### 15.2. Xử lý khiếu nại

1. Nhấn vào khiếu nại cần xử lý
2. Xem chi tiết: Loại vấn đề, mô tả, đơn hàng liên quan
3. Phân công nhân viên phụ trách (nếu chưa có)
4. Cập nhật trạng thái: `NEW` → `IN_PROGRESS` → `RESOLVED`
5. Nhập phản hồi / giải pháp
6. Nhấn **"Lưu"** → Khách hàng nhận thông báo

### 15.3. Loại vấn đề thường gặp

| Loại | Tần suất | Cách xử lý tiêu biểu |
|------|---------|---------------------|
| Giao chậm | Cao | Kiểm tra trạng thái kho, thông báo khách |
| Thiếu hàng | Trung bình | Đối chiếu đơn với kiện, liên hệ kho TQ |
| Hỏng hàng | Thấp | Xác minh ảnh chụp, bồi thường nếu cần |
| Sai cân nặng | Trung bình | Cân lại, điều chỉnh phí |
| Phí sai | Thấp | Kiểm tra cấu hình tỷ giá, điều chỉnh giao dịch |

### 15.4. Quy trình xử lý khiếu nại "Hàng hỏng"

```
1. Khách gửi khiếu nại: "Hàng bị vỡ, mã đơn ORD-xxx"
2. Admin mở khiếu nại → Xem ảnh chụp khách gửi
3. Kiểm tra kiện hàng → Xem ảnh đóng kiện tại kho TQ
4. Xác nhận hàng bị hỏng do va đập
5. Tạo giao dịch REFUND cho khách
6. Cập nhật khiếu nại → RESOLVED
7. Ghi chú nội bộ: "Cần thêm xốp chống sốc cho kiện từ kho TQ"
8. Khách nhận thông báo: "Khiếu nại đã được xử lý"
```

[ẢNH: Trang khiếu nại — danh sách và chi tiết xử lý]

---

## 16. Notification Center

### 16.1. Tổng quan 4 kênh thông báo

| Kênh | Cấu hình | Cách hoạt động |
|------|----------|---------------|
| **System** | Luôn bật | Thông báo trong app (chuông) |
| **Zalo OA** | Access Token + bật gửi | Gửi tin qua Zalo Official Account |
| **Telegram** | Bot Token + Chat ID | Gửi qua Telegram Bot |
| **Email (SMTP)** | Host, port, user, pass | Gửi email qua SMTP |

### 16.2. Khi nào gửi thông báo?

Hệ thống tự động gửi khi:
- Đơn hàng **chuyển trạng thái** (9 template theo trạng thái)
- Nạp tiền **được xác nhận**
- Khiếu nại **được cập nhật**
- Đơn bị **delay** (cảnh báo SLA)

### 16.3. Channel Routing

- Thông báo chỉ gửi đến kênh mà **khách đã liên kết**
- Khách chưa liên kết Zalo → Không gửi Zalo (không lỗi)
- Khách đã liên kết cả Zalo + Telegram → Gửi cả 2

### 16.4. Cấu hình kênh

Truy cập: `/admin/settings` → Phần **"Kênh thông báo"**

**Zalo OA:**
1. Đăng ký Zalo Official Account
2. Lấy Access Token
3. Nhập vào cấu hình
4. Bật `ZALO_SEND_ENABLED = true`

**Telegram:**
1. Tạo bot qua `@BotFather`
2. Lấy Bot Token
3. Nhập Bot Token vào cấu hình

**Email SMTP:**
1. Chuẩn bị thông tin SMTP
2. Nhập host, port, user, pass, from address

### 16.5. Kiểm tra trạng thái kênh

Truy cập: `/admin/settings` → Card **"Trạng thái kênh thông báo"**

Hiển thị nhanh: Telegram ✅/❌, Zalo OA ✅/❌, Email ✅/❌, Messenger ✅/❌, App ✅

[ẢNH: Cài đặt — card trạng thái kênh thông báo]

---

## 17. Zalo OA vận hành

### 17.1. Zalo OA làm gì?

Zalo Official Account là kênh chính để:
- **Gửi thông báo tự động** cho khách (chuyển trạng thái đơn)
- **Chatbot tự động** trả lời câu hỏi khách
- **Tra cứu đơn** — khách gửi mã đơn → bot trả kết quả
- **Auto-bind** — khách tra cứu lần đầu → tự động liên kết tài khoản

### 17.2. Cách chatbot Zalo hoạt động

```
KHÁCH GỬI TIN NHẮN
→ Hệ thống kiểm tra: Là mã đơn hàng?
  → CÓ → Tra cứu đơn → Trả kết quả (trạng thái, cân nặng, giá)
         + Auto-bind sender ID vào tài khoản khách
  → KHÔNG → Kiểm tra Knowledge Base
    → MATCH → Trả câu trả lời từ Knowledge Base
    → KHÔNG MATCH → Trả hướng dẫn mặc định + Lưu vào "Câu hỏi chưa trả lời"
```

### 17.3. Thông báo trạng thái tự động

Khi đơn chuyển trạng thái, Zalo OA gửi tin nhắn cho khách (nếu đã liên kết):
- 9 template tiếng Việt với emoji icon
- Ví dụ: "📦 Đơn hàng ORD-xxx đã về kho Việt Nam. Vui lòng chờ giao hàng."

### 17.4. Zalo Diagnostics

Truy cập: `/admin/settings`

Xem log gửi Zalo:
- Timestamp, mã đơn, recipient ID
- Success / Failure
- Phân loại lỗi: TOKEN_EXPIRED, INVALID_RECIPIENT, PERMISSION_DENIED, NETWORK_ERROR, CONFIG_MISSING

### 17.5. Xử lý sự cố Zalo

| Sự cố | Nguyên nhân | Cách xử lý |
|-------|------------|-----------|
| Tin không gửi được | Token hết hạn | Lấy token mới từ Zalo OA Dashboard |
| Bot không trả lời | App đang lỗi | Restart PM2 |
| Khách không nhận thông báo | Chưa liên kết | Hướng dẫn khách nhắn tin vào OA lần đầu |

[ẢNH: Zalo OA chatbot — ví dụ hội thoại tra cứu đơn]

---

## 18. Telegram hỗ trợ khách

### 18.1. Bot Telegram làm gì?

Bot `@bactrunghai_bot` hỗ trợ:
- **Tra cứu đơn** — gửi mã đơn → bot trả kết quả
- **Knowledge Base** — trả lời câu hỏi thường gặp
- **Thông báo đơn** — gửi cập nhật trạng thái cho khách đã liên kết

### 18.2. Các lệnh bot

| Lệnh | Chức năng |
|-------|----------|
| `/start` | Tin nhắn chào mừng + hướng dẫn sử dụng |
| `/help` | Danh sách lệnh + ví dụ tra cứu |
| `/status` | Hướng dẫn kiểm tra trạng thái đơn |
| Gửi mã đơn | Tra cứu đơn hàng trực tiếp |

### 18.3. Quy trình tra cứu

```
KHÁCH GỬI MÃ ĐƠN (ví dụ: ORD-20260515-001)
→ Bot tìm đơn hàng
  → TÌM THẤY → Trả trạng thái, cân nặng, giá (nếu có)
  → KHÔNG TÌM THẤY → Trả hướng dẫn kiểm tra lại mã
→ Nếu không phải mã đơn → Tìm trong Knowledge Base
  → MATCH → Trả câu trả lời
  → KHÔNG → Trả hướng dẫn mặc định + Lưu "Câu hỏi chưa trả lời"
```

### 18.4. Xử lý sự cố Telegram

| Sự cố | Cách xử lý |
|-------|-----------|
| Bot không phản hồi | Restart PM2 → Test gửi tin |
| Tin nhắn lỗi | Kiểm tra `TELEGRAM_BOT_TOKEN` trong env |
| Khách không nhận thông báo | Kiểm tra customer có `telegramChatId` chưa |

[ẢNH: Telegram bot — ví dụ tra cứu đơn hàng]

---

## 19. Notification Failures

Truy cập: `/admin/notification-failures`

### 19.1. Mục đích

Trang hiển thị tất cả thông báo **gửi thất bại** để admin xử lý.

### 19.2. Thông tin hiển thị

Mỗi lỗi gồm:
- Kênh (Zalo / Telegram / Email / Messenger)
- Đơn hàng liên quan
- Lý do lỗi
- Số lần thử lại
- Thời gian

### 19.3. Phân loại lỗi

| Loại lỗi | Ý nghĩa | Cách xử lý |
|----------|---------|-----------|
| TOKEN_EXPIRED | Token kênh hết hạn | Lấy token mới từ provider |
| INVALID_RECIPIENT | ID người nhận sai | Kiểm tra liên kết kênh của khách |
| PERMISSION_DENIED | Không có quyền gửi | Kiểm tra cấu hình OA/bot |
| NETWORK_ERROR | Lỗi mạng | Thử lại sau, kiểm tra kết nối server |
| CONFIG_MISSING | Thiếu cấu hình | Bổ sung env vars trong Settings |

### 19.4. Xử lý lỗi

1. Xem danh sách lỗi → Lọc theo kênh nếu cần
2. Xác định nguyên nhân
3. Sửa cấu hình (token, env vars...)
4. Đánh dấu **"Resolved"** sau khi xử lý

> **Mẹo:** Kiểm tra trang này **mỗi sáng**. Nếu có nhiều lỗi TOKEN_EXPIRED → Token Zalo cần gia hạn.

[ẢNH: Trang Notification Failures — danh sách lỗi và phân loại]

---

## 20. SLA Alerts & Stuck Shipments

### 20.1. Stuck Shipments

Truy cập: `/admin/stuck-shipments`

Danh sách tự động các đơn hàng **bị kẹt** — không chuyển trạng thái trong thời gian bất thường.

**Ngưỡng phát hiện:**

| Trạng thái | Ngưỡng | Ý nghĩa |
|-----------|--------|---------|
| PENDING | > 3 ngày | Chưa ai mua |
| PURCHASED | > 5 ngày | Shop TQ chưa gửi |
| Tại kho TQ | > 5 ngày | Chưa đóng kiện |
| Ship về VN | > 10 ngày | Vận chuyển quá lâu |
| Tại kho VN | > 3 ngày | Chưa giao cho khách |
| Đang giao | > 2 ngày | Giao thất bại? |

### 20.2. SLA Alerts (Operations Center)

Truy cập: `/admin/operations` → Mục "Hiệu suất SLA 7 ngày"

- Tổng đơn cập nhật, đơn vượt SLA, tỷ lệ vi phạm
- Top bottleneck (điểm nghẽn) với số lượng
- Trend label: Đang ổn / Cần chú ý / Nguy hiểm

### 20.3. Quy trình xử lý đơn kẹt

1. Mở `/admin/stuck-shipments` hoặc Operations Center
2. Xem danh sách đơn kẹt → Sắp xếp theo thời gian chờ dài nhất
3. Xác định nguyên nhân:
   - PENDING lâu → Phân công nhân viên mua
   - Kẹt biên → Liên hệ đối tác vận chuyển
   - Chờ tại kho → Liên hệ kho, sắp xếp giao
4. Thông báo khách: Thêm **ghi chú trạng thái** để khách biết tình hình
5. Đánh dấu priority **URGENT** nếu cần xử lý gấp

[ẢNH: Trang Stuck Shipments — danh sách đơn kẹt với thời gian chờ]

---

## 21. Audit Log

Truy cập: `/admin/audit-log`

### 21.1. Mục đích

Ghi lại **mọi thao tác quan trọng** trên hệ thống để:
- Truy vết: Ai làm gì, khi nào
- Giải quyết tranh chấp
- Đảm bảo bảo mật và minh bạch

### 21.2. Các thao tác được ghi

- Tạo / sửa / xóa đơn hàng
- Chuyển trạng thái đơn (ghi cả old → new status)
- Quét barcode tại kho (scan workflow)
- Xác nhận / từ chối nạp tiền
- Thay đổi cấu hình hệ thống (tỷ giá, phí)
- Tạo / sửa / xóa người dùng
- Thay đổi vai trò người dùng

### 21.3. Thông tin trong mỗi log

| Trường | Nội dung |
|--------|---------|
| Thao tác | Loại hành động (tạo đơn, chuyển trạng thái...) |
| Người thực hiện | Tên + vai trò |
| Thời gian | Ngày giờ chính xác |
| Chi tiết | Dữ liệu trước và sau thay đổi |
| Đối tượng | Đơn hàng / Kiện hàng / Người dùng liên quan |

### 21.4. Cách sử dụng

1. Mở Audit Log → Xem dòng thời gian các thao tác
2. Tìm kiếm theo: Mã đơn, người thực hiện, loại thao tác
3. Dùng khi cần giải quyết tranh chấp: "Ai đã chuyển trạng thái đơn này?"

> **Lưu ý:** Audit Log chỉ đọc (read-only). Không ai có thể xóa hoặc sửa log.

[ẢNH: Trang Audit Log — dòng thời gian các thao tác]

---

## 22. Staff Notes / Bàn giao ca

Truy cập: `/admin/staff-notes`

### 22.1. Mục đích

Ghi chú nội bộ giữa nhân viên, **không hiển thị cho khách hàng**:
- Ghi nhớ công việc cần làm
- Ghi chú về đơn hàng cụ thể
- Bàn giao thông tin giữa các ca

### 22.2. Cách sử dụng

1. Nhấn **"Thêm ghi chú"**
2. Điền:
   - **Tiêu đề:** Mô tả ngắn gọn
   - **Nội dung:** Chi tiết vấn đề / việc cần làm
   - **Mã đơn:** Liên kết đơn hàng (tùy chọn)
   - **Mức ưu tiên:** Thấp / Trung bình / Cao
3. Nhấn **"Lưu"**
4. Khi hoàn thành → Đánh dấu **"Đã xong"**

### 22.3. Quy trình bàn giao ca

**Ca sáng → Ca chiều:**
1. Người trực ca sáng ghi **Staff Note** tổng hợp cuối ca:
   - Vấn đề đang xử lý dở
   - Đơn hàng cần theo dõi đặc biệt
   - Khách hàng cần liên hệ lại
2. Người trực ca chiều mở Staff Notes → Xem ghi chú mới
3. Tiếp tục xử lý các vấn đề tồn đọng

> **Quan trọng:** Staff Notes là công cụ bàn giao chính thức. Đừng chỉ nhắn miệng — hãy ghi lại.

[ẢNH: Staff Notes — danh sách ghi chú nội bộ]

---

## 23. Finance & Analytics

### 23.1. Dashboard kế toán

Truy cập: `/accountant/dashboard`

**KPI hiển thị:**

| KPI | Icon | Ý nghĩa | Cảnh báo |
|-----|------|---------|----------|
| Tổng nạp tiền hôm nay | 💰 | Tổng tiền nạp trong ngày | — |
| Tổng thanh toán đơn | 📦 | Tổng trừ tiền đơn hoàn thành | — |
| Nạp chờ xác nhận | ⏳ | Yêu cầu nạp pending | 🟠 nếu > 0 |
| Tổng nợ KH | 💳 | Tổng debt tất cả khách | 🔴 nếu > 0 |
| Đơn giá trị cao | 💎 | Đơn > 5 triệu VND hôm nay | 🟣 Tím |
| Số dư âm | ⚠️ | Ví có balance < 0 | 🔴 nếu > 0 |

### 23.2. Trang tài chính Admin

Truy cập: `/admin/finance`

- Doanh thu, lợi nhuận gộp, chi phí
- Biểu đồ xu hướng theo thời gian
- Danh sách giao dịch gần đây

### 23.3. Analytics

Truy cập: `/admin/analytics`

- Biểu đồ đơn hàng theo ngày (7/30/90 ngày)
- Biểu đồ doanh thu theo ngày
- KPI tổng: Tổng đơn, tổng doanh thu trong kỳ

### 23.4. Analytics Summary

Truy cập: `/admin/analytics-summary`

Dashboard tổng hợp nâng cao:
- KPI cards: Tổng đơn, doanh thu, khách mới, tỷ lệ hoàn thành
- Biểu đồ xu hướng
- Top khách hàng
- Phân bổ trạng thái đơn

### 23.5. Cách đọc báo cáo

| Chỉ số | Ý nghĩa | Mục tiêu |
|--------|---------|----------|
| Tổng đơn/ngày | Số đơn mới mỗi ngày | Tăng đều |
| Doanh thu/ngày | Giá trị đơn hàng/ngày | Tăng đều |
| Tỷ lệ hoàn thành | % COMPLETED / tổng | > 90% |
| Thời gian xử lý TB | PENDING → COMPLETED | < 15 ngày |
| Tỷ lệ hủy | % CANCELLED | < 5% |

[ẢNH: Dashboard kế toán — KPI cards và bảng giao dịch]
[ẢNH: Analytics Summary — biểu đồ và top khách hàng]

---

## 24. Daily Workflow thực tế

### 24.1. Ngày làm việc của Admin

```
08:00  Đăng nhập → Dashboard Admin → Kiểm tra KPI qua đêm
08:10  Mở "Đơn bị kẹt" → 3 đơn PENDING > 3 ngày → Phân công mua
08:20  Mở Operations Center → Kiểm tra SLA + Rủi ro khách hàng
08:30  Xem "Khiếu nại mới" → 2 khiếu nại → Phân công + phản hồi
09:00  CRM → 5 lead cần follow-up → Gọi điện / nhắn Zalo
10:00  Xác nhận nạp tiền → 8 yêu cầu → Đối chiếu sao kê → Xác nhận
11:00  Kiểm tra kho → Quét mã 15 kiện về kho VN
14:00  Cập nhật trạng thái → 10 đơn từ "Đã mua" → "Shop đã gửi"
15:00  Xem Analytics → Doanh thu tuần tăng 12%
16:00  Knowledge Base → Thêm FAQ mới, xử lý câu hỏi chưa trả lời
16:30  Staff Notes → Ghi chú bàn giao ca chiều
17:00  Backup database cuối ngày
```

### 24.2. Ngày làm việc của Kế toán

```
08:30  Đăng nhập → Dashboard kế toán
08:45  Kiểm tra tiền nạp mới → Đối chiếu sao kê Vietinbank
09:00  Xác nhận nạp tiền hợp lệ (8-15 yêu cầu/ngày)
09:30  Kiểm tra công nợ → Khách nợ cao → Nhắc nạp tiền
10:00  Kiểm tra đơn Hoàn thành hôm qua → Trừ tiền đúng chưa
11:00  Giao dịch bất thường → Hoàn tiền, số dư âm → Xử lý
14:00  Đối soát lần 2 (nạp tiền chiều)
16:00  Tổng kết doanh thu trong ngày
17:00  Báo cáo cho Admin
```

### 24.3. Ngày làm việc của Kho TQ

```
09:00  Mở Dashboard kho TQ → Kiểm tra kiện cần xử lý
09:30  Hàng mới đến → Quét barcode + Cân nặng + Upload ảnh
12:00  Gom đơn → Tạo kiện mới → In barcode → Dán nhãn
14:00  Hàng tiếp tục đến → Scan + cân + ảnh
16:00  Kiểm tra: Có hàng chờ > 3 ngày chưa đóng kiện → Xử lý
17:00  Cuối ca: Tổng hợp số kiện chuyển VN → Báo Admin
```

### 24.4. Ngày làm việc của Kho VN

```
08:30  Mở Dashboard kho VN → Kiểm tra kiện chờ nhận
09:00  Xe hàng đến → Quét barcode từng kiện → Xác nhận nhận
09:30  Kiểm tra manifest: Số kiện nhận = Số kiện gửi?
10:00  Đối chiếu đơn giao trong ngày → Liên hệ khách xác nhận địa chỉ
10:30  Xuất kho → Giao hàng
15:00  Giao xong → Cập nhật COMPLETED cho từng đơn
16:00  Kiểm tra: Đơn "Về kho VN" > 3 ngày → Liên hệ khách
17:00  Cuối ngày: Kiểm tra đơn "Đang giao" chưa xong
```

---

## 25. Checklist đầu ngày / cuối ngày

### 25.1. Checklist đầu ngày (Mở ca)

**Admin / Trưởng ca — Trước 9:00:**

- [ ] Truy cập https://thue.eu.cc — trang mở bình thường
- [ ] Đăng nhập Admin → Dashboard hiển thị đúng
- [ ] Kiểm tra đơn mới qua đêm
- [ ] Kiểm tra chip "Chờ mua" — đơn chưa đặt hàng
- [ ] Kiểm tra chip "Đang chờ lâu" — đơn PENDING > 3 ngày
- [ ] Kiểm tra chip "Khẩn cấp" — đơn ưu tiên đỏ
- [ ] Kiểm tra "Về kho VN" — hàng chờ giao
- [ ] Kiểm tra "Về kho TQ" — hàng chờ đóng kiện
- [ ] Test chatbot: Gửi tin Zalo OA → Bot trả lời?
- [ ] Test chatbot: Gửi tin Telegram bot → Bot trả lời?
- [ ] Kiểm tra trạng thái kênh thông báo (Settings)
- [ ] Xem Notification Failures → Có lỗi mới?

### 25.2. Checklist cuối ngày (Đóng ca)

**Admin / Trưởng ca — Trước khi nghỉ:**

- [ ] Backup database đã chạy hôm nay (kiểm tra file backup)
- [ ] Còn bao nhiêu đơn "Chờ mua" → Ghi lại
- [ ] Còn bao nhiêu đơn "Đang vận chuyển" → Theo dõi hôm sau
- [ ] Đơn "Đang giao" chưa hoàn thành → Liên hệ shipper
- [ ] Đơn PENDING > 5 ngày → Escalate lên quản lý
- [ ] Hàng "Về kho VN" > 5 ngày → Tìm hiểu lý do
- [ ] Xem lại "Câu hỏi chưa trả lời" → Tạo tri thức mới
- [ ] Ghi Staff Notes bàn giao ca sau
- [ ] Ghi lại vấn đề cần xử lý ngày mai

### 25.3. Checklist Kế toán

**Buổi sáng:**
- [ ] Dashboard kế toán → Doanh thu, lợi nhuận, công nợ
- [ ] Tiền nạp mới → Đối chiếu sao kê ngân hàng
- [ ] Nạp tiền khớp → Xác nhận
- [ ] Nạp tiền chưa rõ nội dung → Liên hệ khách

**Buổi chiều:**
- [ ] Kiểm tra công nợ cao → Nhắc nạp tiền
- [ ] Đơn Hoàn thành hôm nay → Trừ tiền đúng chưa
- [ ] Giao dịch bất thường (hoàn tiền, số dư âm)
- [ ] Tổng kết doanh thu trong ngày

### 25.4. Checklist Kho TQ

- [ ] Hàng mới → Scan barcode + Cân nặng
- [ ] Kiểm tra cân nặng chính xác (cân 2 lần)
- [ ] Gom đơn → Tạo kiện + In barcode
- [ ] Kiện thiếu barcode → Dán bổ sung
- [ ] Hàng không match đơn → Báo Admin
- [ ] Hàng hư hỏng → Chụp ảnh + Ghi chú + Báo Admin
- [ ] Hàng chờ > 3 ngày → Xử lý hoặc báo Admin
- [ ] Cuối ca: Báo số kiện chuyển VN

### 25.5. Checklist Kho VN

- [ ] Kiện mới → Scan barcode + Kiểm tra manifest
- [ ] Kiện thiếu → Liên hệ kho TQ
- [ ] Kiện hư hỏng → Chụp ảnh + Báo Admin
- [ ] Đơn cần giao → Liên hệ khách xác nhận địa chỉ
- [ ] Xuất kho → Giao hàng → Cập nhật COMPLETED
- [ ] Giao thất bại → Ghi chú lý do + Hẹn giao lại
- [ ] Đơn "Về kho VN" > 3 ngày → Liên hệ khách
- [ ] Cuối ngày: Đơn "Đang giao" chưa xong → Kiểm tra

---

## 26. Các lỗi vận hành thường gặp

### 26.1. Lỗi vận hành

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|------------|-----------|
| Đơn kẹt PENDING lâu | Nhân viên chưa xử lý | Kiểm tra "Đơn bị kẹt", phân công |
| Khách phàn nàn ship chậm | Kẹt biên, tắc xe, ngày lễ | Kiểm tra đối tác, thông báo khách |
| Nạp tiền không khớp | Sai nội dung chuyển khoản | Yêu cầu khách gửi ảnh CK, đối chiếu thủ công |
| Zalo không gửi được | Token hết hạn | Settings → Lấy token mới |
| Email không gửi được | Sai cấu hình SMTP | Kiểm tra host/port/user/pass |
| Cân nặng sai | Nhập sai tại kho | Cân lại, điều chỉnh giao dịch cho khách |

### 26.2. Sai lầm thường gặp của kho

| Sai lầm | Hậu quả | Phòng tránh |
|---------|---------|-------------|
| Quét nhầm mã | Chuyển trạng thái sai kiện | Kiểm tra thông tin kiện trước khi nhấn nút |
| Nhập sai cân nặng | Phí tính sai cho khách | Cân 2 lần, so sánh ước lượng |
| Quên scan khi nhận kiện | Khách không nhận thông báo | Quy trình: Nhận → Quét → Xác nhận |
| Giao nhầm kiện | Khách nhận sai hàng | Kiểm tra tên + SĐT + mã đơn trước giao |
| Quên upload ảnh | Không có bằng chứng khi khiếu nại | Chụp ảnh TRƯỚC khi đóng kiện |

### 26.3. Sai lầm của Admin

| Sai lầm | Hậu quả | Phòng tránh |
|---------|---------|-------------|
| Xác nhận nạp tiền chưa kiểm tra sao kê | Mất tiền | LUÔN đối chiếu sao kê ngân hàng trước |
| Thay đổi tỷ giá không thông báo | Khách phàn nàn giá thay đổi | Thông báo trước cho khách |
| Bỏ qua đơn kẹt | Khách khiếu nại chậm | Kiểm tra Stuck Shipments mỗi ngày |
| Quên backup | Mất dữ liệu khi sự cố | Kiểm tra backup mỗi sáng |

---

## 27. Quy trình xử lý sự cố

### 27.1. Website không truy cập được

```
1. Kiểm tra internet của bạn (thử mở Google)
2. Internet OK → Kiểm tra PM2:           pm2 status
3. App stopped → Restart:                 pm2 restart logistics-system
4. Vẫn lỗi → Kiểm tra database:          docker ps | grep postgres
5. DB stopped:                            docker start logistics-postgres
                                          → Đợi 10 giây
                                          → pm2 restart logistics-system
6. Vẫn không được → Xem log:             pm2 logs logistics-system --err --lines 50
7. Liên hệ kỹ thuật viên ngay
```

### 27.2. Chatbot không trả lời

```
1. Gửi tin nhắn test vào Zalo OA / Telegram / Messenger
2. Nếu không kênh nào trả lời → App có thể đang lỗi
3. Kiểm tra PM2:                          pm2 status
4. Restart nếu cần:                       pm2 restart logistics-system
5. Kiểm tra log:                          pm2 logs logistics-system --err --lines 20
6. Nếu chỉ 1 kênh lỗi → Kiểm tra webhook/API key kênh đó
7. Liên hệ kỹ thuật viên nếu không tự khắc phục
```

### 27.3. Database không kết nối

```
1. Kiểm tra Docker:                       docker ps
2. Container stopped:                     docker start logistics-postgres
3. Đợi 10 giây
4. Kiểm tra kết nối:                      docker exec logistics-postgres pg_isready -U postgres
5. Nếu OK → Restart app:                 pm2 restart logistics-system
6. Container bị xóa:                      → Xem docs/BACKUP_AND_RECOVERY.md
7. Liên hệ kỹ thuật viên ngay
```

### 27.4. Thông báo không gửi được

```
1. Kiểm tra Settings → Trạng thái kênh thông báo
2. Kênh nào "Tắt" → Kiểm tra API key / webhook URL
3. Telegram lỗi → Kiểm tra TELEGRAM_BOT_TOKEN
4. Zalo OA lỗi → Kiểm tra ZALO_OA_ACCESS_TOKEN
5. Email lỗi → Kiểm tra SMTP cấu hình
6. Sau khi sửa env → Restart: pm2 restart logistics-system
7. Test lại: Gửi tin nhắn vào kênh đó
```

### 27.5. Bảng tóm tắt xử lý nhanh

| Sự cố | Bước đầu tiên | Bước tiếp theo |
|-------|--------------|---------------|
| Website down | `pm2 status` | `pm2 restart logistics-system` |
| Chatbot im lặng | Test gửi tin | `pm2 restart logistics-system` |
| DB lỗi | `docker ps` | `docker start logistics-postgres` |
| Thông báo lỗi | Kiểm tra Settings | Kiểm tra env → Restart |
| App crash liên tục | `pm2 logs --err` | Liên hệ kỹ thuật viên |
| Mất dữ liệu | **DỪNG MỌI THỨ** | Restore từ backup ngay |

> **QUAN TRỌNG:** Khi gặp sự cố nghiêm trọng (mất dữ liệu, app crash liên tục), **DỪNG MỌI THỨ** và liên hệ kỹ thuật viên ngay. Không tự ý thao tác có thể làm mất thêm dữ liệu.

---

## 28. Quy trình backup / recovery cơ bản

### 28.1. Backup database

**Lệnh backup:**

```bash
pg_dump -U postgres -d logistics_db -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

**Tần suất khuyến nghị:**

| Loại | Tần suất | Lý do |
|------|---------|-------|
| Backup đầy đủ | Hàng ngày (3:00 AM) | Bảo vệ toàn bộ dữ liệu |
| Backup trước deploy | Mỗi lần deploy code | Phòng migration lỗi |
| Backup off-site | Hàng tuần | Phòng sự cố server vật lý |

### 28.2. Khôi phục database

```bash
pg_restore -U postgres -d logistics_db -c backup_20260515_030000.dump
```

### 28.3. Script backup tự động

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

### 28.4. Checklist backup

- [ ] Backup hàng ngày tự động (cron job)
- [ ] Kiểm tra file backup có dung lượng hợp lý (> 100KB)
- [ ] Copy backup ra thiết bị ngoài (S3 / Google Drive / NAS)
- [ ] Test khôi phục định kỳ (ít nhất 1 lần/tháng)
- [ ] Lưu trữ ít nhất 30 ngày backup

---

## 29. Mẹo vận hành an toàn production

### 29.1. Quy tắc vàng

1. **Luôn backup trước khi deploy** — không ngoại lệ
2. **Không bao giờ xác nhận nạp tiền chưa kiểm tra sao kê** — tiền thật, sai không lấy lại
3. **Cân hàng 2 lần** — cân nặng quyết định phí vận chuyển
4. **Scan trước, xác nhận sau** — kiểm tra thông tin kiện trước khi nhấn nút
5. **Ghi chú mọi bất thường** — Staff Notes là công cụ bàn giao chính thức

### 29.2. Bảo mật

- **Không chia sẻ mật khẩu** giữa các nhân viên
- **Đăng xuất** khi rời máy tính
- **Không dùng Wi-Fi công cộng** khi truy cập hệ thống
- Không commit file `.env` — tất cả secrets qua biến môi trường

### 29.3. Khi thay đổi cấu hình

- Thay đổi tỷ giá → **Thông báo khách trước**
- Thay đổi phí → **Ghi chú thời điểm áp dụng**
- Thay đổi vai trò người dùng → **Cẩn thận, có hiệu lực ngay**

### 29.4. Khi xử lý khiếu nại

- **Xem ảnh trước** — không vội kết luận
- **Kiểm tra audit log** — ai đã làm gì
- **Ghi chú quy trình** — để lần sau xử lý nhanh hơn
- **Hoàn tiền = giao dịch thật** — kiểm tra kỹ số tiền

### 29.5. Khi deploy code mới

```
1. Backup database TRƯỚC
2. Pull code mới:     git pull origin main
3. Install deps:      npm install
4. Migration:         npx prisma migrate deploy (nếu có)
5. Generate:          npx prisma generate
6. Build:             npm run build
7. Restart:           pm2 restart all
8. Kiểm tra:          Website mở được? Đăng nhập được? Chatbot phản hồi?
```

---

## 30. FAQ nội bộ

### Câu hỏi chung

**Q: Khách gọi hỏi trạng thái đơn, làm sao tra nhanh?**
A: Vào `/admin/orders` → Nhập mã đơn hoặc SĐT khách vào ô tìm kiếm → Xem trạng thái ngay.

**Q: Khách nói chưa nhận thông báo, làm gì?**
A: Kiểm tra `/admin/notification-failures` → Xem có lỗi gửi không. Kiểm tra khách đã liên kết Zalo/Telegram chưa.

**Q: Tỷ giá hôm nay bao nhiêu? Làm sao thay đổi?**
A: Vào `/admin/settings` → Trường `exchange_rate` → Nhập tỷ giá mới → Lưu. Chỉ ảnh hưởng đơn mới.

**Q: Làm sao biết đơn nào đang bị kẹt?**
A: Vào `/admin/stuck-shipments` hoặc Operations Center → Xem danh sách đơn kẹt tự động.

### Kho vận

**Q: Barcode bị hỏng, quét không được?**
A: Gõ mã thủ công vào ô input trên trang Scan. Nếu mã cũng không đọc được → Kiểm tra mã trên hệ thống Admin → Packages.

**Q: Kiện nhận từ TQ thiếu so với manifest?**
A: Ghi chú Staff Notes ngay + Liên hệ kho TQ xác nhận + Báo Admin.

**Q: Khách từ chối nhận hàng, làm gì?**
A: Ghi chú lý do trên Staff Notes. Giữ kiện tại kho. Báo Admin để xử lý (hoàn tiền / giao lại).

### Kế toán

**Q: Khách chuyển khoản sai nội dung, không tìm được mã tham chiếu?**
A: Yêu cầu khách gửi ảnh chụp giao dịch ngân hàng → Đối chiếu thủ công số tiền + thời gian → Xác nhận thủ công.

**Q: Khách muốn hoàn tiền, quy trình?**
A: Admin tạo giao dịch REFUND từ trang chi tiết đơn → Tiền cộng lại vào ví khách tự động.

**Q: Có đơn Hoàn thành nhưng chưa trừ tiền, sao lại thế?**
A: Kiểm tra Audit Log → Xem quy trình thanh toán. Có thể khách có nợ hoặc balance đã trừ trước đó.

### Hỗ trợ khách hàng

**Q: Chatbot trả lời sai, làm sao sửa?**
A: Vào Knowledge Base → Tìm bài viết match sai → Sửa từ khóa / nội dung → Test lại bằng box "Thử câu hỏi chatbot".

**Q: Khách hỏi câu chatbot không biết trả lời?**
A: Xem "Câu hỏi chưa trả lời" → Nhấn "Tạo tri thức" để tạo bài mới cho câu hỏi đó.

**Q: Khách muốn liên kết Zalo nhưng không biết cách?**
A: Hướng dẫn khách nhắn tin bất kỳ vào Zalo OA (ví dụ: "xin chào") → Hệ thống tự động liên kết.

### Hệ thống

**Q: App bị chậm, load lâu?**
A: Kiểm tra PM2: `pm2 status` → Kiểm tra memory/CPU. Restart nếu cần: `pm2 restart logistics-system`.

**Q: Cần thêm nhân viên mới, tạo tài khoản như thế nào?**
A: Admin vào `/admin/users` → Tạo user mới → Chọn vai trò phù hợp (WAREHOUSE_CN, WAREHOUSE_VN, ACCOUNTANT).

**Q: Muốn xem ai đã thay đổi trạng thái đơn?**
A: Vào Audit Log → Tìm theo mã đơn → Xem chi tiết thao tác, người thực hiện, thời gian.

---

## Phụ lục: Vị trí ảnh chụp màn hình

| # | Màn hình | Vị trí trong tài liệu |
|---|----------|----------------------|
| 1 | Trang chủ hệ thống | Mục 1 |
| 2 | Bảng quản lý người dùng | Mục 2 |
| 3 | Dashboard Admin | Mục 3 |
| 4 | Operations Center — SLA | Mục 4 |
| 5 | Quản lý đơn hàng — bộ lọc | Mục 5 |
| 6 | Luồng trạng thái đơn hàng | Mục 6 |
| 7 | Nhận hàng kho TQ | Mục 7 |
| 8 | Tạo kiện — barcode | Mục 7 |
| 9 | Nhận kiện kho VN | Mục 8 |
| 10 | Scanner trên điện thoại | Mục 9 |
| 11 | Trang Scan — tra cứu kiện | Mục 10 |
| 12 | Dashboard kế toán — nạp tiền | Mục 11 |
| 13 | Chi tiết đơn — giá xác nhận | Mục 12 |
| 14 | Dashboard CRM | Mục 13 |
| 15 | Knowledge Base — thử chatbot | Mục 14 |
| 16 | Khiếu nại — xử lý | Mục 15 |
| 17 | Cài đặt — kênh thông báo | Mục 16 |
| 18 | Zalo OA chatbot — hội thoại | Mục 17 |
| 19 | Telegram bot — tra cứu đơn | Mục 18 |
| 20 | Notification Failures | Mục 19 |
| 21 | Stuck Shipments | Mục 20 |
| 22 | Audit Log — dòng thời gian | Mục 21 |
| 23 | Staff Notes | Mục 22 |
| 24 | Analytics Summary | Mục 23 |

---

> **Tài liệu nội bộ — Bắc Trung Hải Logistics**
>
> Giám đốc: Phạm Văn Tuấn | Website: https://thue.eu.cc
>
> Hotline: 0901 234 567 | Email: support@bactrunghai.vn
>
> Cập nhật lần cuối: Tháng 5/2026
