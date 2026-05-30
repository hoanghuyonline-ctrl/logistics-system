import { NextResponse } from "next/server";

type Platform = "taobao" | "1688" | "tmall";

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
}

// Generate realistic mock items database representing thousands of products
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
    return NextResponse.json({ items: [], total: 0, translated: "" });
  }

  const cleanQuery = query.trim().toLowerCase();
  let translated = "其他货源 (General Items)";
  let category: keyof typeof IMAGES = "general";

  const matchedKey = Object.keys(DICTIONARY).find(key => cleanQuery.includes(key));
  if (matchedKey) {
    translated = DICTIONARY[matchedKey].zh;
    category = DICTIONARY[matchedKey].category;
  } else {
    translated = `${query.trim()} 货源 (Smart Trans)`;
  }

  // Generate 60 high-quality products to support multi-pages
  const totalItems = 60;
  const allItems: ProductItem[] = [];

  for (let i = 1; i <= totalItems; i++) {
    const itemPlatform = i % 3 === 0 ? "taobao" : i % 3 === 1 ? "1688" : "tmall";
    const imgList = IMAGES[category];
    const imageUrl = imgList[(i - 1) % imgList.length];
    const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];
    
    // Custom names for headphones, shoes, clothes or custom
    let titleVi = "";
    let titleZh = "";
    let basePrice = 20;

    if (category === "headphone") {
      titleVi = `[Sản phẩm ${i}] Tai nghe HIFI Chống ồn cao cấp ANC ${i}`;
      titleZh = `[商创款 ${i}] 头戴式主动降噪耳机高音质 HIFI TWS`;
      basePrice = 40 + (i * 5);
    } else if (category === "shoes") {
      titleVi = `[Sản phẩm ${i}] Giày Sneaker Thể Thao Nam Nữ Siêu Nhẹ Mẫu ${i}`;
      titleZh = `[新款 ${i}] 夏季透气运动鞋男女潮流情侣慢跑休闲鞋`;
      basePrice = 30 + (i * 4);
    } else if (category === "clothes") {
      titleVi = `[Sản phẩm ${i}] Áo thun Unisex 100% Cotton Mềm Mịn Style ${i}`;
      titleZh = `[爆款 ${i}] 纯棉宽松圆领短袖t恤潮牌国潮百搭半袖`;
      basePrice = 15 + (i * 2);
    } else {
      titleVi = `[Hàng quét ${i}] ${query} Cao cấp Nhập khẩu Trực tiếp Mẫu ${i}`;
      titleZh = `[新品 ${i}] ${translated} 跨境精品热销优质商品`;
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
      salesCount: `${(i * 1500).toLocaleString("vi-VN")}+`
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
    translated
  });
}
