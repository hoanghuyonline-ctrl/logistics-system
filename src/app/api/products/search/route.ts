import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Platform = "taobao" | "1688" | "tmall" | "other";
type Category = "headphone" | "shoes" | "clothes" | "electronics" | "food" | "furniture" | "beauty" | "general";

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

const IMAGES: Record<Category, string[]> = {
  headphone: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60",
  ],
  clothes: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1585789575655-f9a94ddcb5da?w=500&auto=format&fit=crop&q=60",
  ],
  food: [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1559181567-c3190bfa4614?w=500&auto=format&fit=crop&q=60",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&auto=format&fit=crop&q=60",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format&fit=crop&q=60",
  ],
  general: [
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
  ],
};

const SUPPLIERS = [
  "Cửa hàng Kỹ thuật Số Thâm Quyến", "Xưởng Linh kiện Điện tử Nghĩa Ô",
  "Tổng kho Giày dép Ôn Châu", "Xưởng May Mặc Quảng Châu",
  "Nhà máy Hàng tiêu dùng Chiết Giang", "Tổng kho Hàng xuất khẩu Nghĩa Ô",
  "Tmall Flagship Store Global", "Hãng Giày Thời Trang Phúc Kiến",
  "Cửa hàng Thời trang Triều Châu", "Tmall Flagship Store Electronics",
];

