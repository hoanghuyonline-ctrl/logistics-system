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

  // --- SEED DYNAMIC HOMEPAGE CMS ---
  console.log("Seeding Homepage CMS Sections & Items...");
  const cmsSections = [
    {
      id: 'sec-banner-001',
      sectionType: 'banner',
      label: 'Banner Chính',
      orderIndex: 1,
      isActive: true,
      title: 'BẮC TRUNG HẢI LOGISTICS',
      subtitle: 'Giải pháp vận tải toàn diện, uy tín hàng đầu',
      meta: {
        exchangeRate: 3980,
        buttonText: 'Liên hệ ngay',
        buttonLink: '#contact',
        cardTitle: 'Bắc Trung Hải Logistics',
        cardDesc: 'Vận tải hiệu quả, an toàn tối đa',
        bgImageUrl: ''
      }
    },
    {
      id: 'sec-stats-001',
      sectionType: 'stats',
      label: 'Thống Kê Nổi Bật',
      orderIndex: 2,
      isActive: true,
      title: null,
      subtitle: null,
      meta: { showTrend: false }
    },
    {
      id: 'sec-services-001',
      sectionType: 'services',
      label: 'Dịch Vụ Nổi Bật',
      orderIndex: 3,
      isActive: true,
      title: 'Dịch Vụ Nổi Bật',
      subtitle: 'Hệ thống dịch vụ logistics toàn diện',
      meta: { columns: 4 }
    },
    {
      id: 'sec-about-001',
      sectionType: 'about',
      label: 'Về Chúng Tôi',
      orderIndex: 4,
      isActive: true,
      title: 'Về Chúng Tôi',
      subtitle: 'Đối tác logistics tin cậy của bạn',
      meta: { imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec' }
    },
    {
      id: 'sec-locations-001',
      sectionType: 'locations',
      label: 'Địa Điểm & Kho Bãi',
      orderIndex: 5,
      isActive: true,
      title: 'Hệ Thống Kho Bãi Toàn Quốc',
      subtitle: 'Mạng lưới kho bãi phủ rộng từ Trung Quốc đến Việt Nam',
      meta: null
    },
    {
      id: 'sec-social-001',
      sectionType: 'social',
      label: 'Mạng Xã Hội',
      orderIndex: 6,
      isActive: true,
      title: null,
      subtitle: null,
      meta: { showInFooter: true, showInFloatingCTA: true }
    }
  ];

  for (const sec of cmsSections) {
    await prisma.homepageSection.upsert({
      where: { id: sec.id },
      update: {
        sectionType: sec.sectionType,
        label: sec.label,
        orderIndex: sec.orderIndex,
        isActive: sec.isActive,
        title: sec.title,
        subtitle: sec.subtitle,
        meta: sec.meta as any,
      },
      create: {
        id: sec.id,
        sectionType: sec.sectionType,
        label: sec.label,
        orderIndex: sec.orderIndex,
        isActive: sec.isActive,
        title: sec.title,
        subtitle: sec.subtitle,
        meta: sec.meta as any,
      }
    });
  }

  const cmsItems = [
    // Stats
    { id: 'item-stat-001', sectionId: 'sec-stats-001', label: 'Đơn Hàng Đã Xử Lý', content: 'Tổng đơn hàng thành công', icon: '📦', orderIndex: 1, isActive: true, meta: { value: '10K+', trend: '+15%', trendUp: true } },
    { id: 'item-stat-002', sectionId: 'sec-stats-001', label: 'Tỷ Lệ Giao Thành Công', content: 'Cam kết chất lượng cao nhất', icon: '✅', orderIndex: 2, isActive: true, meta: { value: '99.5%', trend: 'ổn định', trendUp: true } },
    { id: 'item-stat-003', sectionId: 'sec-stats-001', label: 'Thời Gian Vận Chuyển', content: 'Trung bình từ Trung Quốc về Việt Nam', icon: '⚡', orderIndex: 3, isActive: true, meta: { value: '5-7', unit: 'ngày', trendUp: true } },
    { id: 'item-stat-004', sectionId: 'sec-stats-001', label: 'Hỗ Trợ Khách Hàng', content: 'Đội ngũ tư vấn luôn sẵn sàng', icon: '🎧', orderIndex: 4, isActive: true, meta: { value: '24/7', trendUp: true } },
    
    // Services
    { id: 'item-svc-001', sectionId: 'sec-services-001', label: 'Mua Hàng Trung Quốc', content: 'Đặt hàng Taobao, 1688, Tmall trọn gói - phí dịch vụ thấp, thanh toán an toàn', icon: '🛒', orderIndex: 1, isActive: true, meta: { highlight: false, badge: '' } },
    { id: 'item-svc-002', sectionId: 'sec-services-001', label: 'Vận Chuyển Nhanh', content: 'Tuyến Việt - Trung với nhiều cung đường, 5-7 ngày về đến kho Hà Nội', icon: '🚚', orderIndex: 2, isActive: true, meta: { highlight: true, badge: 'Phổ biến' } },
    { id: 'item-svc-003', sectionId: 'sec-services-001', label: 'Kho Bãi Chuyên Nghiệp', content: 'Hệ thống kho Quảng Châu, Nam Ninh, Hà Nội với camera 24/7', icon: '🏭', orderIndex: 3, isActive: true, meta: { highlight: false, badge: '' } },
    { id: 'item-svc-004', sectionId: 'sec-services-001', label: 'Thủ Tục Hải Quan', content: 'Hỗ trợ khai báo hải quan, giấy tờ xuất nhập khẩu chuyên nghiệp', icon: '📋', orderIndex: 4, isActive: true, meta: { highlight: false, badge: '' } },
    
    // Locations
    { id: 'item-loc-001', sectionId: 'sec-locations-001', label: 'Trụ Sở Hà Nội (Văn Phòng Chính)', content: 'Số 123, Đường Láng, Đống Đa, Hà Nội', icon: '🏢', orderIndex: 1, isActive: true, meta: { phone: '0989711888', mapUrl: '', isPrimary: true } },
    { id: 'item-loc-002', sectionId: 'sec-locations-001', label: 'Kho Trung Quốc (Quảng Châu)', content: 'Guangzhou, Guangdong Province, China', icon: '🇨🇳', orderIndex: 2, isActive: true, meta: { phone: '19162296663', mapUrl: '', isPrimary: false } },
    { id: 'item-loc-003', sectionId: 'sec-locations-001', label: 'Văn Phòng Bắc Ninh', content: 'KCN Tiên Sơn, Bắc Ninh', icon: '📍', orderIndex: 3, isActive: true, meta: { phone: null, mapUrl: '', isPrimary: false } },
    { id: 'item-loc-004', sectionId: 'sec-locations-001', label: 'Kho Hà Nội', content: 'Long Biên, Hà Nội', icon: '📦', orderIndex: 4, isActive: true, meta: { phone: null, mapUrl: '', isPrimary: false } },
    
    // Social
    { id: 'item-social-001', sectionId: 'sec-social-001', label: 'Facebook', content: 'Trang Fanpage chính thức', icon: '📘', orderIndex: 1, isActive: true, meta: { platform: 'facebook', url: 'https://facebook.com/bactrunghai' } },
    { id: 'item-social-002', sectionId: 'sec-social-001', label: 'Zalo', content: 'Chat trực tiếp qua Zalo', icon: '💬', orderIndex: 2, isActive: true, meta: { platform: 'zalo', url: 'https://zalo.me/bactrunghai' } },
    { id: 'item-social-003', sectionId: 'sec-social-001', label: 'YouTube', content: 'Kênh video hướng dẫn', icon: '▶️', orderIndex: 3, isActive: true, meta: { platform: 'youtube', url: '' } }
  ];

  for (const item of cmsItems) {
    await prisma.homepageItem.upsert({
      where: { id: item.id },
      update: {
        sectionId: item.sectionId,
        label: item.label,
        content: item.content,
        icon: item.icon,
        orderIndex: item.orderIndex,
        isActive: item.isActive,
        meta: item.meta as any,
      },
      create: {
        id: item.id,
        sectionId: item.sectionId,
        label: item.label,
        content: item.content,
        icon: item.icon,
        orderIndex: item.orderIndex,
        isActive: item.isActive,
        meta: item.meta as any,
      }
    });
  }

  console.log("Seed completed successfully!");
  console.log("Test accounts:");
  console.log("  admin@logistics.vn / admin123");
  console.log("  customer1@gmail.com / pass123");
  console.log("  customer2@gmail.com / pass123");
  console.log("  wh.china@logistics.vn / pass123");
  console.log("  wh.vietnam@logistics.vn / pass123");
  console.log("  accountant@logistics.vn / pass123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
