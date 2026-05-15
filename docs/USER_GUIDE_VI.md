# Hướng Dẫn Sử Dụng Hệ Thống Logistics — Dành Cho Khách Hàng

> **Phiên bản:** 1.0 — Tháng 5/2026
> **Hệ thống:** Bắc Trung Hải Logistics CRM
> **Ngôn ngữ:** Tiếng Việt (mặc định) · English · 中文

---

## Mục Lục

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Đăng ký & Đăng nhập](#2-đăng-ký--đăng-nhập)
3. [Tổng quan Dashboard khách hàng](#3-tổng-quan-dashboard-khách-hàng)
4. [Tạo đơn hàng mới](#4-tạo-đơn-hàng-mới)
5. [Theo dõi đơn hàng](#5-theo-dõi-đơn-hàng)
6. [Chi tiết đơn hàng](#6-chi-tiết-đơn-hàng)
7. [Quy trình vận chuyển A→Z](#7-quy-trình-vận-chuyển-az)
8. [Ví điện tử & Nạp tiền](#8-ví-điện-tử--nạp-tiền)
9. [Lịch sử giao dịch](#9-lịch-sử-giao-dịch)
10. [Thông báo](#10-thông-báo)
11. [Liên kết Zalo / Telegram](#11-liên-kết-zalo--telegram)
12. [Gửi khiếu nại / Yêu cầu hỗ trợ](#12-gửi-khiếu-nại--yêu-cầu-hỗ-trợ)
13. [Hồ sơ cá nhân](#13-hồ-sơ-cá-nhân)
14. [Các lỗi thường gặp & Cách xử lý](#14-các-lỗi-thường-gặp--cách-xử-lý)
15. [Câu hỏi thường gặp (FAQ)](#15-câu-hỏi-thường-gặp-faq)

---

## 1. Giới thiệu tổng quan

### Hệ thống này dùng để làm gì?

Bắc Trung Hải Logistics CRM là hệ thống quản lý **mua hộ và vận chuyển hàng hóa từ Trung Quốc về Việt Nam**. Bạn có thể:

- Đặt đơn mua hàng từ các shop Trung Quốc (Taobao, 1688, Pinduoduo…)
- Theo dõi trạng thái đơn hàng real-time từ lúc đặt đến khi nhận hàng
- Quản lý ví điện tử, nạp tiền, xem lịch sử giao dịch
- Nhận thông báo tự động qua Zalo, Telegram, email hoặc hệ thống
- Gửi khiếu nại nếu gặp vấn đề với đơn hàng

### Ai nên đọc tài liệu này?

Tất cả **khách hàng** sử dụng hệ thống. Nếu bạn là quản trị viên (Admin), kế toán hoặc nhân viên kho, vui lòng xem thêm [ADMIN_GUIDE_VI.md](./ADMIN_GUIDE_VI.md).

---

## 2. Đăng ký & Đăng nhập

### 2.1. Đăng ký tài khoản mới

**Bước 1:** Truy cập trang đăng ký tại `/register`

**Bước 2:** Điền thông tin:

| Trường | Mô tả | Bắt buộc |
|--------|--------|----------|
| Họ tên | Tên đầy đủ của bạn | ✓ |
| Email | Địa chỉ email (dùng để đăng nhập) | ✓ |
| Mật khẩu | Tối thiểu 6 ký tự | ✓ |
| Xác nhận mật khẩu | Nhập lại mật khẩu | ✓ |

**Bước 3:** Nhấn **"Đăng ký"**

> **Tại sao cần đăng ký?** Tài khoản giúp bạn theo dõi đơn hàng, quản lý ví tiền, và nhận thông báo cập nhật trạng thái. Mỗi email chỉ dùng được cho một tài khoản duy nhất.

**Bước 4:** Sau khi đăng ký thành công, hệ thống tự động tạo ví điện tử cho bạn (số dư ban đầu = 0 VND).

### 2.2. Đăng nhập

**Bước 1:** Truy cập trang đăng nhập tại `/login`

**Bước 2:** Nhập email + mật khẩu → nhấn **"Đăng nhập"**

> **Mẹo:** Hệ thống hỗ trợ 3 ngôn ngữ: Tiếng Việt, English, 中文. Bạn có thể chuyển ngôn ngữ bất cứ lúc nào từ menu cài đặt.

### 2.3. Quên mật khẩu

Liên hệ nhân viên hỗ trợ (Admin) để được reset mật khẩu. Hệ thống hiện chưa hỗ trợ tự đặt lại mật khẩu qua email.

---

## 3. Tổng quan Dashboard khách hàng

Sau khi đăng nhập, bạn sẽ thấy **Dashboard** — trang tổng quan cá nhân.

### Những gì hiển thị trên Dashboard:

| Mục | Ý nghĩa |
|-----|---------|
| **Số dư ví** | Số tiền hiện có trong ví điện tử của bạn |
| **Nợ** | Số tiền bạn còn nợ (nếu có) |
| **5 đơn gần nhất** | Danh sách đơn hàng mới nhất với trạng thái |
| **Liên kết Zalo** | Gợi ý liên kết Zalo nếu chưa kết nối |

### Các nút nhanh:

- **"Tạo đơn hàng mới"** → chuyển đến trang đặt đơn
- **"Xem tất cả đơn"** → danh sách đầy đủ đơn hàng
- **"Nạp tiền"** → chuyển đến trang ví
- Nhấn vào bất kỳ đơn hàng nào → xem chi tiết

> **Tại sao cần xem Dashboard thường xuyên?** Giúp bạn nắm nhanh tình hình đơn hàng và số dư ví. Nếu có đơn bị delay, bạn sẽ thấy cảnh báo ngay tại đây.

---

## 4. Tạo đơn hàng mới

### 4.1. Cách đặt đơn

Truy cập **"Đặt hàng mới"** (menu trái → Tạo đơn, hoặc từ Dashboard).

**Bước 1:** Điền thông tin sản phẩm:

| Trường | Mô tả | Ví dụ | Bắt buộc |
|--------|--------|-------|----------|
| Tên sản phẩm | Tên mô tả ngắn gọn | "Áo khoác nam size XL" | ✓ |
| Link sản phẩm | URL từ Taobao/1688/PDD | `https://item.taobao.com/...` | ✓ |
| Số lượng | Số lượng muốn mua | 2 | ✓ |
| Đơn giá (CNY) | Giá mỗi sản phẩm bằng Nhân dân tệ | 150 | ✓ |
| Ghi chú | Yêu cầu đặc biệt (size, màu…) | "Màu đen, size XL" | Không |
| Ảnh sản phẩm | Upload ảnh tham khảo | — | Không |

**Bước 2:** Nhấn **"Đặt hàng"**

### 4.2. Hệ thống tự động tính phí

Khi bạn đặt đơn, hệ thống sẽ **tự động tính toàn bộ chi phí** dựa trên cấu hình hiện tại:

```
Tổng tiền = Giá sản phẩm (VND) + Phí dịch vụ + Phí ship nội địa TQ + Phí ship quốc tế + Phí giao VN
```

Chi tiết:
- **Giá sản phẩm (VND)** = Đơn giá CNY × Số lượng × Tỷ giá
- **Phí dịch vụ** = Giá sản phẩm VND × % phí dịch vụ (mặc định 5%)
- **Phí ship nội địa Trung Quốc** = Cấu hình mặc định (ví dụ 50,000 VND)
- **Phí ship quốc tế** = Cân nặng × Đơn giá vận chuyển quốc tế/kg (tính sau khi cân tại kho)
- **Phí giao nội địa Việt Nam** = Tùy cấu hình

> **Lưu ý quan trọng:** Phí vận chuyển quốc tế sẽ được cập nhật chính xác **sau khi kho Trung Quốc cân hàng**. Ban đầu có thể hiển thị phí tạm tính.

### 4.3. Ví dụ thực tế

> Bạn muốn mua 3 chiếc áo khoác, giá 200 CNY/chiếc từ Taobao.
>
> - Tỷ giá hiện tại: 1 CNY = 3,500 VND
> - Giá sản phẩm: 200 × 3 × 3,500 = 2,100,000 VND
> - Phí dịch vụ (5%): 105,000 VND
> - Ship nội địa TQ: 50,000 VND
> - **Tổng tạm tính: 2,255,000 VND** (chưa tính ship quốc tế)

---

## 5. Theo dõi đơn hàng

### 5.1. Danh sách đơn hàng

Truy cập **"Đơn hàng"** từ menu trái để xem toàn bộ đơn hàng.

**Các thông tin hiển thị:**

| Cột | Ý nghĩa |
|-----|---------|
| Mã đơn | Mã định danh duy nhất (ví dụ: ORD-20260515-001) |
| Sản phẩm | Tên sản phẩm đã đặt |
| Trạng thái | Trạng thái hiện tại với biểu tượng màu |
| Tổng tiền | Tổng chi phí (VND) |
| Ngày tạo | Thời gian đặt đơn |

### 5.2. Các biểu tượng trạng thái

Mỗi đơn hàng có một **chấm tròn màu** thể hiện trạng thái:

| Màu | Trạng thái | Ý nghĩa |
|-----|-----------|---------|
| 🟡 Vàng | Chờ mua | Đang chờ nhân viên đặt mua |
| 🔵 Xanh dương | Đã mua | Nhân viên đã đặt mua từ shop TQ |
| 🟣 Tím | Shop đã gửi | Shop TQ đã gửi hàng đến kho TQ |
| 🟤 Nâu | Tới kho TQ | Hàng đã đến kho Trung Quốc |
| 🟠 Cam | Đang đóng kiện | Đang đóng gói tại kho TQ |
| 🔵 Xanh nhạt | Đang ship về VN | Hàng đang trên đường về Việt Nam |
| 🟢 Xanh lá nhạt | Tới kho VN | Hàng đã đến kho Việt Nam |
| 🟢 Xanh lá | Đang giao | Đang giao đến địa chỉ của bạn |
| ✅ Xanh đậm | Hoàn thành | Đã giao thành công |
| 🔴 Đỏ | Đã hủy | Đơn bị hủy |

### 5.3. Chỉ báo đặc biệt

Hệ thống tự động hiển thị các cảnh báo trực quan:

- **⚠ "Chờ lâu"** — Đơn ở trạng thái PENDING quá 3 ngày → bạn nên liên hệ nhân viên
- **🏠 "Đã về VN"** — Hàng đã về kho Việt Nam, sắp được giao
- **✓ "Đã giao"** — Đơn hoàn tất
- **📦 "Đã đóng kiện"** — Hàng đã được đóng vào kiện vận chuyển

### 5.4. Thanh tiến trình

Mỗi đơn hàng hiển thị một **thanh tiến trình 8 bước** (progress bar) cho biết đơn đang ở giai đoạn nào trong quy trình vận chuyển.

---

## 6. Chi tiết đơn hàng

Nhấn vào mã đơn hàng để xem chi tiết đầy đủ.

### 6.1. Thông tin hiển thị

**Phần trạng thái hiện tại:**
- Biểu tượng + mô tả trạng thái bằng tiếng Việt
- Bước tiếp theo (ví dụ: "Bước tiếp theo: nhân viên sẽ đặt mua và cập nhật trạng thái")
- Thanh tiến trình trực quan
- Cảnh báo delay nếu đơn xử lý chậm

**Thông tin sản phẩm:**
- Tên, link, số lượng, đơn giá, cân nặng (nếu đã cân)

**Bảng chi phí chi tiết:**
- Giá CNY, tỷ giá, giá VND, phí dịch vụ, phí ship TQ, phí ship quốc tế, phí giao VN
- **Tổng cộng** hiển thị nổi bật

**Thông tin vận đơn:**
- Mã vận đơn Trung Quốc (nếu có)
- Mã vận đơn quốc tế (nếu có)

**Timeline trạng thái:**
- Dòng thời gian hiển thị toàn bộ lịch sử chuyển trạng thái
- Ai thay đổi, lúc nào, ghi chú kèm theo

**Ghi chú đơn hàng:**
- Xem tất cả ghi chú từ khách hàng, nhân viên, kho
- Thêm ghi chú mới bất cứ lúc nào

### 6.2. Gửi khiếu nại từ chi tiết đơn

Ở cuối trang chi tiết đơn hàng, bạn có thể nhấn **"Gửi khiếu nại / Yêu cầu hỗ trợ"** với các loại vấn đề:

| Loại | Khi nào dùng |
|------|-------------|
| Thiếu hàng | Nhận hàng thiếu so với đặt |
| Giao chậm | Đơn bị delay quá lâu |
| Sai cân nặng | Cân nặng ghi trên hệ thống khác thực tế |
| Hỏng hàng | Hàng nhận bị hư hỏng |
| Chưa nhận được hàng | Trạng thái "Đã giao" nhưng chưa nhận |
| Phí sai | Chi phí tính sai |
| Chatbot/Hỗ trợ | Cần trao đổi thêm |
| Khác | Vấn đề khác |

---

## 7. Quy trình vận chuyển A→Z

### Toàn bộ hành trình đơn hàng:

```
[1] PENDING        →  Bạn đặt đơn, chờ nhân viên mua
         ↓
[2] PURCHASED      →  Nhân viên đã đặt mua từ shop Trung Quốc
         ↓
[3] SELLER_SHIPPED →  Shop TQ gửi hàng đến kho TQ
         ↓
[4] ARRIVED_CHINA_WH → Hàng tới kho TQ, kiểm tra & cân
         ↓
[5] PACKING        →  Đóng gói vào kiện vận chuyển
         ↓
[6] SHIPPING_TO_VIETNAM → Kiện đang trên xe về Việt Nam (3-7 ngày)
         ↓
[7] ARRIVED_VIETNAM_WH → Hàng tới kho VN, quét mã & chuẩn bị giao
         ↓
[8] OUT_FOR_DELIVERY → Đang giao đến địa chỉ bạn
         ↓
[9] COMPLETED      →  Giao thành công! 🎉
```

### Thời gian ước tính mỗi giai đoạn

| Giai đoạn | Thời gian trung bình | Cảnh báo delay |
|-----------|---------------------|----------------|
| Chờ mua → Đã mua | 1-2 ngày | Nếu >3 ngày |
| Đã mua → Shop gửi | 2-5 ngày | Nếu >5 ngày |
| Shop gửi → Tới kho TQ | 1-3 ngày | — |
| Kho TQ → Đóng kiện | 1-2 ngày | Nếu >5 ngày |
| Ship về VN | 3-7 ngày | Nếu >10 ngày |
| Kho VN → Giao hàng | 1-3 ngày | Nếu >3 ngày |
| Đang giao → Hoàn tất | 1 ngày | Nếu >2 ngày |

> **Tại sao có cảnh báo delay?** Hệ thống tự động phát hiện khi đơn bị chậm hơn bình thường và hiển thị thông báo vàng. Bạn có thể liên hệ nhân viên hoặc gửi khiếu nại nếu cần.

### Khi nào đơn bị hủy?

Đơn có thể bị hủy ở trạng thái **Chờ mua** hoặc **Đã mua** (chưa gửi hàng). Sau khi shop đã gửi hàng, đơn không thể hủy.

---

## 8. Ví điện tử & Nạp tiền

### 8.1. Ví điện tử là gì?

Mỗi tài khoản có một **ví điện tử** dùng để thanh toán đơn hàng. Ví có 2 chỉ số:

| Chỉ số | Ý nghĩa |
|--------|---------|
| **Số dư** | Số tiền hiện có, có thể dùng để thanh toán |
| **Nợ** | Số tiền bạn còn nợ hệ thống (nếu đặt hàng khi ví không đủ) |

### 8.2. Cách nạp tiền vào ví

**Bước 1:** Truy cập **"Ví tiền"** từ menu trái

**Bước 2:** Xem thông tin chuyển khoản:
- Tên ngân hàng
- Số tài khoản
- Chủ tài khoản
- Nội dung chuyển khoản (có sẵn mã tham chiếu)

**Bước 3:** Chuyển khoản qua app ngân hàng với **đúng nội dung** đã cung cấp

**Bước 4:** Tạo yêu cầu nạp tiền trên hệ thống:
- Nhập số tiền đã chuyển
- Nhập tên ngân hàng gửi
- Nhập số tài khoản gửi
- Nhập tên chủ tài khoản gửi
- Nhấn **"Gửi yêu cầu nạp tiền"**

**Bước 5:** Chờ kế toán xác nhận (thông thường trong vòng 24 giờ)

> **Quan trọng:** Nội dung chuyển khoản phải **chính xác** để hệ thống tự động nhận diện. Nếu bạn ghi sai nội dung, vui lòng liên hệ nhân viên hỗ trợ.

### 8.3. Trạng thái yêu cầu nạp tiền

| Trạng thái | Ý nghĩa |
|-----------|---------|
| PENDING | Đang chờ xác nhận |
| CONFIRMED | Đã xác nhận, tiền đã vào ví |
| REJECTED | Bị từ chối (thường do sai thông tin) |

### 8.4. Mã QR nạp tiền

Hệ thống tự động tạo **mã QR chuyển khoản** với đầy đủ thông tin (số tài khoản, số tiền, nội dung). Bạn chỉ cần mở app ngân hàng → Quét QR → Xác nhận chuyển.

> **Ví dụ thực tế:**
> Bạn cần nạp 5,000,000 VND:
> 1. Vào "Ví tiền" → nhập 5000000
> 2. Hệ thống hiển thị mã QR + thông tin CK
> 3. Mở app Vietcombank → Quét QR → Chuyển
> 4. Quay lại hệ thống → Nhấn "Gửi yêu cầu nạp tiền"
> 5. Chờ kế toán xác nhận → Số dư ví tăng thêm 5 triệu

---

## 9. Lịch sử giao dịch

Truy cập **"Giao dịch"** từ menu trái để xem toàn bộ lịch sử.

### Các loại giao dịch:

| Loại | Ý nghĩa | Ảnh hưởng ví |
|------|---------|-------------|
| **DEPOSIT** | Nạp tiền vào ví | Tăng số dư |
| **ORDER_PAYMENT** | Thanh toán đơn hàng | Giảm số dư |
| **REFUND** | Hoàn tiền | Tăng số dư |
| **ADJUSTMENT** | Điều chỉnh (bởi kế toán/admin) | Tùy theo |

### Thông tin mỗi giao dịch:

- Loại giao dịch
- Số tiền
- Số dư trước & sau giao dịch
- Mô tả / Lý do
- Mã đơn hàng liên quan (nếu có)
- Thời gian

> **Mẹo:** Kiểm tra lịch sử giao dịch thường xuyên để đảm bảo mọi khoản thu/chi đều chính xác.

---

## 10. Thông báo

### 10.1. Các kênh thông báo

Hệ thống gửi thông báo qua **4 kênh**:

| Kênh | Cách nhận | Cần thiết lập |
|------|----------|--------------|
| **Hệ thống (System)** | Trong app, tab "Thông báo" | Tự động |
| **Zalo** | Tin nhắn OA Zalo | Cần liên kết Zalo |
| **Telegram** | Tin nhắn bot Telegram | Cần cung cấp Chat ID |
| **Email** | Email đến hộp thư | Tự động (dùng email đăng ký) |

### 10.2. Khi nào nhận thông báo?

- Khi đơn hàng **chuyển trạng thái** (ví dụ: từ "Chờ mua" → "Đã mua")
- Khi có **ghi chú mới** từ nhân viên
- Khi nạp tiền được **xác nhận**
- Khi khiếu nại được **cập nhật**

### 10.3. Quản lý thông báo

Truy cập **"Thông báo"** từ menu trái:
- Xem danh sách tất cả thông báo
- Thông báo chưa đọc hiển thị nổi bật
- Nhấn vào thông báo → chuyển đến đơn hàng liên quan
- Đánh dấu đã đọc

---

## 11. Liên kết Zalo / Telegram

### 11.1. Liên kết Zalo

**Tại sao nên liên kết?** Nhận thông báo cập nhật trạng thái đơn hàng **ngay lập tức** qua Zalo — tiện hơn nhiều so với mở website kiểm tra.

**Cách liên kết:**
1. Từ Dashboard hoặc trang chi tiết đơn, bạn sẽ thấy banner **"Nhận thông báo Zalo tự động"**
2. Sao chép **mã đơn hàng** (nút "Sao chép mã đơn")
3. Gửi mã đơn đến **Zalo OA** của Bắc Trung Hải Logistics
4. Hệ thống tự động liên kết tài khoản Zalo của bạn
5. Sau khi liên kết thành công, hiển thị ✅ **"Zalo đã liên kết"**

### 11.2. Liên kết Telegram

1. Truy cập **"Hồ sơ"** (Profile)
2. Nhập **Telegram Chat ID** của bạn
3. Nhấn "Lưu"

> **Cách lấy Telegram Chat ID:**
> 1. Mở Telegram
> 2. Tìm bot `@userinfobot`
> 3. Gửi tin nhắn bất kỳ → bot sẽ trả về Chat ID của bạn

---

## 12. Gửi khiếu nại / Yêu cầu hỗ trợ

### 12.1. Từ trang chi tiết đơn hàng

1. Mở chi tiết đơn hàng cần khiếu nại
2. Kéo xuống cuối trang
3. Nhấn **"Gửi khiếu nại / Yêu cầu hỗ trợ"**
4. Chọn **Loại vấn đề** (Thiếu hàng, Giao chậm, Sai cân, Hỏng hàng…)
5. Nhập **Mô tả chi tiết** — càng chi tiết càng dễ xử lý
6. Nhấn **"Gửi khiếu nại"**

### 12.2. Từ trang Khiếu nại

Truy cập **"Khiếu nại"** từ menu trái:
- Xem danh sách tất cả khiếu nại đã gửi
- Trạng thái: MỚI → ĐANG XỬ LÝ → ĐÃ GIẢI QUYẾT
- Xem phản hồi từ nhân viên

> **Mẹo:** Khi gửi khiếu nại, hãy ghi rõ mã đơn, mô tả vấn đề, và kèm ảnh chụp nếu có (ảnh hàng hỏng, ảnh cân nặng khác…). Điều này giúp nhân viên xử lý nhanh hơn.

---

## 13. Hồ sơ cá nhân

Truy cập **"Hồ sơ"** (Profile) từ menu trái.

### Thông tin có thể cập nhật:

| Trường | Mô tả |
|--------|--------|
| Họ tên | Tên hiển thị trên hệ thống |
| Email | Email đăng nhập (không đổi được) |
| Số điện thoại | SĐT để nhân viên liên hệ khi giao hàng |
| Địa chỉ | Địa chỉ nhận hàng mặc định |
| Mật khẩu | Đổi mật khẩu đăng nhập |
| Telegram Chat ID | Để nhận thông báo qua Telegram |

> **Quan trọng:** Cập nhật số điện thoại và địa chỉ chính xác để nhân viên giao hàng liên lạc được với bạn.

---

## 14. Các lỗi thường gặp & Cách xử lý

### 14.1. Đăng nhập

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|------------|-----------|
| "Email hoặc mật khẩu không đúng" | Sai thông tin | Kiểm tra lại email và mật khẩu |
| "Tài khoản bị khóa" | Admin đã khóa tài khoản | Liên hệ nhân viên hỗ trợ |
| Không vào được trang | Mất kết nối | Kiểm tra internet, thử lại |

### 14.2. Đặt đơn

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|------------|-----------|
| "Thiếu trường bắt buộc" | Chưa điền đủ thông tin | Điền tất cả trường có dấu * |
| Giá tính sai | Tỷ giá cập nhật | Tỷ giá thay đổi theo thị trường, giá sẽ tự cập nhật |
| Không tạo được đơn | Lỗi hệ thống | Thử lại sau vài phút hoặc liên hệ hỗ trợ |

### 14.3. Nạp tiền

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|------------|-----------|
| Nạp tiền nhưng ví không tăng | Chưa xác nhận | Kiểm tra trạng thái yêu cầu nạp tiền |
| Yêu cầu bị từ chối | Sai nội dung CK hoặc số tiền | Liên hệ kế toán, cung cấp ảnh chụp CK |
| Chờ xác nhận quá lâu | Kế toán chưa xử lý | Liên hệ hotline hoặc Zalo |

### 14.4. Vận chuyển

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|------------|-----------|
| Đơn "Chờ mua" quá lâu | Hàng hết hoặc chưa xử lý | Gửi ghi chú hoặc khiếu nại |
| Ship về VN chậm | Kẹt biên, tắc xe | Thông thường 3-7 ngày, kiên nhẫn chờ |
| "Đã giao" nhưng chưa nhận | Giao nhầm hoặc lỗi | Gửi khiếu nại "Chưa nhận được hàng" |
| Hàng bị hỏng | Vỡ trong quá trình vận chuyển | Gửi khiếu nại kèm ảnh chụp |

---

## 15. Câu hỏi thường gặp (FAQ)

### Q: Tôi có thể hủy đơn đã đặt không?
**A:** Có thể hủy khi đơn ở trạng thái "Chờ mua" hoặc "Đã mua" (chưa gửi). Sau khi shop TQ đã gửi hàng, không thể hủy.

### Q: Tỷ giá CNY/VND cập nhật khi nào?
**A:** Tỷ giá do Admin cấu hình và có thể thay đổi bất kỳ lúc nào. Tỷ giá áp dụng là tỷ giá **tại thời điểm đặt đơn**.

### Q: Tôi có thể đặt hàng khi ví hết tiền không?
**A:** Hệ thống sẽ ghi nhận khoản nợ. Bạn cần nạp tiền để thanh toán nợ.

### Q: Làm sao biết đơn đang ở đâu?
**A:** Xem chi tiết đơn hàng → Timeline trạng thái cho biết chính xác đơn đang ở bước nào, ai xử lý, lúc nào.

### Q: Phí ship quốc tế tính như thế nào?
**A:** Phí = Cân nặng thực tế (kg) × Đơn giá ship quốc tế/kg. Cân nặng được cập nhật khi kho TQ cân hàng.

### Q: Tôi nhận được thông báo "Hàng đã về kho VN" nhưng chưa ai giao?
**A:** Kho VN cần thời gian quét mã, kiểm tra và sắp xếp giao hàng. Thông thường 1-3 ngày làm việc sau khi về kho.

### Q: Tôi muốn đổi địa chỉ nhận hàng?
**A:** Vào "Hồ sơ" → cập nhật địa chỉ, hoặc ghi chú trong đơn hàng để nhân viên biết.

### Q: Mã vận đơn là gì?
**A:** Mã vận đơn (tracking code) giúp theo dõi hành trình hàng hóa. Có 2 loại:
- **Mã vận đơn Trung Quốc:** Theo dõi hàng trong nội địa TQ
- **Mã vận đơn quốc tế:** Theo dõi hàng từ TQ về VN

### Q: Làm sao liên hệ hỗ trợ nhanh nhất?
**A:** Gửi tin nhắn qua Zalo OA hoặc gửi khiếu nại trên hệ thống. Zalo thường được phản hồi nhanh nhất.

---

## Phụ lục: Vị trí ảnh chụp màn hình

> Các ảnh chụp màn hình minh họa sẽ được bổ sung trong phiên bản tiếp theo.

| # | Màn hình | Tên file gợi ý |
|---|----------|----------------|
| 1 | Trang đăng nhập | `screenshots/login.png` |
| 2 | Dashboard khách hàng | `screenshots/customer-dashboard.png` |
| 3 | Tạo đơn hàng mới | `screenshots/create-order.png` |
| 4 | Danh sách đơn hàng | `screenshots/order-list.png` |
| 5 | Chi tiết đơn hàng + Timeline | `screenshots/order-detail.png` |
| 6 | Ví tiền + QR nạp tiền | `screenshots/wallet-topup.png` |
| 7 | Lịch sử giao dịch | `screenshots/transactions.png` |
| 8 | Thông báo | `screenshots/notifications.png` |
| 9 | Gửi khiếu nại | `screenshots/submit-issue.png` |
| 10 | Hồ sơ cá nhân | `screenshots/profile.png` |
| 11 | Banner liên kết Zalo | `screenshots/zalo-link.png` |
| 12 | Thanh tiến trình đơn hàng | `screenshots/order-progress.png` |

---

> **Cần hỗ trợ thêm?** Liên hệ nhân viên Bắc Trung Hải Logistics qua Zalo OA hoặc gửi khiếu nại trên hệ thống.
>
> Tài liệu này được cập nhật lần cuối: **Tháng 5/2026**
