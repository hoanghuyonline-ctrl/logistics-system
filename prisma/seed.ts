import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { supportKnowledgeEntries } from "./support-knowledge-data";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("pass123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@logistics.vn" },
    update: {},
    create: {
      email: "admin@logistics.vn",
      password: adminPassword,
      fullName: "System Admin",
      phone: "0901234567",
      role: "ADMIN",
      wallet: { create: { balance: 0, debt: 0 } },
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: "customer1@gmail.com" },
    update: {},
    create: {
      email: "customer1@gmail.com",
      password,
      fullName: "Nguyen Van A",
      phone: "0912345678",
      address: "123 Le Loi, District 1, HCMC",
      role: "CUSTOMER",
      wallet: { create: { balance: 50000000, debt: 0 } },
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "customer2@gmail.com" },
    update: {},
    create: {
      email: "customer2@gmail.com",
      password,
      fullName: "Tran Thi B",
      phone: "0923456789",
      address: "456 Nguyen Hue, District 1, HCMC",
      role: "CUSTOMER",
      wallet: { create: { balance: 30000000, debt: 0 } },
    },
  });

  const whChina = await prisma.user.upsert({
    where: { email: "wh.china@logistics.vn" },
    update: {},
    create: {
      email: "wh.china@logistics.vn",
      password,
      fullName: "China Warehouse Staff",
      phone: "13800138000",
      role: "WAREHOUSE_CN",
      wallet: { create: { balance: 0, debt: 0 } },
    },
  });

  const whVietnam = await prisma.user.upsert({
    where: { email: "wh.vietnam@logistics.vn" },
    update: {},
    create: {
      email: "wh.vietnam@logistics.vn",
      password,
      fullName: "Vietnam Warehouse Staff",
      phone: "0934567890",
      role: "WAREHOUSE_VN",
      wallet: { create: { balance: 0, debt: 0 } },
    },
  });

  await prisma.user.upsert({
    where: { email: "accountant@logistics.vn" },
    update: {},
    create: {
      email: "accountant@logistics.vn",
      password,
      fullName: "Le Van C - Accountant",
      phone: "0945678901",
      role: "ACCOUNTANT",
      wallet: { create: { balance: 0, debt: 0 } },
    },
  });

  const configs = [
    { key: "exchange_rate", value: "3500" },
    { key: "service_fee_percent", value: "5" },
    { key: "china_domestic_shipping_default", value: "50000" },
    { key: "international_shipping_rate", value: "35000" },
    { key: "vietnam_delivery_fee_default", value: "30000" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value, updatedBy: admin.id },
    });
  }

  await prisma.order.create({
    data: {
      orderCode: "ORD-20260501-A1B2",
      userId: customer1.id,
      productName: "Xiaomi Redmi Note 13 Pro Case",
      productLink: "https://item.taobao.com/item.htm?id=12345",
      quantity: 5,
      unitPriceCNY: 15,
      totalPriceCNY: 75,
      exchangeRate: 3500,
      totalPriceVND: 262500,
      serviceFeePercent: 5,
      serviceFeeVND: 13125,
      chinaShippingFee: 50000,
      internationalShippingRate: 35000,
      internationalShippingFee: 0,
      vietnamDeliveryFee: 30000,
      totalCostVND: 355625,
      status: "PENDING",
      notes: "Kiểm tra chất lượng trước khi gửi",
      statusLogs: {
        create: { toStatus: "PENDING", changedBy: customer1.id, note: "Đơn hàng đã được tạo" },
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ORD-20260502-C3D4",
      userId: customer1.id,
      productName: "USB-C Hub 7-in-1",
      productLink: "https://detail.1688.com/offer/654321.html",
      quantity: 2,
      unitPriceCNY: 89,
      totalPriceCNY: 178,
      exchangeRate: 3500,
      totalPriceVND: 623000,
      serviceFeePercent: 5,
      serviceFeeVND: 31150,
      chinaShippingFee: 50000,
      weightKg: 0.8,
      internationalShippingRate: 35000,
      internationalShippingFee: 28000,
      vietnamDeliveryFee: 30000,
      totalCostVND: 762150,
      status: "ARRIVED_CHINA_WH",
      trackingCodeChina: "SF1234567890",
      statusLogs: {
        create: [
          { toStatus: "PENDING", changedBy: customer1.id, note: "Đơn hàng đã được tạo" },
          { fromStatus: "PENDING", toStatus: "PURCHASED", changedBy: admin.id, note: "Đã đặt mua từ người bán" },
          { fromStatus: "PURCHASED", toStatus: "SELLER_SHIPPED", changedBy: admin.id, note: "Người bán đã gửi hàng" },
          { fromStatus: "SELLER_SHIPPED", toStatus: "ARRIVED_CHINA_WH", changedBy: whChina.id, note: "Đã nhận tại kho Trung Quốc" },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderCode: "ORD-20260503-E5F6",
      userId: customer1.id,
      productName: "Mechanical Keyboard Keychron K2",
      productLink: "https://item.taobao.com/item.htm?id=789012",
      quantity: 1,
      unitPriceCNY: 299,
      totalPriceCNY: 299,
      exchangeRate: 3500,
      totalPriceVND: 1046500,
      serviceFeePercent: 5,
      serviceFeeVND: 52325,
      chinaShippingFee: 50000,
      weightKg: 1.2,
      internationalShippingRate: 35000,
      internationalShippingFee: 42000,
      vietnamDeliveryFee: 30000,
      totalCostVND: 1220825,
      status: "COMPLETED",
      trackingCodeChina: "YT9876543210",
      trackingCodeIntl: "VN-INTL-001",
      statusLogs: {
        create: [
          { toStatus: "PENDING", changedBy: customer1.id },
          { fromStatus: "PENDING", toStatus: "PURCHASED", changedBy: admin.id },
          { fromStatus: "PURCHASED", toStatus: "SELLER_SHIPPED", changedBy: admin.id },
          { fromStatus: "SELLER_SHIPPED", toStatus: "ARRIVED_CHINA_WH", changedBy: whChina.id },
          { fromStatus: "ARRIVED_CHINA_WH", toStatus: "PACKING", changedBy: whChina.id },
          { fromStatus: "PACKING", toStatus: "SHIPPING_TO_VIETNAM", changedBy: admin.id },
          { fromStatus: "SHIPPING_TO_VIETNAM", toStatus: "ARRIVED_VIETNAM_WH", changedBy: whVietnam.id },
          { fromStatus: "ARRIVED_VIETNAM_WH", toStatus: "OUT_FOR_DELIVERY", changedBy: whVietnam.id },
          { fromStatus: "OUT_FOR_DELIVERY", toStatus: "COMPLETED", changedBy: whVietnam.id },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ORD-20260504-G7H8",
      userId: customer2.id,
      productName: "Wireless Earbuds TWS",
      productLink: "https://detail.1688.com/offer/111222.html",
      quantity: 10,
      unitPriceCNY: 25,
      totalPriceCNY: 250,
      exchangeRate: 3500,
      totalPriceVND: 875000,
      serviceFeePercent: 5,
      serviceFeeVND: 43750,
      chinaShippingFee: 50000,
      internationalShippingRate: 35000,
      internationalShippingFee: 0,
      vietnamDeliveryFee: 30000,
      totalCostVND: 998750,
      status: "PURCHASED",
      statusLogs: {
        create: [
          { toStatus: "PENDING", changedBy: customer2.id, note: "Đơn hàng đã được tạo" },
          { fromStatus: "PENDING", toStatus: "PURCHASED", changedBy: admin.id, note: "Đã đặt mua từ người bán" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ORD-20260504-I9J0",
      userId: customer2.id,
      productName: "Silicone Kitchen Utensil Set",
      productLink: "https://item.taobao.com/item.htm?id=333444",
      quantity: 3,
      unitPriceCNY: 45,
      totalPriceCNY: 135,
      exchangeRate: 3500,
      totalPriceVND: 472500,
      serviceFeePercent: 5,
      serviceFeeVND: 23625,
      chinaShippingFee: 50000,
      weightKg: 2.5,
      internationalShippingRate: 35000,
      internationalShippingFee: 87500,
      vietnamDeliveryFee: 30000,
      totalCostVND: 663625,
      status: "SHIPPING_TO_VIETNAM",
      trackingCodeChina: "ZT1122334455",
      trackingCodeIntl: "VN-INTL-002",
      statusLogs: {
        create: [
          { toStatus: "PENDING", changedBy: customer2.id },
          { fromStatus: "PENDING", toStatus: "PURCHASED", changedBy: admin.id },
          { fromStatus: "PURCHASED", toStatus: "SELLER_SHIPPED", changedBy: admin.id },
          { fromStatus: "SELLER_SHIPPED", toStatus: "ARRIVED_CHINA_WH", changedBy: whChina.id },
          { fromStatus: "ARRIVED_CHINA_WH", toStatus: "PACKING", changedBy: whChina.id },
          { fromStatus: "PACKING", toStatus: "SHIPPING_TO_VIETNAM", changedBy: admin.id },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      orderCode: "ORD-20260505-K1L2",
      userId: customer2.id,
      productName: "LED Desk Lamp Adjustable",
      productLink: "https://detail.1688.com/offer/555666.html",
      quantity: 2,
      unitPriceCNY: 68,
      totalPriceCNY: 136,
      exchangeRate: 3500,
      totalPriceVND: 476000,
      serviceFeePercent: 5,
      serviceFeeVND: 23800,
      chinaShippingFee: 50000,
      internationalShippingRate: 35000,
      internationalShippingFee: 0,
      vietnamDeliveryFee: 30000,
      totalCostVND: 579800,
      status: "CANCELLED",
      statusLogs: {
        create: [
          { toStatus: "PENDING", changedBy: customer2.id, note: "Đơn hàng đã được tạo" },
          { fromStatus: "PENDING", toStatus: "CANCELLED", changedBy: admin.id, note: "Khách yêu cầu huỷ đơn" },
        ],
      },
    },
  });

  const pkg = await prisma.package.create({
    data: {
      packageCode: "PKG-20260503-X1Y2",
      barcode: "BC-PKG-20260503-X1Y2",
      totalWeightKg: 2.0,
      lengthCm: 40,
      widthCm: 30,
      heightCm: 20,
      status: "DELIVERED",
      createdBy: whChina.id,
    },
  });

  await prisma.order.update({
    where: { id: order3.id },
    data: { packageId: pkg.id },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: customer1.id,
        type: "DEPOSIT",
        amount: 50000000,
        balanceBefore: 0,
        balanceAfter: 50000000,
        description: "Nạp tiền lần đầu",
        createdBy: admin.id,
      },
      {
        userId: customer2.id,
        type: "DEPOSIT",
        amount: 30000000,
        balanceBefore: 0,
        balanceAfter: 30000000,
        description: "Nạp tiền lần đầu",
        createdBy: admin.id,
      },
      {
        userId: customer1.id,
        type: "ORDER_PAYMENT",
        amount: -1220825,
        balanceBefore: 50000000,
        balanceAfter: 48779175,
        orderId: order3.id,
        description: `Thanh toán đơn hàng ${order3.orderCode}`,
        createdBy: admin.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        title: "Chào mừng bạn!",
        message: "Chào mừng bạn đến với Bắc Trung Hải Logistics. Hãy tạo đơn hàng đầu tiên nhé!",
        type: "SYSTEM",
      },
      {
        userId: customer1.id,
        title: `Đơn ${order3.orderCode} — Đã giao thành công`,
        message: "Đơn hàng của bạn đã được giao thành công.",
        type: "SYSTEM",
        orderId: order3.id,
        isRead: true,
      },
      {
        userId: customer2.id,
        title: "Chào mừng bạn!",
        message: "Chào mừng bạn đến với Bắc Trung Hải Logistics.",
        type: "SYSTEM",
      },
    ],
  });

  // Support knowledge base — 123 real Vietnamese entries from external data file
  const existingCount = await prisma.supportKnowledge.count();
  if (existingCount === 0) {
    for (const entry of supportKnowledgeEntries) {
      await prisma.supportKnowledge.create({ data: entry });
    }
  }

  // ── Seed Homepage CMS sections ──────────────────────────────────────────
  await seedHomepageCms(prisma, admin.id);

  console.log("Seed completed successfully!");
  console.log("Test accounts:");
  console.log("  admin@logistics.vn / admin123");
  console.log("  customer1@gmail.com / pass123");
  console.log("  customer2@gmail.com / pass123");
  console.log("  wh.china@logistics.vn / pass123");
  console.log("  wh.vietnam@logistics.vn / pass123");
  console.log("  accountant@logistics.vn / pass123");
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed dữ liệu mặc định cho Dynamic CMS trang chủ.
// Dùng upsert theo id → chạy lại nhiều lần vẫn an toàn (idempotent).
// ─────────────────────────────────────────────────────────────────────────────
async function seedHomepageCms(prisma: PrismaClient, _adminId: string) {
  console.log("  → Seeding homepage CMS sections...");

  // ── 1. Banner chính ───────────────────────────────────────────────────────
  await prisma.homepageSection.upsert({
    where: { id: "sec-banner-001" },
    update: {},
    create: {
      id: "sec-banner-001",
      sectionType: "banner",
      label: "Banner Chính",
      orderIndex: 1,
      isActive: true,
      title: "BẮC TRUNG HẢI LOGISTICS",
      subtitle: "Giải pháp vận tải toàn diện, uy tín hàng đầu",
      meta: {
        exchangeRate: 3980,
        buttonText: "Liên hệ ngay",
        buttonLink: "#contact",
        cardTitle: "Bắc Trung Hải Logistics",
        cardDesc: "Vận tải hiệu quả, an toàn tối đa",
        bgImageUrl: "",
      },
    },
  });

  // ── 2. Thống kê ────────────────────────────────────────────────────────────
  const statsSection = await prisma.homepageSection.upsert({
    where: { id: "sec-stats-001" },
    update: {},
    create: {
      id: "sec-stats-001",
      sectionType: "stats",
      label: "Thống Kê Nổi Bật",
      orderIndex: 2,
      isActive: true,
      title: null,
      subtitle: null,
      meta: { showTrend: true },
    },
  });

  const statsItems = [
    { id: "item-stat-001", label: "Đơn Hàng Đã Xử Lý",     content: "Tổng đơn hàng thành công",              icon: "📦", orderIndex: 1, meta: { value: "10K+",  trend: "+15%",   trendUp: true  } },
    { id: "item-stat-002", label: "Tỷ Lệ Giao Thành Công",  content: "Cam kết chất lượng cao nhất",           icon: "✅", orderIndex: 2, meta: { value: "99.5%", trend: "ổn định", trendUp: true  } },
    { id: "item-stat-003", label: "Thời Gian Vận Chuyển",   content: "Trung bình từ Trung Quốc về Việt Nam",  icon: "⚡", orderIndex: 3, meta: { value: "5-7",   unit: "ngày",    trendUp: true  } },
    { id: "item-stat-004", label: "Hỗ Trợ Khách Hàng",     content: "Đội ngũ tư vấn luôn sẵn sàng",         icon: "🎧", orderIndex: 4, meta: { value: "24/7",  trendUp: true  } },
  ];
  for (const item of statsItems) {
    await prisma.homepageItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, sectionId: statsSection.id, isActive: true },
    });
  }

  // ── 3. Lý do chọn chúng tôi ────────────────────────────────────────────────
  const whySection = await prisma.homepageSection.upsert({
    where: { id: "sec-why-001" },
    update: {},
    create: {
      id: "sec-why-001",
      sectionType: "why_choose_us",
      label: "Lý Do Chọn Chúng Tôi",
      orderIndex: 3,
      isActive: true,
      title: "Tại Sao Chọn Bắc Trung Hải?",
      subtitle: "Chúng tôi cam kết mang lại sự an tâm tuyệt đối cho từng lô hàng",
      meta: null,
    },
  });

  const whyItems = [
    { id: "item-why-001", label: "Kho Trung Quốc Chính Hãng",    content: "Kho tại Quảng Châu & Nam Ninh, camera 24/7, nhận hàng trực tiếp từ xưởng",       icon: "🏭", orderIndex: 1, meta: { color: "blue"    } },
    { id: "item-why-002", label: "Theo Dõi Realtime",             content: "Cập nhật trạng thái từng kiện hàng theo thời gian thực qua hệ thống online",      icon: "📡", orderIndex: 2, meta: { color: "emerald" } },
    { id: "item-why-003", label: "Tư Vấn Người Việt",             content: "Đội ngũ nhân viên Việt Nam thông thạo tiếng Trung, hỗ trợ trực tiếp tại địa phương", icon: "🤝", orderIndex: 3, meta: { color: "amber"   } },
    { id: "item-why-004", label: "Thông Báo Zalo & Telegram",     content: "Tự động gửi cập nhật vận chuyển qua Zalo và Telegram, không bỏ sót thông tin",   icon: "🔔", orderIndex: 4, meta: { color: "purple"  } },
  ];
  for (const item of whyItems) {
    await prisma.homepageItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, sectionId: whySection.id, isActive: true },
    });
  }

  // ── 4. Dịch vụ nổi bật ────────────────────────────────────────────────────
  const servicesSection = await prisma.homepageSection.upsert({
    where: { id: "sec-services-001" },
    update: {},
    create: {
      id: "sec-services-001",
      sectionType: "services",
      label: "Dịch Vụ Nổi Bật",
      orderIndex: 4,
      isActive: true,
      title: "Năng Lực Đóng Gói Logistics",
      subtitle: "Hệ thống cơ sở hạ tầng bền vững đáp ứng mọi yêu cầu nghiêm ngặt nhất",
      meta: { columns: 4 },
    },
  });

  const serviceItems = [
    { id: "item-svc-001", label: "Vận Tải Nội Địa Bắc–Trung–Nam",  content: "Hệ thống xe tải, container trung chuyển liên tỉnh kết nối chặt chẽ, luân chuyển hàng hóa thần tốc qua các dải vùng miền cả nước.", icon: "🚚", orderIndex: 1, meta: { highlight: false, badge: ""         } },
    { id: "item-svc-002", label: "Dịch Vụ Bến Bãi & Lưu Kho",      content: "Tổng kho diện tích lớn tại Trung Quốc (Nam Ninh) và Việt Nam (Lạng Sơn, Hà Nội, Bắc Ninh) được camera an ninh giám sát 24/7.", icon: "🏭", orderIndex: 2, meta: { highlight: true,  badge: "Phổ biến" } },
    { id: "item-svc-003", label: "Thông Quan Hải Quan",             content: "Xử lý trọn gói thủ tục thông quan chính ngạch, hóa đơn VAT đầy đủ, kê khai thuế và ủy thác xuất nhập khẩu an toàn.", icon: "📋", orderIndex: 3, meta: { highlight: false, badge: ""         } },
    { id: "item-svc-004", label: "Thương Mại Quốc Tế",              content: "Mua hàng Taobao, 1688, Tmall trọn gói với tỷ giá minh bạch. Thanh toán an toàn, theo dõi đơn từng bước.",                  icon: "🌐", orderIndex: 4, meta: { highlight: false, badge: "Mới"     } },
  ];
  for (const item of serviceItems) {
    await prisma.homepageItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, sectionId: servicesSection.id, isActive: true },
    });
  }

  // ── 5. Địa điểm & kho bãi ─────────────────────────────────────────────────
  const locationsSection = await prisma.homepageSection.upsert({
    where: { id: "sec-locations-001" },
    update: {},
    create: {
      id: "sec-locations-001",
      sectionType: "locations",
      label: "Địa Điểm & Kho Bãi",
      orderIndex: 5,
      isActive: true,
      title: "Hệ Thống Kho Bãi Toàn Quốc",
      subtitle: "Mạng lưới kho bãi phủ rộng từ Trung Quốc đến Việt Nam, phục vụ nhanh mọi tỉnh thành",
      meta: null,
    },
  });

  const locationItems = [
    { id: "item-loc-001", label: "Trụ Sở Hà Nội (Văn Phòng Chính)", content: "Số 123, Đường Láng, Đống Đa, Hà Nội",         icon: "🏢", orderIndex: 1, meta: { phone: "0989711888",  isPrimary: true,  mapUrl: "" } },
    { id: "item-loc-002", label: "Kho Trung Quốc (Quảng Châu)",     content: "Guangzhou, Guangdong Province, China",        icon: "🇨🇳", orderIndex: 2, meta: { phone: "19162296663", isPrimary: false, mapUrl: "" } },
    { id: "item-loc-003", label: "Văn Phòng Bắc Ninh",              content: "KCN Tiên Sơn, Bắc Ninh",                     icon: "📍", orderIndex: 3, meta: { phone: null,          isPrimary: false, mapUrl: "" } },
    { id: "item-loc-004", label: "Kho Hà Nội (Long Biên)",          content: "Long Biên, Hà Nội",                          icon: "📦", orderIndex: 4, meta: { phone: null,          isPrimary: false, mapUrl: "" } },
  ];
  for (const item of locationItems) {
    await prisma.homepageItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, sectionId: locationsSection.id, isActive: true },
    });
  }

  console.log("  ✓ Homepage CMS seeded: 5 sections, 16 items");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