const DICTIONARY: Record<string, { zh: string; pinyin: string; category: Category }> = {
  // Electronics
  "tivi": { zh: "电视机", pinyin: "diànshìjī", category: "electronics" },
  "ti vi": { zh: "液晶电视", pinyin: "yèjīng diànshì", category: "electronics" },
  "tv": { zh: "智能电视", pinyin: "zhìnéng diànshì", category: "electronics" },
  "dieu hoa": { zh: "空调", pinyin: "kōngtiáo", category: "electronics" },
  "điều hòa": { zh: "变频空调", pinyin: "biànpín kōngtiáo", category: "electronics" },
  "may lanh": { zh: "空调", pinyin: "kōngtiáo", category: "electronics" },
  "tu lanh": { zh: "冰箱", pinyin: "bīngxiāng", category: "electronics" },
  "tủ lạnh": { zh: "节能冰箱", pinyin: "jiénéng bīngxiāng", category: "electronics" },
  "may giat": { zh: "洗衣机", pinyin: "xǐyījī", category: "electronics" },
  "may tinh": { zh: "笔记本电脑", pinyin: "bǐjìběn diànnǎo", category: "electronics" },
  "laptop": { zh: "轻薄本电脑", pinyin: "qīngbóběn diànnǎo", category: "electronics" },
  "dien thoai": { zh: "智能手机", pinyin: "zhìnéng shǒujī", category: "electronics" },
  "smartphone": { zh: "旗舰智能手机", pinyin: "qíjiàn zhìnéng shǒujī", category: "electronics" },
  "tai nghe": { zh: "蓝牙耳机", pinyin: "lányá ěrjī", category: "headphone" },
  "tai nghe chup tai": { zh: "头戴式蓝牙耳机", pinyin: "tóudàishì lányá ěrjī", category: "headphone" },
  "tai nghe chụp tai": { zh: "头戴式蓝牙耳机", pinyin: "tóudàishì lányá ěrjī", category: "headphone" },
  "headphone": { zh: "耳机头戴式", pinyin: "ěrjī tóudàishì", category: "headphone" },
  "loa": { zh: "蓝牙音箱", pinyin: "lányá yīnxiāng", category: "headphone" },
  "sac": { zh: "充电器", pinyin: "chōngdiànqì", category: "headphone" },
  "pin": { zh: "锂电池", pinyin: "lǐ diànchí", category: "headphone" },
  // Shoes & Fashion
  "giay": { zh: "运动鞋", pinyin: "yùndòngxié", category: "shoes" },
  "giày": { zh: "时尚板鞋", pinyin: "shíshàng bǎnxié", category: "shoes" },
  "sneaker": { zh: "潮流运动鞋", pinyin: "cháoliú yùndòngxié", category: "shoes" },
  "dep": { zh: "拖鞋凉鞋", pinyin: "tuōxié liángxié", category: "shoes" },
  "ao": { zh: "夏季T恤", pinyin: "xiàjì T-xù", category: "clothes" },
  "áo": { zh: "潮流短袖", pinyin: "cháoliú duǎnxiù", category: "clothes" },
  "quan": { zh: "牛仔裤", pinyin: "niúzǎikù", category: "clothes" },
  "quần": { zh: "长裤子", pinyin: "chángkùzi", category: "clothes" },
  "váy": { zh: "连衣裙", pinyin: "liányīqún", category: "clothes" },
  "dam": { zh: "裙子", pinyin: "qúnzi", category: "clothes" },
  "len": { zh: "毛衣", pinyin: "máoyī", category: "clothes" },
  "hoodie": { zh: "卫衣连帽", pinyin: "wèiyī liánmào", category: "clothes" },
  "jacket": { zh: "夹克外套", pinyin: "jiākè wàitào", category: "clothes" },
  "tui": { zh: "手提包", pinyin: "shǒutíbāo", category: "clothes" },
  // Food & Drink
  "tra": { zh: "茶叶", pinyin: "cháyè", category: "food" },
  "trà": { zh: "高山茶叶", pinyin: "gāoshān cháyè", category: "food" },
  "tra dao": { zh: "蜜桃茶", pinyin: "mìtáo chá", category: "food" },
  "trà đào": { zh: "蜜桃茶", pinyin: "mìtáo chá", category: "food" },
  "tra xanh": { zh: "绿茶", pinyin: "lǜchá", category: "food" },
  "trà xanh": { zh: "茶叶 绿茶", pinyin: "cháyè lǜchá", category: "food" },
  "ca phe": { zh: "咖啡豆", pinyin: "kāfēi dòu", category: "food" },
  "cafe": { zh: "精品咖啡", pinyin: "jīngpǐn kāfēi", category: "food" },
  "banh": { zh: "零食饼干", pinyin: "língshí bǐnggān", category: "food" },
  "keo": { zh: "糖果零食", pinyin: "tángguǒ língshí", category: "food" },
  "nuoc": { zh: "饮料", pinyin: "yǐnliào", category: "food" },
  // Furniture & Home
  "ban": { zh: "办公桌", pinyin: "bàngōngzhuō", category: "furniture" },
  "bàn": { zh: "实木书桌", pinyin: "shímù shūzhuō", category: "furniture" },
  "ghe": { zh: "椅子", pinyin: "yǐzi", category: "furniture" },
  "ghế": { zh: "人体工学椅", pinyin: "réntǐ gōngxué yǐ", category: "furniture" },
  "tu": { zh: "收纳柜", pinyin: "shōunà guì", category: "furniture" },
  "giuong": { zh: "床架", pinyin: "chuángjià", category: "furniture" },
  "sofa": { zh: "沙发", pinyin: "shāfā", category: "furniture" },
  // Beauty & Care
  "kem": { zh: "护肤霜", pinyin: "hùfū shuāng", category: "beauty" },
  "son moi": { zh: "口红唇膏", pinyin: "kǒuhóng chúngāo", category: "beauty" },
  "nuoc hoa": { zh: "香水", pinyin: "xiāngshuǐ", category: "beauty" },
  "my pham": { zh: "美妆护肤", pinyin: "měizhuāng hùfū", category: "beauty" },
  "serum": { zh: "精华液", pinyin: "jīnghuá yè", category: "beauty" },
};

export function sanitizeData(text: string): boolean {
  const forbidden = [
    /cd\s+/i, /git\s+/i, /pm2/i, /xcopy/i, /rmdir/i,
    /npm\s+run/i, /node\s+/i, /npx\s+/i, /rm\s+-rf/i,
    /deploy/i, /powershell/i, /cmd/i, /bash/i, /sudo/i,
  ];
  return !forbidden.some(p => p.test(text));
}

