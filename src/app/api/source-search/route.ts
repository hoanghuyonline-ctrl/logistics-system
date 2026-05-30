import { NextResponse } from "next/server";

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

// Expanded dual-code dictionary: Vietnamese + Pinyin keywords → Hanzi
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
  // Pinyin direct input
  "xiaomi": { zh: "小米", pinyin: "xiǎomǐ", category: "electronics" },
  "huawei": { zh: "华为", pinyin: "huáwèi", category: "electronics" },
  "diianshi": { zh: "电视", pinyin: "diànshì", category: "electronics" },
  "bingxiang": { zh: "冰箱", pinyin: "bīngxiāng", category: "electronics" },
  "erji": { zh: "耳机", pinyin: "ěrjī", category: "headphone" },
  "lanya": { zh: "蓝牙", pinyin: "lányá", category: "headphone" },
  "yifu": { zh: "衣服", pinyin: "yīfu", category: "clothes" },
  "qunzi": { zh: "裙子", pinyin: "qúnzi", category: "clothes" },
  "pixie": { zh: "皮鞋", pinyin: "píxié", category: "shoes" },
  "chaiye": { zh: "茶叶", pinyin: "cháyè", category: "food" },
};

export function sanitizeData(text: string): boolean {
  const forbidden = [
    /cd\s+/i, /git\s+/i, /pm2/i, /xcopy/i, /rmdir/i,
    /npm\s+run/i, /node\s+/i, /npx\s+/i, /rm\s+-rf/i,
    /deploy/i, /powershell/i, /cmd/i, /bash/i, /sudo/i,
  ];
  return !forbidden.some(p => p.test(text));
}

function tokenizeAndNormalize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Build product titles that reflect the ACTUAL search query
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const platform = (searchParams.get("platform") || "taobao") as Platform;
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

  const cleanQuery = query.trim().toLowerCase();

  // ── STEP 1: Dictionary Lookup (longest match first) ──
  let category: Category = "general";
  let hanzi = "";
  let pinyin = "";
  let translated = "";

  const matchedKey = Object.keys(DICTIONARY)
    .sort((a, b) => b.length - a.length) // longest key first for best match
    .find(key => cleanQuery.includes(key));

  if (matchedKey) {
    const entry = DICTIONARY[matchedKey];
    hanzi = entry.zh;
    pinyin = entry.pinyin;
    category = entry.category;
    translated = `${hanzi} (${pinyin})`;
  } else {
    // ── STEP 2: Fallback – embed query directly in Hanzi search string ──
    hanzi = `${query.trim()} 优质货源`;
    pinyin = "yōuzhì huòyuán";
    translated = `${encodeURIComponent(query.trim())} → ${hanzi} (${pinyin})`;
    category = "general";
  }

  // ── STEP 3: Dynamic filters based on category ──
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

  // ── STEP 4: Generate 300-item dynamic product pool using actual query ──
  const allItems: ProductItem[] = [];
  const imgList = IMAGES[category];

  for (let i = 1; i <= 300; i++) {
    const itemPlatform: Platform =
      i % 4 === 0 ? "taobao" : i % 4 === 1 ? "1688" : i % 4 === 2 ? "tmall" : "other";
    const imageUrl = imgList[(i - 1) % imgList.length];
    const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];

    const { titleVi, titleZh, basePrice, attributes } = buildProductTitles(
      i, category, query.trim(), hanzi, pinyin
    );

    if (!sanitizeData(titleVi) || !sanitizeData(titleZh)) continue;

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
      attributes,
    });
  }

  // ── STEP 5: Filter ──
  let filtered = allItems.filter(item => item.platform === platform);
  if (minPrice !== null) filtered = filtered.filter(i => i.priceCNY >= minPrice);
  if (maxPrice !== null) filtered = filtered.filter(i => i.priceCNY <= maxPrice);
  if (size) filtered = filtered.filter(i => i.attributes.size === size);
  if (color) filtered = filtered.filter(i => i.attributes.color === color);
  filtered = filtered.filter(
    i => sanitizeData(i.titleVi) && sanitizeData(i.titleZh) && sanitizeData(i.supplier)
  );

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
