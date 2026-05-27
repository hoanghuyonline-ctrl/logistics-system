# Sao Lưu & Khôi Phục — BẮC TRUNG HẢI LOGISTICS

**Cập nhật:** PR #152 | **Hệ thống:** https://bactrunghai.vn
**Hotline kỹ thuật:** 0901 234 567

> **🔴 Tài liệu này dành cho người vận hành hệ thống.** Đọc kỹ và làm theo đúng thứ tự khi cần sao lưu hoặc khôi phục.

---

## Mục Lục

1. [Những gì cần sao lưu](#1-những-gì-cần-sao-lưu)
2. [Tần suất sao lưu](#2-tần-suất-sao-lưu)
3. [Sao lưu PostgreSQL](#3-sao-lưu-postgresql)
4. [Khôi phục hệ thống](#4-khôi-phục-hệ-thống)
5. [Khôi phục toàn bộ (Disaster Recovery)](#5-khôi-phục-toàn-bộ-disaster-recovery)
6. [Checklist khẩn cấp](#6-checklist-khẩn-cấp)
7. [Lưu ý an toàn vận hành](#7-lưu-ý-an-toàn-vận-hành)

---

## 1. Những gì cần sao lưu

| Thành phần | Vị trí | Tại sao quan trọng |
|-----------|--------|-------------------|
| **Database PostgreSQL** | Docker container `logistics-postgres` trên port 5433 | Toàn bộ dữ liệu: đơn hàng, khách hàng, ví tiền, giao dịch, tri thức chatbot |
| **Thư mục uploads** | `logistics-system/uploads/` (nếu có) | Ảnh kiện hàng, file đính kèm |
| **File .env** | `logistics-system/.env` hoặc `.env.production` | Cấu hình database, API keys, secrets |
| **PM2 ecosystem config** | `logistics-system/ecosystem.config.js` | Cấu hình chạy production (port, env, log) |
| **Source code (GitHub)** | https://github.com/hoanghuyonline-ctrl/logistics-system | Code đã được quản lý bằng Git — luôn push lên GitHub |

> **⚠️ Lưu ý:** Database là phần **quan trọng nhất**. Mất database = mất toàn bộ dữ liệu khách hàng, đơn hàng, tài chính.

---

## 2. Tần suất sao lưu

### Hàng ngày (bắt buộc)

- [ ] Backup database PostgreSQL
- [ ] Kiểm tra backup file tồn tại và có dung lượng hợp lý

### Hàng tuần

- [ ] Copy backup ra ổ ngoài hoặc cloud storage (Google Drive, OneDrive, v.v.)
- [ ] Kiểm tra dung lượng ổ đĩa server
- [ ] Xóa backup cũ hơn 30 ngày (giữ ít nhất 4 bản tuần)

### Trước mỗi lần deploy

- [ ] Backup database **trước khi** chạy `git pull` hoặc `prisma migrate deploy`
- [ ] Backup file `.env` nếu có thay đổi cấu hình
- [ ] Ghi chú phiên bản hiện tại (commit hash): `git log --oneline -1`

> **🔴 Quan trọng:** **LUÔN backup trước khi deploy.** Nếu deploy lỗi, bạn có thể restore lại ngay.

---

## 3. Sao lưu PostgreSQL

### 3.1 Backup cơ bản

```bash
# Tạo thư mục backup nếu chưa có
mkdir -p backups

# Backup database
docker exec logistics-postgres pg_dump -U postgres logistics_db > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Kiểm tra backup:**

```bash
# Xem dung lượng file backup
dir backups\*.sql
# hoặc trên Linux:
ls -lh backups/*.sql

# File backup tốt thường có dung lượng > 100KB
# Nếu file chỉ có vài KB → backup có thể bị lỗi
```

### 3.2 Quy ước đặt tên file

```
backups/backup_20260514_093000.sql     ← backup hàng ngày
backups/backup_20260514_pre_deploy.sql ← backup trước deploy
backups/backup_20260514_weekly.sql     ← backup tuần
backups/backup_20260514_emergency.sql  ← backup khẩn cấp
```

### 3.3 Backup tự động bằng script

Hệ thống có sẵn 2 script backup trong thư mục `scripts/`:

#### Backup database: `scripts/backup-db.bat`

```cmd
REM Chạy thủ công:
scripts\backup-db.bat

REM Script sẽ tự động:
REM  1. Tạo thư mục backups\postgres\ nếu chưa có
REM  2. Backup database → file postgres-YYYY-MM-DD-HH-mm.sql
REM  3. Kiểm tra file backup có dữ liệu (không rỗng)
REM  4. Xóa backup cũ hơn 7 ngày
REM  5. Hiển thị danh sách backup hiện tại
```

Kết quả backup lưu tại: `backups/postgres/postgres-2026-05-14-09-30.sql`

#### Backup uploads: `scripts/backup-uploads.bat`

```cmd
REM Chạy thủ công:
scripts\backup-uploads.bat

REM Script sẽ tự động:
REM  1. Kiểm tra thư mục uploads có tồn tại và có file không
REM  2. Nén thành file uploads-YYYY-MM-DD-HH-mm.zip
REM  3. Xóa backup uploads cũ hơn 7 ngày
```

Kết quả backup lưu tại: `backups/uploads/uploads-2026-05-14-09-30.zip`

#### An toàn

- Script **không bao giờ ghi đè** file backup đã tồn tại
- File backup rỗng (0 bytes) sẽ bị **xóa tự động** và báo lỗi
- Nếu Docker container không chạy → báo lỗi rõ ràng

#### Cài đặt chạy tự động bằng Windows Task Scheduler

**Cách 1: Dùng script tự động (khuyến nghị)**

```cmd
REM Chạy với quyền Administrator
scripts\setup-daily-backup-task.bat
```

Script sẽ tự động:
- Tạo task `BacTrungHai-Daily-Database-Backup` trong Task Scheduler
- Chạy `backup-db.bat` mỗi ngày lúc **02:00 AM**
- Xóa task cũ nếu đã tồn tại
- Chạy với quyền highest (đảm bảo Docker access)

**Kiểm tra task đã cài:**

```cmd
schtasks /query /tn "BacTrungHai-Daily-Database-Backup"
```

**Chạy backup thủ công (test):**

```cmd
schtasks /run /tn "BacTrungHai-Daily-Database-Backup"
```

**Xóa task:**

```cmd
REM Chạy với quyền Administrator
scripts\remove-daily-backup-task.bat
```

Hoặc xóa bằng lệnh:

```cmd
schtasks /delete /tn "BacTrungHai-Daily-Database-Backup" /f
```

**Nơi lưu backup:**

```
backups\postgres\postgres-YYYY-MM-DD-HH-mm.sql
```

> **⚠️ Lưu ý:** Chỉ giữ lại **7 file backup mới nhất**. File cũ hơn 7 ngày bị xóa tự động mỗi lần backup chạy.

**Cách 2: Cài thủ công qua Task Scheduler UI**

1. Mở **Task Scheduler** (gõ `taskschd.msc` trong Start)
2. Bấm **Create Basic Task...**
3. Đặt tên: `BacTrungHai-Daily-Database-Backup`
4. Trigger: **Daily**, lúc **02:00** sáng
5. Action: **Start a program**
   - Program: `cmd.exe`
   - Arguments: `/c "C:\path\to\logistics-system\scripts\backup-db.bat"`
   - Start in: `C:\path\to\logistics-system`
6. Bấm **Finish**
7. Lặp lại cho `backup-uploads.bat` nếu muốn backup uploads tự động

> **💡 Mẹo:** Thay `C:\path\to\logistics-system` bằng đường dẫn thực tế trên server.

#### Chính sách xoay vòng (rotation)

| Loại backup | Giữ lại | Xóa tự động |
|------------|---------|-------------|
| Database (`.sql`) | 7 ngày gần nhất | Cũ hơn 7 ngày |
| Uploads (`.zip`) | 7 ngày gần nhất | Cũ hơn 7 ngày |

> **⚠️ Lưu ý:** Nên copy backup ra ổ ngoài hoặc cloud mỗi tuần để phòng trường hợp server hỏng.

### 3.4 Backup chỉ dữ liệu (không schema)

```bash
# Chỉ backup data (dùng khi muốn import vào DB có sẵn schema)
docker exec logistics-postgres pg_dump -U postgres --data-only logistics_db > backups/data_only_$(date +%Y%m%d).sql
```

### 3.5 Backup một bảng cụ thể

```bash
# Backup chỉ bảng Order
docker exec logistics-postgres pg_dump -U postgres -t "Order" logistics_db > backups/orders_$(date +%Y%m%d).sql

# Backup chỉ bảng SupportKnowledge
docker exec logistics-postgres pg_dump -U postgres -t "SupportKnowledge" logistics_db > backups/knowledge_$(date +%Y%m%d).sql
```

---

## 4. Khôi phục hệ thống

### 4.1 Khôi phục database

> **🔴 CẢNH BÁO:** Khôi phục database sẽ **ghi đè toàn bộ dữ liệu hiện tại**. Chỉ làm khi thực sự cần thiết.

#### Cách 1: Dùng script tự động (khuyến nghị)

```cmd
REM Chạy không cần tham số — script sẽ liệt kê file backup để chọn:
scripts\restore-db.bat

REM Hoặc chỉ định file backup cụ thể:
scripts\restore-db.bat backups\postgres\postgres-2026-05-16-02-00.sql
```

Script `restore-db.bat` sẽ tự động:
1. Kiểm tra Docker container đang chạy
2. Hiển thị danh sách file backup để chọn (nếu không chỉ định file)
3. Yêu cầu xác nhận trước khi khôi phục (nhập `YES`)
4. Dừng PM2 (`pm2 stop logistics-system`)
5. Xóa database cũ và tạo database mới
6. Khôi phục dữ liệu từ file backup
7. Khởi động lại PM2 (`pm2 restart logistics-system`)

#### Cách 2: Khôi phục thủ công

```bash
# Bước 1: Dừng app trước
pm2 stop logistics-system

# Bước 2: Khôi phục database từ file backup
docker exec -i logistics-postgres psql -U postgres logistics_db < backups/backup_20260514_093000.sql

# Bước 3: Khởi động lại app
pm2 restart logistics-system

# Bước 4: Kiểm tra
pm2 status
pm2 logs logistics-system --lines 20
```

**Nếu restore báo lỗi "database already exists":**

```bash
# Xóa database cũ và tạo lại
docker exec logistics-postgres psql -U postgres -c "DROP DATABASE IF EXISTS logistics_db;"
docker exec logistics-postgres psql -U postgres -c "CREATE DATABASE logistics_db;"

# Sau đó restore lại
docker exec -i logistics-postgres psql -U postgres logistics_db < backups/backup_20260514_093000.sql
```

### 4.2 Khôi phục thư mục uploads

#### Cách 1: Dùng script tự động (khuyến nghị)

```cmd
REM Chạy không cần tham số — script sẽ liệt kê file backup để chọn:
scripts\restore-uploads.bat

REM Hoặc chỉ định file backup cụ thể:
scripts\restore-uploads.bat backups\uploads\uploads-2026-05-16-02-00.zip
```

Script `restore-uploads.bat` sẽ tự động:
1. Hiển thị danh sách file backup `.zip` để chọn (nếu không chỉ định file)
2. Yêu cầu xác nhận trước khi khôi phục (nhập `YES`)
3. Đổi tên thư mục `uploads` hiện tại thành `uploads-old-*` (phòng trường hợp)
4. Giải nén file backup vào thư mục `uploads`

#### Cách 2: Khôi phục thủ công

```bash
# Copy thư mục uploads từ backup
# (giả sử đã backup uploads ra ổ ngoài hoặc cloud)
xcopy /E /I "D:\backup\uploads" "logistics-system\uploads"
# hoặc trên Linux:
cp -r /path/to/backup/uploads/ logistics-system/uploads/
```

### 4.3 Khôi phục file .env

```bash
# Copy file .env từ backup
copy "D:\backup\.env.production" "logistics-system\.env"
# hoặc trên Linux:
cp /path/to/backup/.env logistics-system/.env
```

> **⚠️ Lưu ý:** Sau khi khôi phục `.env`, kiểm tra lại:
> - `DATABASE_URL` đúng port (5433)
> - `NEXTAUTH_URL` đúng domain (https://bactrunghai.vn)
> - `NEXTAUTH_SECRET` khớp với bản đang dùng
> - API keys (Telegram, Zalo, Messenger) còn hoạt động

### 4.4 Khởi động lại ứng dụng

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Build lại app
npm run build

# 3. Restart PM2
pm2 restart logistics-system

# 4. Kiểm tra
pm2 status
pm2 logs logistics-system --lines 20

# 5. Test nhanh: truy cập https://bactrunghai.vn và đăng nhập
```

---

## 5. Khôi phục toàn bộ (Disaster Recovery)

### Tình huống: Server Windows bị hỏng hoàn toàn

Khi máy chủ hỏng (crash, virus, lỗi phần cứng), làm theo thứ tự:

### Bước 1: Chuẩn bị máy chủ mới

```bash
# Cài đặt phần mềm cần thiết
# 1. Node.js 18+ (LTS)
# 2. Docker Desktop
# 3. Git
# 4. PM2: npm install -g pm2
```

### Bước 2: Khởi động PostgreSQL bằng Docker

```bash
docker run -d \
  --name logistics-postgres \
  --restart=always \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=logistics_db \
  -p 5433:5432 \
  postgres:16
```

Đợi 10 giây để PostgreSQL khởi động xong.

### Bước 3: Clone source code

```bash
git clone https://github.com/hoanghuyonline-ctrl/logistics-system.git
cd logistics-system
npm install
```

### Bước 4: Khôi phục file .env

```bash
# Copy file .env từ backup
# Hoặc tạo lại .env với nội dung cần thiết:
#   DATABASE_URL="postgresql://postgres:123456@localhost:5433/logistics_db?schema=public"
#   NEXTAUTH_URL="https://bactrunghai.vn"
#   NEXTAUTH_SECRET="<your-secret>"
#   PORT=3000
#   (+ các API keys khác)
```

### Bước 5: Khôi phục database

```bash
# Restore database từ file backup
docker exec -i logistics-postgres psql -U postgres logistics_db < backups/backup_YYYYMMDD.sql
```

> **⚠️ Lưu ý:** Nếu không có file backup → dữ liệu sẽ mất. Phải tạo database trống:
> ```bash
> npx prisma generate
> npx prisma db push
> npm run seed:knowledge  # nhập lại tri thức chatbot
> ```

### Bước 6: Khôi phục uploads

```bash
# Copy thư mục uploads từ backup (nếu có)
xcopy /E /I "D:\backup\uploads" "uploads"
```

### Bước 7: Build và khởi động

```bash
# Generate Prisma client
npx prisma generate

# Build production
npm run build

# Khởi động PM2
pm2 start ecosystem.config.js

# Lưu PM2 process list (auto-restart sau reboot)
pm2 save
```

### Bước 8: Cấu hình startup tự động

```bash
# Windows
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

### Bước 9: Kiểm tra

```bash
# Kiểm tra PM2
pm2 status

# Kiểm tra app chạy
curl -I http://localhost:3000

# Kiểm tra database kết nối
pm2 logs logistics-system --lines 20

# Test đăng nhập tại https://bactrunghai.vn
```

### Bước 10: Xác nhận hoàn tất

- [ ] App chạy trên PM2
- [ ] Truy cập được https://bactrunghai.vn
- [ ] Đăng nhập thành công (admin + khách)
- [ ] Đơn hàng cũ hiện đúng
- [ ] Ví tiền / công nợ đúng số liệu
- [ ] Chatbot Zalo/Telegram/Messenger hoạt động
- [ ] Thông báo gửi được

---

## 6. Checklist khẩn cấp

### 6.1 App không truy cập được

```
1. Kiểm tra PM2:           pm2 status
2. Nếu stopped:            pm2 restart logistics-system
3. Kiểm tra log lỗi:       pm2 logs logistics-system --err --lines 50
4. Kiểm tra database:      docker ps | grep postgres
5. Nếu DB stopped:         docker start logistics-postgres
                            → đợi 10 giây
                            → pm2 restart logistics-system
6. Kiểm tra domain:        curl -I https://bactrunghai.vn
7. Nếu vẫn lỗi:           → xem log đầy đủ: pm2 logs logistics-system --lines 200
                            → liên hệ kỹ thuật viên
```

### 6.2 Database không kết nối được

```
1. Kiểm tra Docker:        docker ps
2. Nếu container stopped:  docker start logistics-postgres
3. Kiểm tra kết nối:       docker exec logistics-postgres pg_isready -U postgres
4. Nếu container bị xóa:   → tạo lại container (xem mục 5 - Bước 2)
                            → restore database từ backup (xem mục 4.1)
5. Kiểm tra .env:          DATABASE_URL phải có port 5433
```

### 6.3 PM2 dừng hoạt động

```
1. Kiểm tra:               pm2 status
2. Nếu errored:            pm2 restart logistics-system
3. Nếu deleted:            pm2 start ecosystem.config.js
4. Nếu PM2 không có:       npm install -g pm2
                            pm2 start ecosystem.config.js
5. Lưu lại:                pm2 save
```

### 6.4 Git bị lỗi / corruption

```
1. KHÔNG xóa thư mục dự án nếu có dữ liệu uploads
2. Backup uploads trước:   copy uploads sang chỗ khác
3. Clone lại repo:         git clone https://github.com/hoanghuyonline-ctrl/logistics-system.git logistics-system-new
4. Copy uploads về:        copy uploads vào logistics-system-new/uploads/
5. Copy .env:              copy .env vào logistics-system-new/
6. Build và restart:       npm install → npx prisma generate → npm run build → pm2 restart
```

### 6.5 Migration không khớp (schema drift)

```
1. BACKUP DATABASE TRƯỚC:  docker exec logistics-postgres pg_dump -U postgres logistics_db > backups/backup_emergency.sql
2. Thử migrate:            npx prisma migrate deploy
3. Nếu lỗi:               npx prisma db push --accept-data-loss
   ⚠️ CHỈ dùng --accept-data-loss khi đã backup xong
4. Generate client:        npx prisma generate
5. Rebuild:                npm run build
6. Restart:                pm2 restart logistics-system
```

> **🔴 KHÔNG BAO GIỜ** chạy `prisma migrate reset` trên production — lệnh này xóa toàn bộ dữ liệu.

---

## 7. Lưu ý an toàn vận hành

### 7.1 Bảo mật

| Quy tắc | Chi tiết |
|---------|---------|
| **Không commit .env** | File `.env` chứa mật khẩu, API keys — không bao giờ đẩy lên GitHub |
| **Không chia sẻ backup qua chat** | File backup chứa dữ liệu khách hàng — chỉ truyền qua kênh an toàn |
| **Đổi mật khẩu database mặc định** | Mật khẩu `123456` chỉ dùng cho dev. Production nên đổi mật khẩu mạnh |
| **Giới hạn quyền truy cập server** | Chỉ người được phân quyền mới truy cập server |
| **Không chạy lệnh `sudo` tùy tiện** | Chỉ dùng `sudo` khi thật sự cần thiết |

### 7.2 Kiểm tra backup định kỳ

> **💡 Mẹo:** Backup không có giá trị nếu không thể restore. Hãy test restore ít nhất 1 lần/tháng.

**Cách test restore (trên máy dev, KHÔNG làm trên production):**

```bash
# 1. Tạo container PostgreSQL test
docker run -d --name test-postgres -e POSTGRES_PASSWORD=test123 -e POSTGRES_DB=test_db -p 5434:5432 postgres:16

# 2. Đợi 10 giây

# 3. Restore backup vào DB test
docker exec -i test-postgres psql -U postgres test_db < backups/backup_20260514_093000.sql

# 4. Kiểm tra dữ liệu
docker exec test-postgres psql -U postgres test_db -c "SELECT count(*) FROM \"Order\";"
docker exec test-postgres psql -U postgres test_db -c "SELECT count(*) FROM \"User\";"
docker exec test-postgres psql -U postgres test_db -c "SELECT count(*) FROM \"SupportKnowledge\";"

# 5. Nếu query chạy được và có dữ liệu → backup OK

# 6. Xóa container test
docker stop test-postgres && docker rm test-postgres
```

### 7.3 Checklist xác nhận backup hàng ngày

- [ ] File backup có dung lượng hợp lý (> 100KB, hoặc tương đương bản trước)
- [ ] File backup không bị lỗi encoding (mở đầu bằng `--` hoặc `SET`)
- [ ] Ổ đĩa server còn đủ dung lượng (> 5GB trống)
- [ ] Backup cũ hơn 30 ngày đã được dọn dẹp

### 7.4 Danh sách liên hệ khi gặp sự cố

| Vai trò | Liên hệ |
|---------|---------|
| Kỹ thuật viên hệ thống | (ghi tên + SĐT) |
| Admin chính | (ghi tên + SĐT) |
| Quản lý vận hành | (ghi tên + SĐT) |
| Hotline công ty | 0901 234 567 |
| Email hỗ trợ | support@bactrunghai.vn |

> **⚠️ Lưu ý:** Điền thông tin liên hệ thật vào bảng trên trước khi đưa tài liệu vào sử dụng.

---

**Bắc Trung Hải Logistics** — Sao lưu & Khôi phục hệ thống

Hotline: 0901 234 567 | Email: support@bactrunghai.vn | Web: https://bactrunghai.vn
