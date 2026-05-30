import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

// NLP Intent Centroid Vectors for Cosine Similarity modeling
const SEMANTIC_CENTROIDS = {
  fashion: {
    "ao": 1.0, "quan": 1.0, "vay": 1.0, "dam": 1.0, "len": 0.8,
    "giay": 1.0, "dep": 0.9, "sneaker": 1.0, "jeans": 1.0,
    "det": 0.7, "thoi": 0.8, "trang": 0.8, "cotton": 0.8, "khoac": 0.8,
    "jean": 0.9, "hoodie": 1.0, "jacket": 1.0, "skirt": 1.0, "dress": 1.0,
    "tui": 0.7, "xach": 0.7, "vi": 0.6, "quai": 0.6,
    // Pinyin fashion terms
    "yifu": 1.0, "qunzi": 1.0, "chenshan": 1.0, "kuzi": 1.0, "waitao": 0.9,
    "pixie": 0.9, "nvzhuang": 1.0, "nanzhuang": 1.0, "hanfu": 0.8, "mianyi": 0.8
  },
  electronics: {
    "o": 0.8, "cam": 0.8, "dien": 1.0, "bong": 0.7, "den": 0.7,
    "noi": 0.8, "com": 0.8, "tai": 0.9, "nghe": 0.9, "sac": 1.0,
    "pin": 1.0, "bluetooth": 1.0, "quat": 0.9, "may": 0.8, "cong": 0.7,
    "suat": 0.7, "220v": 1.0, "soundbar": 1.0, "loa": 1.0, "wireless": 0.9,
    "cap": 0.8, "cable": 0.8, "charger": 1.0, "led": 0.8, "smart": 0.7,
    // Pinyin electronics terms
    "erji": 1.0, "lanya": 1.0, "chongdian": 1.0, "shouji": 1.0, "diannao": 1.0,
    "dianchi": 1.0, "youxian": 0.9, "wuxian": 1.0, "xiaomi": 1.0, "huawei": 1.0,
    "oppo": 1.0, "vivo": 0.9, "shuma": 0.9, "zhineng": 0.8, "diandong": 0.9
  }
};

// ============================================================
// SONG MÃ DICTIONARY: Vietnamese → Hanzi + Pinyin (Dual-Code)
// ============================================================
const DICTIONARY: Record<string, { zh: string; pinyin: string; category: keyof typeof IMAGES }> = {
  // Vietnamese → Hanzi + Pinyin
  "tai nghe":    { zh: "蓝牙耳机", pinyin: "lányá ěrjī", category: "headphone" },
  "headphone":   { zh: "耳机头戴式", pinyin: "ěrjī tóudàishì", category: "headphone" },
  "loa":         { zh: "蓝牙音箱", pinyin: "lányá yīnxiāng", category: "headphone" },
  "sac":         { zh: "充电器", pinyin: "chōngdiànqì", category: "headphone" },
  "pin":         { zh: "锂电池", pinyin: "lǐ diànchí", category: "headphone" },
  "giay":        { zh: "运动鞋", pinyin: "yùndòngxié", category: "shoes" },
  "giày":        { zh: "时尚板鞋", pinyin: "shíshàng bǎnxié", category: "shoes" },
  "sneaker":     { zh: "潮流运动鞋", pinyin: "cháoliú yùndòngxié", category: "shoes" },
  "shoes":       { zh: "男女鞋", pinyin: "nánnǚxié", category: "shoes" },
  "ao":          { zh: "夏季T恤", pinyin: "xiàjì T-xù", category: "clothes" },
  "áo":          { zh: "潮流短袖", pinyin: "cháoliú duǎnxiù", category: "clothes" },
  "quan":        { zh: "牛仔裤", pinyin: "niúzǎikù", category: "clothes" },
  "quần":        { zh: "长裤子", pinyin: "chángkùzi", category: "clothes" },
  "váy":         { zh: "连衣裙", pinyin: "liányīqún", category: "clothes" },
  "dam":         { zh: "裙子", pinyin: "qúnzi", category: "clothes" },
  "len":         { zh: "毛衣", pinyin: "máoyī", category: "clothes" },
  "hoodie":      { zh: "卫衣连帽", pinyin: "wèiyī liánmào", category: "clothes" },
  "jacket":      { zh: "夹克外套", pinyin: "jiākè wàitào", category: "clothes" },
  "clothes":     { zh: "精品服装", pinyin: "jīngpǐn fúzhuāng", category: "clothes" },
  // Pinyin input → Hanzi output (khách gõ Pinyin thẳng)
  "xiaomi":      { zh: "小米", pinyin: "xiǎomǐ", category: "headphone" },
  "huawei":      { zh: "华为", pinyin: "huáwèi", category: "headphone" },
  "kuajing":     { zh: "跨境", pinyin: "kuàjìng", category: "general" },
  "erji":        { zh: "耳机", pinyin: "ěrjī", category: "headphone" },
  "lanya":       { zh: "蓝牙", pinyin: "lányá", category: "headphone" },
  "yifu":        { zh: "衣服", pinyin: "yīfu", category: "clothes" },
  "qunzi":       { zh: "裙子", pinyin: "qúnzi", category: "clothes" },
  "chenshan":    { zh: "衬衫", pinyin: "chènshān", category: "clothes" },
  "kuzi":        { zh: "裤子", pinyin: "kùzi", category: "clothes" },
  "pixie":       { zh: "皮鞋", pinyin: "píxié", category: "shoes" },
  "chongdian":   { zh: "充电器", pinyin: "chōngdiànqì", category: "headphone" },
  "shouji":      { zh: "手机", pinyin: "shǒujī", category: "headphone" },
  "diannao":     { zh: "电脑", pinyin: "diànnǎo", category: "headphone" },
  "wuxian":      { zh: "无线", pinyin: "wúxiàn", category: "headphone" },
  "zhineng":     { zh: "智能", pinyin: "zhìnéng", category: "headphone" }
};

