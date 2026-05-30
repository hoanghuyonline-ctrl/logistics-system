import { NextResponse } from "next/server";

type Platform = "taobao" | "1688" | "tmall" | "other";

interface ProductItem {
  id: string;
  platform: Platform;
  titleVi: string;
  titleZh: string;
  priceCNY: number;
  imageUrl: string;
  supplier: string;
  rating: number;
  salesCount: string;
  attributes: Record<string, string>;
}

const IMAGES = {
  headphone: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60"
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60"
  ],
  clothes: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60"
  ],
  general: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60"
  ]
};

const SUPPLIERS = [
  "Cửa hàng Kỹ thuật Số Thâm Quyến",
  "Xưởng Linh kiện Điện tử Nghĩa Ô",
  "Tổng kho Giày dép Ôn Châu",
  "Xưởng May Mặc Quảng Châu",
  "Nhà máy Hàng tiêu dùng Chiết Giang",
  "Tổng kho Hàng xuất khẩu Nghĩa Ô",
  "Tmall Flagship Store Global",
  "Hãng Giày Thời Trang Phúc Kiến",
  "Cửa hàng Thời trang Triều Châu",
  "Tmall Flagship Store Headset"
];

const DICTIONARY: Record<string, { zh: string, category: keyof typeof IMAGES }> = {
  "tai nghe": { zh: "蓝牙耳机 (Bluetooth Buds)", category: "headphone" },
  "headphone": { zh: "耳机 (Headset)", category: "headphone" },
  "giay": { zh: "运动鞋 (Sneakers)", category: "shoes" },
  "giày": { zh: "时尚板鞋 (Fashion Shoes)", category: "shoes" },
  "shoes": { zh: "男鞋女鞋 (Footwear)", category: "shoes" },
  "ao": { zh: "夏季衣服 (T-Shirt)", category: "clothes" },
  "áo": { zh: "潮流短袖 (Short Sleeve)", category: "clothes" },
  "quan": { zh: "牛仔裤 (Jeans)", category: "clothes" },
  "quần": { zh: "长裤子 (Pants)", category: "clothes" },
  "váy": { zh: "连衣裙 (Dress)", category: "clothes" },
  "clothes": { zh: "精品服装 (Apparel)", category: "clothes" }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const platform = (searchParams.get("platform") || "taobao") as Platform;
  const limit = parseInt(searchParams.get("limit") || "24", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);

  if (!query.trim()) {
    return NextResponse.json({ items: [], total: 0, translated: "", filters: [] });
  }

  const cleanQuery = query.trim().toLowerCase();
  
  // 1. SEMANTIC PARSER - Classify user query category
  let category: keyof typeof IMAGES = "general";
  let translated = "";
  
  // Custom smart keyword checking representing Google semantic system
  const matchedKey = Object.keys(DICTIONARY).find(key => cleanQuery.includes(key));
  if (matchedKey) {
    translated = DICTIONARY[matchedKey].zh;
    category = DICTIONARY[matchedKey].category;
  } else {
    // Check general semantic patterns
    if (/(áo|quần|váy|đầm|t-shirt|jeans|jean|hoodie|jacket)/gi.test(cleanQuery)) {
      category = "clothes";
      translated = `${query.trim()} 潮流服装 (Fashion Wear)`;
    } else if (/(giày|dép|shoes|sneaker|boots)/gi.test(cleanQuery)) {
      category = "shoes";
      translated = `${query.trim()} 优质鞋类 (Premium Shoes)`;
    } else if (/(tai nghe|headphone|bluetooth|loa|speaker|điện tử|cáp|sạc|nồi cơm|bóng đèn|quạt)/gi.test(cleanQuery)) {
      category = "headphone"; // Tech & electric appliances
      translated = `${query.trim()} 数码电器 (Smart Appliances)`;
    } else {
      category = "general";
      translated = `${query.trim()} 优质货源 (Premium Sourcing)`;
    }
  }

  // 2. CONFIGURE DYNAMIC FILTERS BASED ON CATEGORY
  let filters: Array<{ key: string; label: string; options: string[] }> = [];

  if (category === "clothes" || category === "shoes") {
    filters = [
      { key: "size", label: "Kích cỡ", options: category === "shoes" ? ["38", "39", "40", "41", "42"] : ["S", "M", "L", "XL"] },
      { key: "color", label: "Màu sắc", options: ["Đen", "Trắng", "Xám", "Xanh"] }
    ];
  } else if (category === "headphone") {
    filters = [
      { key: "voltage", label: "Điện áp", options: ["220V", "110V", "Pin sạc"] },
      { key: "type", label: "Tính năng", options: ["Không dây", "Có dây", "Chống ồn"] }
    ];
  } else {
    filters = [
      { key: "material", label: "Chất liệu", options: ["Nhựa ABS", "Thép không gỉ", "Gỗ tự nhiên", "Da PU"] }
    ];
  }

  // 3. GENERATE 60 MATCHING ITEMS WITH ATTRIBUTES
  const totalItems = 60;
  const allItems: ProductItem[] = [];

  for (let i = 1; i <= totalItems; i++) {
    const itemPlatform: Platform = i % 4 === 0 ? "taobao" : i % 4 === 1 ? "1688" : i % 4 === 2 ? "tmall" : "other";
    const imgList = IMAGES[category];
    const imageUrl = imgList[(i - 1) % imgList.length];
    const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];
    
    let titleVi = "";
    let titleZh = "";
    let basePrice = 20;
    const attributes: Record<string, string> = {};

    // Populate attributes matching category options
    if (category === "clothes") {
      const sizes = ["S", "M", "L", "XL"];
      const colors = ["Đen", "Trắng", "Xám", "Xanh"];
      attributes.size = sizes[(i - 1) % sizes.length];
      attributes.color = colors[(i - 1) % colors.length];
      titleVi = `[Hàng sỉ ${i}] Áo thun thời trang ${attributes.color} - Size ${attributes.size}`;
      titleZh = `[男士/女士 ${i}] 纯色圆领高品质短袖t恤潮牌`;
      basePrice = 15 + (i * 2);
    } else if (category === "shoes") {
      const sizes = ["38", "39", "40", "41", "42"];
      const colors = ["Đen", "Trắng", "Xám", "Xanh"];
      attributes.size = sizes[(i - 1) % sizes.length];
      attributes.color = colors[(i - 1) % colors.length];
      titleVi = `[Sneaker ${i}] Giày thể thao siêu êm ${attributes.color} - Size ${attributes.size}`;
      titleZh = `[正品夏季 ${i}] 潮流情侣轻便透气跑步鞋休闲网鞋`;
      basePrice = 30 + (i * 4);
    } else if (category === "headphone") {
      const voltages = ["220V", "110V", "Pin sạc"];
      const types = ["Không dây", "Có dây", "Chống ồn"];
      attributes.voltage = voltages[(i - 1) % voltages.length];
      attributes.type = types[(i - 1) % types.length];
      titleVi = `[Đồ điện ${i}] Thiết bị ${attributes.type} tích hợp (${attributes.voltage})`;
      titleZh = `[智能电器 ${i}] 降噪高性能头戴式无线蓝牙耳机`;
      basePrice = 40 + (i * 5);
    } else {
      const materials = ["Nhựa ABS", "Thép không gỉ", "Gỗ tự nhiên", "Da PU"];
      attributes.material = materials[(i - 1) % materials.length];
      titleVi = `[Nội địa TQ ${i}] ${query} làm từ ${attributes.material}`;
      titleZh = `[新品跨境 ${i}] ${translated} 环保优质耐用日用百货`;
      basePrice = 25 + (i * 3);
    }

    allItems.push({
      id: `${category}-${itemPlatform}-${i}`,
      platform: itemPlatform,
      titleVi,
      titleZh,
      priceCNY: basePrice,
      imageUrl,
      supplier,
      rating: parseFloat((4.5 + ((i % 5) / 10)).toFixed(1)),
      salesCount: `${(i * 1200).toLocaleString("vi-VN")}+`,
      attributes
    });
  }

  // Filter based on active platform
  const filteredItems = allItems.filter(item => item.platform === platform);
  
  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return NextResponse.json({
    items: paginatedItems,
    total: filteredItems.length,
    translated,
    filters
  });
}