function translateVietnameseToChinese(query: string): { zh: string; category: Category; pinyin: string } {
  const clean = query.trim().toLowerCase();

  // 1. Exact match
  if (DICTIONARY[clean]) {
    return DICTIONARY[clean];
  }

  // 2. Partial key match (longest first)
  const matchedKey = Object.keys(DICTIONARY)
    .sort((a, b) => b.length - a.length)
    .find(key => clean.includes(key));

  if (matchedKey) {
    return DICTIONARY[matchedKey];
  }

  // 3. Simple token heuristics
  if (clean.includes("trà") || clean.includes("tra") || clean.includes("bánh") || clean.includes("kẹo") || clean.includes("đào") || clean.includes("ăn")) {
    return { zh: "健康食品", pinyin: "jiànkāng shípǐn", category: "food" };
  }
  if (clean.includes("tai nghe") || clean.includes("loa") || clean.includes("âm thanh")) {
    return { zh: "智能蓝牙音频", pinyin: "zhìnéng lányá yīnpín", category: "headphone" };
  }
  if (clean.includes("điện thoại") || clean.includes("tivi") || clean.includes("máy tính") || clean.includes("máy")) {
    return { zh: "智能数码家电", pinyin: "zhìnéng shùmǎ jiādiàn", category: "electronics" };
  }
  if (clean.includes("áo") || clean.includes("quần") || clean.includes("váy") || clean.includes("đầm") || clean.includes("vải")) {
    return { zh: "潮流女装男装", pinyin: "cháoliú nǚzhuāng nánzhuāng", category: "clothes" };
  }
  if (clean.includes("giày") || clean.includes("dép") || clean.includes("giay") || clean.includes("dep")) {
    return { zh: "潮流时尚运动鞋", pinyin: "cháoliú shíshàng yùndòngxié", category: "shoes" };
  }
  if (clean.includes("bàn") || clean.includes("ghế") || clean.includes("tủ") || clean.includes("giường") || clean.includes("sofa")) {
    return { zh: "高档实木家具", pinyin: "gāodàng shímù jiājù", category: "furniture" };
  }
  if (clean.includes("son") || clean.includes("kem") || clean.includes("hoa") || clean.includes("mỹ phẩm")) {
    return { zh: "高档护肤化妆品", pinyin: "gāodàng hùfū huàzhuāngpǐn", category: "beauty" };
  }

  return { zh: `${query.trim()} 优质货源`, pinyin: "yōuzhì huòyuán", category: "general" };
}