// ============================================================
// PINYIN DETECTION ENGINE
// Nhận diện chuỗi Latinh Pinyin Trung Quốc thuần túy
// ============================================================
const PINYIN_SIGNATURE_PATTERNS = [
  /\b(xiao|hua|kuai|jing|chan|shen|yang|zhong|guo|pei|lian|yi|fu|qun|chong|dian|shou|wu|zhi|neng|lanya|erji|pixie|yifu|kuzi|chenshan)\b/i
];

function detectInputMode(tokens: string[]): "vietnamese" | "pinyin" | "mixed" {
  const joined = tokens.join(" ");
  const hasPinyin = PINYIN_SIGNATURE_PATTERNS.some(p => p.test(joined));
  // Vietnamese has common diacritical tokens even after stripping
  const hasVietnamese = /\b(tai|nghe|giay|quan|ao|len|sac|pin|loa|dam|may|dien)\b/i.test(joined);

  if (hasPinyin && hasVietnamese) return "mixed";
  if (hasPinyin) return "pinyin";
  return "vietnamese";
}

// Safe Google Sanitization filter to secure search query & results
export function sanitizeData(text: string): boolean {
  const forbiddenPatterns = [
    /cd\s+/i, /git\s+/i, /pm2/i, /xcopy/i, /rmdir/i,
    /npm\s+run/i, /node\s+/i, /npx\s+/i, /rm\s+-rf/i,
    /deploy/i, /powershell/i, /cmd/i, /bash/i, /sudo/i
  ];
  return !forbiddenPatterns.some(p => p.test(text));
}

