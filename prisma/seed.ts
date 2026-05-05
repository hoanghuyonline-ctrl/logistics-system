import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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

  const accountant = await prisma.user.upsert({
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

  const order1 = await prisma.order.create({
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
      notes: "Please check quality before shipping",
      statusLogs: {
        create: { toStatus: "PENDING", changedBy: customer1.id, note: "Order created" },
      },
    },
  });

  const order2 = await prisma.order.create({
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
          { toStatus: "PENDING", changedBy: customer1.id, note: "Order created" },
          { fromStatus: "PENDING", toStatus: "PURCHASED", changedBy: admin.id, note: "Purchased from seller" },
          { fromStatus: "PURCHASED", toStatus: "SELLER_SHIPPED", changedBy: admin.id, note: "Seller shipped" },
          { fromStatus: "SELLER_SHIPPED", toStatus: "ARRIVED_CHINA_WH", changedBy: whChina.id, note: "Received at China WH" },
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

  const order4 = await prisma.order.create({
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
          { toStatus: "PENDING", changedBy: customer2.id, note: "Order created" },
          { fromStatus: "PENDING", toStatus: "PURCHASED", changedBy: admin.id, note: "Bought from seller" },
        ],
      },
    },
  });

  const order5 = await prisma.order.create({
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

  const order6 = await prisma.order.create({
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
          { toStatus: "PENDING", changedBy: customer2.id, note: "Order created" },
          { fromStatus: "PENDING", toStatus: "CANCELLED", changedBy: admin.id, note: "Customer requested cancellation" },
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
        description: "Initial deposit",
        createdBy: admin.id,
      },
      {
        userId: customer2.id,
        type: "DEPOSIT",
        amount: 30000000,
        balanceBefore: 0,
        balanceAfter: 30000000,
        description: "Initial deposit",
        createdBy: admin.id,
      },
      {
        userId: customer1.id,
        type: "ORDER_PAYMENT",
        amount: -1220825,
        balanceBefore: 50000000,
        balanceAfter: 48779175,
        orderId: order3.id,
        description: `Payment for order ${order3.orderCode}`,
        createdBy: admin.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        title: "Welcome!",
        message: "Welcome to our logistics platform. Start by creating your first order.",
        type: "SYSTEM",
      },
      {
        userId: customer1.id,
        title: `Order ${order3.orderCode} - Completed`,
        message: "Your order has been delivered successfully.",
        type: "SYSTEM",
        orderId: order3.id,
        isRead: true,
      },
      {
        userId: customer2.id,
        title: "Welcome!",
        message: "Welcome to our logistics platform.",
        type: "SYSTEM",
      },
    ],
  });

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