// Bóc tách link Taobao/1688/Tmall nâng cao
const LINK_REGEX = /https?:\/\/(?:[a-zA-Z0-9-]+\.)*(taobao|1688|tmall)\.com\b[-a-zA-Z0-9@:%_\+.~#?&//=]*/i;

function parseProductLink(query: string): { itemId: string; platform: Platform } | null {
  const match = query.match(LINK_REGEX);
  if (!match) return null;

  const domain = match[1].toLowerCase() as Platform;
  try {
    const url = new URL(match[0]);
    let itemId = url.searchParams.get("id") || url.searchParams.get("itemId") || url.searchParams.get("offerId");

    if (!itemId && domain === "1688") {
      const pathMatch = url.pathname.match(/\/offer\/(\d+)\.html/);
      if (pathMatch) itemId = pathMatch[1];
    }

    if (itemId) {
      return { itemId, platform: domain };
    }
  } catch {}
  return null;
}

function buildProductTitles(
  i: number,
  category: Category,
  query: string,
  hanzi: string,
  pinyin: string
): { titleVi: string; titleZh: string; basePrice: number; attributes: Record<string, string> } {
  const attributes: Record<string, string> = { pinyin };
  let titleVi = "";
  let titleZh = "";
  let basePrice = 25;

  switch (category) {
    case "clothes": {
      const sizes = ["S", "M", "L", "XL", "XXL"];
      const colors = ["Đen", "Trắng", "Đỏ", "Xanh", "Xám"];
      attributes.size = sizes[(i - 1) % sizes.length];
      attributes.color = colors[(i - 1) % colors.length];
      titleVi = `[Hàng sỉ ${i}] ${query} thời trang ${attributes.color} - Size ${attributes.size}`;
      titleZh = `[男女装 ${i}] ${hanzi} 纯色高品质`;
      basePrice = 15 + i * 2;
      break;
    }
    case "shoes": {
      const sizes = ["38", "39", "40", "41", "42", "43"];
      attributes.size = sizes[(i - 1) % sizes.length];
      titleVi = `[Giày ${i}] ${query} êm chân size ${attributes.size}`;
      titleZh = `[正品 ${i}] ${hanzi} 潮流时尚轻便`;
      basePrice = 35 + i * 3;
      break;
    }
    case "electronics": {
      const types = ["32 inch", "43 inch", "55 inch", "65 inch"];
      attributes.type = types[(i - 1) % types.length];
      titleVi = `[Điện tử ${i}] ${query} chính hãng ${attributes.type}`;
      titleZh = `[智能家电 ${i}] ${hanzi} 节能高清`;
      basePrice = 500 + i * 50;
      break;
    }
    case "headphone": {
      const types = ["Không dây", "Có dây", "Chống ồn ANC"];
      attributes.type = types[(i - 1) % types.length];
      titleVi = `[Âm thanh ${i}] ${query} ${attributes.type} chất lượng cao`;
      titleZh = `[数码音频 ${i}] ${hanzi} 降噪高性能`;
      basePrice = 40 + i * 5;
      break;
    }
    case "food": {
      const weights = ["100g", "250g", "500g", "1kg"];
      attributes.weight = weights[(i - 1) % weights.length];
      titleVi = `[Thực phẩm ${i}] ${query} cao cấp ${attributes.weight}`;
      titleZh = `[食品饮料 ${i}] ${hanzi} 精品优质`;
      basePrice = 20 + i * 2;
      break;
    }
    case "furniture": {
      const materials = ["Gỗ tự nhiên", "MDF phủ melamine", "Thép sơn tĩnh điện", "Nhựa ABS"];
      attributes.material = materials[(i - 1) % materials.length];
      titleVi = `[Nội thất ${i}] ${query} ${attributes.material} cao cấp`;
      titleZh = `[家具家居 ${i}] ${hanzi} 实木环保耐用`;
      basePrice = 200 + i * 20;
      break;
    }
    case "beauty": {
      const volumes = ["30ml", "50ml", "100ml", "150ml"];
      attributes.volume = volumes[(i - 1) % volumes.length];
      titleVi = `[Làm đẹp ${i}] ${query} chính hãng ${attributes.volume}`;
      titleZh = `[美妆护肤 ${i}] ${hanzi} 高端护肤精华`;
      basePrice = 60 + i * 8;
      break;
    }
    default: {
      const materials = ["Nhựa ABS", "Thép không gỉ", "Gỗ tự nhiên", "Da PU"];
      attributes.material = materials[(i - 1) % materials.length];
      titleVi = `[Nội địa TQ ${i}] ${query} chất liệu ${attributes.material}`;
      titleZh = `[新品跨境 ${i}] ${hanzi} (${pinyin}) 环保优质耐用`;
      basePrice = 25 + i * 3;
    }
  }

  return { titleVi, titleZh, basePrice, attributes };
}

// ── GET: Text & Link & Image URL search ──
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const platform = (searchParams.get("platform") || "taobao") as Platform;
  const sort = searchParams.get("sort") || "default";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const minPrice = searchParams.get("min_price") ? parseFloat(searchParams.get("min_price")!) : null;
  const maxPrice = searchParams.get("max_price") ? parseFloat(searchParams.get("max_price")!) : null;
  const size = searchParams.get("size") || null;
  const color = searchParams.get("color") || null;

  if (!query.trim() || !sanitizeData(query)) {
    return NextResponse.json(
      { items: [], total: 0, translated: "", filters: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  const cleanQuery = query.trim();

  // ── LINK PARSER GATE ──
  const linkInfo = parseProductLink(cleanQuery);
  if (linkInfo) {
    const { itemId, platform: linkPlatform } = linkInfo;
    const titleVi = `[Đích Danh - ${linkPlatform.toUpperCase()}] Sản phẩm nhập khẩu ID: ${itemId}`;
    const titleZh = `[链接解析 - ${linkPlatform.toUpperCase()}] 官方专区同款货源 商品ID: ${itemId}`;
    const imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";

    const singleItem: ProductItem = {
      id: `link-${linkPlatform}-${itemId}`,
      platform: linkPlatform,
      titleVi,
      titleZh,
      priceCNY: 150.0,
      imageUrl,
      supplier: `${linkPlatform.toUpperCase()} Hàng Hãng Official`,
      rating: 5.0,
      salesCount: "10.000+",
      attributes: {
        itemId,
        source: "link-parser",
        isExactMatch: "true"
      }
    };

    return NextResponse.json(
      { items: [singleItem], total: 1, translated: `解析链接 → ${linkPlatform.toUpperCase()} ID: ${itemId}`, filters: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  // ── AUTO-TRANSLATION ──
  const { zh: hanzi, category, pinyin } = translateVietnameseToChinese(cleanQuery);
  const translated = `${cleanQuery} → ${hanzi} (${pinyin})`;

  // Dynamic filters
  let filters: Array<{ key: string; label: string; options: string[] }> = [];
  if (category === "clothes") {
    filters = [
      { key: "size", label: "Kích cỡ", options: ["S", "M", "L", "XL", "XXL"] },
      { key: "color", label: "Màu sắc", options: ["Đen", "Trắng", "Đỏ", "Xanh", "Xám"] },
    ];
  } else if (category === "shoes") {
    filters = [{ key: "size", label: "Cỡ giày", options: ["38", "39", "40", "41", "42", "43"] }];
  } else if (category === "electronics" || category === "headphone") {
    filters = [
      { key: "voltage", label: "Điện áp", options: ["220V", "110V", "Pin sạc"] },
      { key: "type", label: "Tính năng", options: ["Không dây", "Có dây", "Chống ồn"] },
    ];
  }

  // Generate 300 products in category pool
  const allItems: ProductItem[] = [];
  const imgList = IMAGES[category] || IMAGES.general;

  for (let i = 1; i <= 300; i++) {
    const itemPlatform: Platform =
      i % 4 === 0 ? "taobao" : i % 4 === 1 ? "1688" : i % 4 === 2 ? "tmall" : "other";
    const imageUrl = imgList[(i - 1) % imgList.length];
    const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];

    const { titleVi, titleZh, basePrice, attributes } = buildProductTitles(
      i, category, cleanQuery, hanzi, pinyin
    );

    const isAd = i % 7 === 0;
    const finalAttributes = { ...attributes, isAd: isAd ? "true" : "false" };

    allItems.push({
      id: `${category}-${itemPlatform}-${i}`,
      platform: itemPlatform,
      titleVi,
      titleZh,
      priceCNY: basePrice,
      imageUrl,
      supplier: isAd ? `[Tài Trợ] ${supplier}` : supplier,
      rating: parseFloat((4.5 + ((i % 5) / 10)).toFixed(1)),
      salesCount: `${(i * 1200).toLocaleString("vi-VN")}+`,
      attributes: finalAttributes,
    });
  }

  // Filter out paid ads/sponsored listings to keep only organic results matching Taobao/1688 app
  let filtered = allItems.filter(item => item.platform === platform && item.attributes.isAd !== "true");
  if (minPrice !== null) filtered = filtered.filter(i => i.priceCNY >= minPrice);
  if (maxPrice !== null) filtered = filtered.filter(i => i.priceCNY <= maxPrice);
  if (size) filtered = filtered.filter(i => i.attributes.size === size);
  if (color) filtered = filtered.filter(i => i.attributes.color === color);
  filtered = filtered.filter(
    i => sanitizeData(i.titleVi) && sanitizeData(i.titleZh) && sanitizeData(i.supplier)
  );

  // Sort mapping matching Taobao/1688 trend algorithms
  if (sort === "renqi") {
    // Sort by rating (popularity) descending, then sales descending
    filtered = filtered.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      const salesA = parseInt(a.salesCount.replace(/[^\d]/g, "")) || 0;
      const salesB = parseInt(b.salesCount.replace(/[^\d]/g, "")) || 0;
      return salesB - salesA;
    });
  } else if (sort === "sale") {
    // Sort by sales descending
    filtered = filtered.sort((a, b) => {
      const salesA = parseInt(a.salesCount.replace(/[^\d]/g, "")) || 0;
      const salesB = parseInt(b.salesCount.replace(/[^\d]/g, "")) || 0;
      return salesB - salesA;
    });
  } else if (sort === "price_asc") {
    filtered = filtered.sort((a, b) => a.priceCNY - b.priceCNY);
  } else if (sort === "price_desc") {
    filtered = filtered.sort((a, b) => b.priceCNY - a.priceCNY);
  }

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json(
    { items: paginated, total: filtered.length, translated, filters },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}

// ── POST: Image File Search (FormData) ──
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Không tìm thấy file ảnh tải lên." }, { status: 400 });
    }

    // AI Auto-Crop bounding box algorithm simulation
    const bytes = await imageFile.arrayBuffer();
    const imageSize = bytes.byteLength;
    const simulatedW = 1200, simulatedH = 1600;
    const xMin = Math.round(simulatedW * 0.12);
    const yMin = Math.round(simulatedH * 0.15);
    const cropW = Math.round(simulatedW * 0.76);
    const cropH = Math.round(simulatedH * 0.70);

    const fileName = (imageFile.name || "").toLowerCase();
    const mimeType = imageFile.type || "image/jpeg";

    let selectedCategory: Category = "general";
    if (fileName.includes("ao") || fileName.includes("quan") || fileName.includes("vay") || fileName.includes("cloth")) {
      selectedCategory = "clothes";
    } else if (fileName.includes("tivi") || fileName.includes("tv") || fileName.includes("laptop") || fileName.includes("dien")) {
      selectedCategory = "electronics";
    } else if (fileName.includes("tai nghe") || fileName.includes("headphone")) {
      selectedCategory = "headphone";
    } else if (fileName.includes("giay") || fileName.includes("dep") || fileName.includes("shoe")) {
      selectedCategory = "shoes";
    }

    const imagePool = IMAGES[selectedCategory] || IMAGES.general;
    const items: ProductItem[] = [];

    for (let i = 1; i <= 80; i++) {
      const platform: Platform =
        i % 4 === 0 ? "taobao" : i % 4 === 1 ? "1688" : i % 4 === 2 ? "tmall" : "other";
      const imageUrl = imagePool[(i - 1) % imagePool.length];
      const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];

      const titleVi = `[Quét ảnh thông minh ${i}] Sản phẩm đồng dạng chất lượng cao`;
      const titleZh = `[智能图搜 ${i}] 精选热销同款高质货源`;
      const basePrice = 30 + i * 1.5;

      if (sanitizeData(titleVi) && sanitizeData(titleZh) && sanitizeData(supplier)) {
        items.push({
          id: `cropped-img-${platform}-${i}`,
          platform,
          titleVi,
          titleZh,
          priceCNY: basePrice,
          imageUrl,
          supplier,
          rating: parseFloat((4.7 + ((i % 3) / 10)).toFixed(1)),
          salesCount: `${(i * 1250).toLocaleString("vi-VN")}+`,
          attributes: {
            source: "ai-autocrop",
            mime: mimeType,
            cropArea: `${xMin},${yMin},${cropW},${cropH}`,
          },
        });
      }
    }

    return NextResponse.json(
      { items, total: items.length, translated: "以图搜图 (AI Auto-Crop Search)", filters: [] },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err: any) {
    console.error("[image-search] Error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi bóc tách vật thể từ ảnh." }, { status: 500 });
  }
}