// Tokenizer & Accent Stripper
function tokenizeAndNormalize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Cosine Similarity
function calculateCosineSimilarity(queryTokens: string[], centroid: Record<string, number>): number {
  const queryFreq: Record<string, number> = {};
  for (const token of queryTokens) queryFreq[token] = (queryFreq[token] || 0) + 1;

  let dot = 0, qMag = 0, cMag = 0;
  const allKeys = new Set([...Object.keys(queryFreq), ...Object.keys(centroid)]);
  for (const key of allKeys) {
    const q = queryFreq[key] || 0;
    const c = centroid[key] || 0;
    dot += q * c; qMag += q * q; cMag += c * c;
  }
  if (qMag === 0 || cMag === 0) return 0;
  return dot / (Math.sqrt(qMag) * Math.sqrt(cMag));
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
  const tokens = tokenizeAndNormalize(cleanQuery);

  // ============================================================
  // BƯỚC 1: PHÁT HIỆN CHẾ ĐỘ NGÔN NGỮ (Vietnamese / Pinyin / Mixed)
  // ============================================================
  const inputMode = detectInputMode(tokens);

  let category: keyof typeof IMAGES = "general";
  let translated = "";
  let hanzi = "";
  let pinyin = "";

  // ============================================================
  // BƯỚC 2: TRA CỨU DICTIONARY SONG MÃ (Hanzi + Pinyin)
  // ============================================================
  const matchedKey = Object.keys(DICTIONARY).find(key => cleanQuery.includes(key));

  if (matchedKey) {
    const entry = DICTIONARY[matchedKey];
    hanzi = entry.zh;
    pinyin = entry.pinyin;
    category = entry.category;
    // Build dual-code translated label for UI display
    translated = `${hanzi} (${pinyin})`;
  } else {
    // ============================================================
    // BƯỚC 3: VECTOR SEARCH NLP FALLBACK CHO TỪ KHÓA TỰ DO
    // ============================================================
    const fashionScore = calculateCosineSimilarity(tokens, SEMANTIC_CENTROIDS.fashion);
    const electronicsScore = calculateCosineSimilarity(tokens, SEMANTIC_CENTROIDS.electronics);

    if (fashionScore > 0.15 || electronicsScore > 0.15) {
      if (fashionScore >= electronicsScore) {
        category = "clothes";
        hanzi = `${query.trim()} 潮流服装`;
        pinyin = "cháoliú fúzhuāng";
      } else {
        category = "headphone";
        hanzi = `${query.trim()} 智能数码`;
        pinyin = "zhìnéng shùmǎ";
      }
    } else {
      category = "general";
      hanzi = `${query.trim()} 优质货源`;
      pinyin = "yōuzhì huòyuán";
    }

    // For Pinyin input, include raw Pinyin in search tag
    if (inputMode === "pinyin") {
      translated = `${query.trim()} → ${hanzi} (${pinyin}) [Pinyin SEO]`;
    } else if (inputMode === "mixed") {
      translated = `${hanzi} (${pinyin}) [Hán tự + Pinyin kết hợp]`;
    } else {
      translated = `${hanzi} (${pinyin})`;
    }
  }

  // ============================================================
  // BƯỚC 4: DYNAMIC FILTERS BASED ON DETECTED CATEGORY
  // ============================================================
  let filters: Array<{ key: string; label: string; options: string[] }> = [];
  if (category === "clothes") {
    filters = [
      { key: "size", label: "Kích cỡ", options: ["S", "M", "L", "XL", "XXL"] },
      { key: "color", label: "Màu sắc", options: ["Đen", "Trắng", "Đỏ", "Xanh", "Xám"] }
    ];
  } else if (category === "headphone") {
    filters = [
      { key: "voltage", label: "Điện áp", options: ["220V", "110V", "Pin sạc"] },
      { key: "type", label: "Tính năng", options: ["Không dây", "Có dây", "Chống ồn"] }
    ];
  }

  // ============================================================
  // BƯỚC 5: GENERATE 300-PRODUCT DEEP CRAWL POOL
  // ============================================================
  const totalItems = 300;
  const allItems: ProductItem[] = [];

  for (let i = 1; i <= totalItems; i++) {
    const itemPlatform: Platform = i % 4 === 0 ? "taobao" : i % 4 === 1 ? "1688" : i % 4 === 2 ? "tmall" : "other";
    const imgList = IMAGES[category];
    const imageUrl = imgList[(i - 1) % imgList.length];
    const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];

    let titleVi = "";
    let titleZh = "";
    let basePrice = 20;
    const attributes: Record<string, string> = {
      inputMode,
      pinyin: pinyin || ""
    };

    if (category === "clothes") {
      const sizes = ["S", "M", "L", "XL", "XXL"];
      const colors = ["Đen", "Trắng", "Đỏ", "Xanh", "Xám"];
      attributes.size = sizes[(i - 1) % sizes.length];
      attributes.color = colors[(i - 1) % colors.length];
      titleVi = `[Hàng sỉ ${i}] Áo thun thời trang ${attributes.color} - Size ${attributes.size}`;
      titleZh = `[男士/女士 ${i}] ${hanzi} 纯色圆领高品质短袖t恤潮牌`;
      basePrice = 15 + (i * 2);
    } else if (category === "shoes") {
      const sizes = ["S", "M", "L", "XL", "XXL"];
      const colors = ["Đen", "Trắng", "Đỏ", "Xanh", "Xám"];
      attributes.size = sizes[(i - 1) % sizes.length];
      attributes.color = colors[(i - 1) % colors.length];
      titleVi = `[Sneaker ${i}] Giày thể thao siêu êm ${attributes.color} - Size ${attributes.size}`;
      titleZh = `[正品夏季 ${i}] ${hanzi} 潮流情侣轻便透气跑步鞋`;
      basePrice = 30 + (i * 4);
    } else if (category === "headphone") {
      const voltages = ["220V", "110V", "Pin sạc"];
      const types = ["Không dây", "Có dây", "Chống ồn"];
      attributes.voltage = voltages[(i - 1) % voltages.length];
      attributes.type = types[(i - 1) % types.length];
      titleVi = `[Đồ điện ${i}] Thiết bị ${attributes.type} tích hợp (${attributes.voltage})`;
      titleZh = `[智能电器 ${i}] ${hanzi} 降噪高性能头戴式无线蓝牙耳机`;
      basePrice = 40 + (i * 5);
    } else {
      const materials = ["Nhựa ABS", "Thép không gỉ", "Gỗ tự nhiên", "Da PU"];
      attributes.material = materials[(i - 1) % materials.length];
      titleVi = `[Nội địa TQ ${i}] ${query} làm từ ${attributes.material}`;
      titleZh = `[新品跨境 ${i}] ${hanzi} (${pinyin}) 环保优质耐用日用百货`;
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

  // Filter by platform
  let filteredItems = allItems.filter(item => item.platform === platform);

  // Apply price & attribute filters
  if (minPrice !== null) filteredItems = filteredItems.filter(item => item.priceCNY >= minPrice);
  if (maxPrice !== null) filteredItems = filteredItems.filter(item => item.priceCNY <= maxPrice);
  if (size) filteredItems = filteredItems.filter(item => item.attributes.size === size);
  if (color) filteredItems = filteredItems.filter(item => item.attributes.color === color);

  // Security sanitization
  filteredItems = filteredItems.filter(
    item => sanitizeData(item.titleVi) && sanitizeData(item.titleZh) && sanitizeData(item.supplier)
  );

  // Paginate
  const startIndex = (page - 1) * limit;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

  return NextResponse.json(
    { items: paginatedItems, total: filteredItems.length, translated, filters },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    }
  );
}
