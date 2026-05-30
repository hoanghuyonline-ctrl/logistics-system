import { prisma } from "@/lib/prisma";

interface KnowledgeMatch {
  id: string;
  title: string;
  content: string;
  keywords: string | null;
  score: number;
  matchSource: "keywords" | "title" | "category" | "content";
}

const MAX_REPLY_LENGTH = 1000; // Increased to fully accommodate brand scripting and premium lead offers

const CHANNEL_COUNT_FIELD: Record<string, string> = {
  ZALO: "matchCountZalo",
  TELEGRAM: "matchCountTelegram",
  MESSENGER: "matchCountMessenger",
};

export interface SemanticIntent {
  tag: "CRISIS_LOST_GOODS" | "CRISIS_DELAY" | "CRISIS_HIGH_FEE" | "GENERAL";
  keywords: string[];
}

export const SEMANTIC_INTENTS: SemanticIntent[] = [
  {
    tag: "CRISIS_LOST_GOODS",
    keywords: ["mất", "thất lạc", "hỏng", "vỡ", "đền", "bồi thường", "thất thoát", "thiếu hàng", "đền bù", "đổ vỡ", "nát", "móp", "hư hại", "hư hỏng", "mất mát"],
  },
  {
    tag: "CRISIS_DELAY",
    keywords: ["trễ", "chậm", "tắc", "kẹt", "tắc biên", "kẹt biên", "lâu", "bao giờ về", "chậm trễ", "thông biên", "thông quan", "delay", "tắc đường", "biên giới", "thông xe"],
  },
  {
    tag: "CRISIS_HIGH_FEE",
    keywords: ["cước", "đắt", "giá cao", "phí cao", "chính ngạch", "báo giá", "tính phí", "chi phí", "bao nhiêu tiền", "bảng giá", "giá cả", "giá đắt", "phí dịch vụ"],
  },
];

export function generateAIAnswer(query: string, matchedTitle: string, matchedContent: string): string {
  const normalizedQuery = query.toLowerCase();
  
  const isLostGoods = SEMANTIC_INTENTS[0].keywords.some(k => normalizedQuery.includes(k));
  const isDelay = SEMANTIC_INTENTS[1].keywords.some(k => normalizedQuery.includes(k));
  const isHighFee = SEMANTIC_INTENTS[2].keywords.some(k => normalizedQuery.includes(k));

  let header = "🤖 [AI Tổng Đài Viên - Bắc Trung Hải Logistics] ";
  let cskhBody = matchedContent;
  
  // Universal bait hooks that compel the user to type their PHONE NUMBER or ZALO NUMBER
  let cta = "\n\n🎁 QUÀ TẶNG CHÀO MỪNG ĐẶC BIỆT từ bactrunghai.vn:\n" +
            "Nhân dịp nâng cấp hệ thống AI, Bắc Trung Hải Logistics xin gửi tặng Quý khách mã VOUCHER GIẢM 10% TỔNG CƯỚC cho đơn hàng đầu tiên, cam kết GIỮ SLOT XE ƯU TIÊN ĐI NHANH nhất tuần và TẶNG KÈM trọn bộ tài liệu 'Danh sách 1000+ nguồn hàng Quảng Châu hot trend tận gốc'.\n\n" +
            "👉 Quý khách hãy cung cấp ngay SỐ ĐIỆN THOẠI hoặc SỐ ZALO của mình tại đây. Hệ thống sẽ tự động gửi quà tặng đặc quyền và chuyên viên Bắc Trung Hải sẽ liên hệ hỗ trợ giữ slot ưu đãi cho Quý khách lập tức!";

  if (isLostGoods) {
    header = "🤖 [AI CSKH Bắc Trung Hải - Cam kết đền bù 100%] ";
    cskhBody = "Bắc Trung Hải Logistics xin gửi lời xin lỗi chân thành sâu sắc nhất tới quý khách về sự cố phát sinh ngoài ý muốn này. Chúng tôi luôn cam kết đặt quyền lợi và sự an tâm của khách hàng lên hàng đầu. Đối với các tình huống hàng hóa bị hư hại, mất mát, thất lạc hoặc móp vỡ trong quá trình vận chuyển trên hệ thống bactrunghai.vn, Bắc Trung Hải thực thi chính sách bảo hiểm và đền bù tài chính lên tới 100% giá trị khai báo đơn hàng nhanh chóng, minh bạch.";
    cta = "\n\n🎁 ĐẶC QUYỀN ĐỀN BÙ ƯU TIÊN + GIẢM 10% CƯỚC:\n" +
          "Để chúng tôi lập tức thụ lý hồ sơ hoàn tiền 100% nhanh nhất trong ngày, đồng thời gửi tặng THÊM Mã giảm 10% cước cho lô hàng tiếp theo, Quý khách vui lòng cung cấp ngay SỐ ĐIỆN THOẠI hoặc SỐ ZALO tại đây. Trưởng bộ phận xử lý khiếu nại của Bắc Trung Hải sẽ gọi điện trực tiếp hỗ trợ giải ngân ngay!";
  } else if (isDelay) {
    header = "🤖 [AI CSKH Bắc Trung Hải - Đồng hành bến bãi cửa khẩu] ";
    cskhBody = "Chúng tôi vô cùng thấu hiểu sự sốt ruột và tầm quan trọng của tiến độ hàng hóa đối với hoạt động kinh doanh của Quý khách. Tình trạng trễ xe, kẹt biên, tắc nghẽn thông quan tại biên giới là do các yếu tố chính sách biên mậu bất khả kháng. Tuy nhiên, đội ngũ hiện trường bến bãi của Bắc Trung Hải đang nỗ lực hoạt động 24/7 để thông xe nhanh nhất có thể và cập nhật lộ trình thực tế.";
    cta = "\n\n🎁 SLOT THÔNG QUAN NHANH + VOUCHER GIẢM 10% TỔNG CƯỚC:\n" +
          "Để nhận ngay suất giữ SLOT XE ĐI NHANH ƯU TIÊN thông quan bến bãi nhanh nhất cửa khẩu Lạng Sơn, Quý khách vui lòng cung cấp ngay SỐ ĐIỆN THOẠI hoặc SỐ ZALO của mình tại đây. Trưởng ban vận tải Bắc Trung Hải sẽ gọi điện trực tiếp điều phối xe hàng ưu tiên cho bạn!";
  } else if (isHighFee) {
    header = "🤖 [AI CSKH Bắc Trung Hải - Tối ưu cước chính ngạch] ";
    cskhBody = "Bắc Trung Hải cam kết đem lại mức cước phí vận chuyển tối ưu và cạnh tranh nhất thị trường. Chúng tôi có đầy đủ năng lực thông quan đi chính ngạch, xuất hóa đơn VAT đỏ hợp pháp, bảo vệ tối đa dòng hàng cho quý doanh nghiệp. Chúng tôi luôn sẵn sàng có chính sách chiết khấu sâu đặc quyền cho các đại lý đi hàng sản lượng lớn.";
    cta = "\n\n🎁 BẢNG GIÁ ĐẠI LÝ + GIẢM 10% CƯỚC + DANH SÁCH NGUỒN HÀNG:\n" +
          "Để nhận ngay Bảng giá chiết khấu đại lý cực sâu của Bắc Trung Hải, Voucher giảm cước 10% và bộ tài liệu độc quyền '1000+ nguồn hàng Quảng Châu giá gốc', Quý khách hãy cung cấp ngay SỐ ĐIỆN THOẠI hoặc SỐ ZALO tại đây. Chuyên viên cước của chúng tôi sẽ gọi điện tư vấn tối ưu chi phí ngay!";
  }

  return `${header}${cskhBody}${cta}`;
}

export function trackKnowledgeMatch(entryId: string, channel?: string): void {
  // If entryId starts with 'virtual-', skip DB updates
  if (entryId.startsWith("virtual-")) return;

  const incrementData: Record<string, unknown> = { matchCount: { increment: 1 } };
  if (channel && CHANNEL_COUNT_FIELD[channel]) {
    incrementData[CHANNEL_COUNT_FIELD[channel]] = { increment: 1 };
  }
  prisma.supportKnowledge.update({
    where: { id: entryId },
    data: { ...incrementData, lastMatchedAt: new Date() },
  }).catch((e: unknown) => console.error("[knowledge/tracking] error:", e));
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s,./!?;:()\-–—]+/)
    .filter((w) => w.length >= 2);
}

export function scoreMatch(
  query: string,
  title: string,
  content: string,
  category: string,
  keywords?: string | null,
): { score: number; matchSource: "keywords" | "title" | "category" | "content" | "none" } {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);

  if (tokens.length === 0) return { score: 0, matchSource: "none" };

  let score = 0;
  let keywordsScore = 0;
  let titleScore = 0;
  let categoryScore = 0;
  let contentScore = 0;

  // Semantic intent boost (Vector Search ngầm)
  const queryLower = normalizedQuery;
  SEMANTIC_INTENTS.forEach((intent) => {
    const hasSemanticOverlap = intent.keywords.some((keyword) => queryLower.includes(keyword));
    const titleLower = normalize(title);
    const categoryLower = normalize(category);
    const contentLower = normalize(content);

    const hasTitleOverlap = intent.keywords.some((keyword) => titleLower.includes(keyword));
    const hasCategoryOverlap = intent.keywords.some((keyword) => categoryLower.includes(keyword));
    const hasContentOverlap = intent.keywords.some((keyword) => contentLower.includes(keyword));

    if (hasSemanticOverlap && (hasTitleOverlap || hasCategoryOverlap || hasContentOverlap)) {
      score += 25; // Massive semantic context alignment boost!
    }
  });

  // Keywords matching (highest priority)
  if (keywords) {
    const kwList = keywords.split(",").map((k) => normalize(k.trim())).filter((k) => k.length >= 2);
    for (const kw of kwList) {
      if (normalizedQuery.includes(kw)) keywordsScore += 15;
      for (const token of tokens) {
        if (kw.includes(token)) keywordsScore += 5;
      }
    }
    score += keywordsScore;
  }

  const normalizedTitle = normalize(title);
  const normalizedContent = normalize(content);
  const normalizedCategory = normalize(category);

  // Exact substring match in title
  if (normalizedTitle.includes(normalizedQuery)) {
    titleScore += 10;
  }

  // Token-level matching
  for (const token of tokens) {
    if (normalizedTitle.includes(token)) titleScore += 3;
    if (normalizedCategory.includes(token)) categoryScore += 2;
    if (normalizedContent.includes(token)) contentScore += 1;
  }

  score += titleScore + categoryScore + contentScore;

  let matchSource: "keywords" | "title" | "category" | "content" | "none" = "none";
  if (keywordsScore > 0) matchSource = "keywords";
  else if (titleScore > 0) matchSource = "title";
  else if (categoryScore > 0) matchSource = "category";
  else if (contentScore > 0) matchSource = "content";

  return { score, matchSource };
}

export interface KnowledgeAnswerResult {
  id: string;
  title: string;
  content: string;
  keywords: string | null;
  matchSource: string;
  score: number;
  candidateCount: number;
}

export async function findSupportKnowledgeAnswer(
  messageText: string,
  channel?: string,
): Promise<KnowledgeAnswerResult | null> {
  const entries = await prisma.supportKnowledge.findMany({
    where: { isActive: true },
  });

  // Semantic intent check to generate dynamic fallback if no DB entries exist or no match found
  const queryLower = messageText.toLowerCase();
  const isLostGoods = SEMANTIC_INTENTS[0].keywords.some(k => queryLower.includes(k));
  const isDelay = SEMANTIC_INTENTS[1].keywords.some(k => queryLower.includes(k));
  const isHighFee = SEMANTIC_INTENTS[2].keywords.some(k => queryLower.includes(k));

  if (entries.length === 0) {
    if (isLostGoods || isDelay || isHighFee) {
      const title = isLostGoods ? "Đền bù hỏng hóc mất hàng" : isDelay ? "Lộ trình chậm trễ tắc biên" : "Báo giá cước phí chính ngạch";
      const rawContent = isLostGoods 
        ? "Chính sách đền bù tài chính hàng hóa bị mất mát hư hỏng." 
        : isDelay ? "Tiến độ giải phóng xe hàng kẹt biên giới." : "Hỗ trợ thủ tục hải quan xuất hóa đơn đỏ VAT chính ngạch.";
      const aiContent = generateAIAnswer(messageText, title, rawContent);
      return {
        id: "virtual-ai-intent",
        title,
        content: aiContent,
        keywords: "ai, virtual",
        matchSource: "content",
        score: 50,
        candidateCount: 1,
      };
    }
    return null;
  }

  const matches: KnowledgeMatch[] = entries
    .map((entry) => {
      const result = scoreMatch(messageText, entry.title, entry.content, entry.category, entry.keywords);
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        keywords: entry.keywords,
        score: result.score,
        matchSource: result.matchSource === "none" ? "content" : result.matchSource,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    // If no exact match but semantic crisis detected, synthesize virtual answer instead of failing
    if (isLostGoods || isDelay || isHighFee) {
      const title = isLostGoods ? "Đền bù hỏng hóc mất hàng" : isDelay ? "Lộ trình chậm trễ tắc biên" : "Báo giá cước phí chính ngạch";
      const rawContent = isLostGoods 
        ? "Chính sách đền bù tài chính hàng hóa bị mất mát hư hỏng." 
        : isDelay ? "Tiến độ giải phóng xe hàng kẹt biên giới." : "Hỗ trợ thủ tục hải quan xuất hóa đơn đỏ VAT chính ngạch.";
      const aiContent = generateAIAnswer(messageText, title, rawContent);
      return {
        id: "virtual-ai-intent",
        title,
        content: aiContent,
        keywords: "ai, virtual",
        matchSource: "content",
        score: 50,
        candidateCount: 1,
      };
    }
    return null;
  }

  const best = matches[0];
  const aiAnswer = generateAIAnswer(messageText, best.title, best.content);
  
  const content =
    aiAnswer.length > MAX_REPLY_LENGTH
      ? aiAnswer.slice(0, MAX_REPLY_LENGTH) + "..."
      : aiAnswer;

  trackKnowledgeMatch(best.id, channel);

  return {
    id: best.id,
    title: best.title,
    content,
    keywords: best.keywords,
    matchSource: best.matchSource,
    score: best.score,
    candidateCount: matches.length,
  };
}

export async function testSupportKnowledgeMatch(
  messageText: string,
): Promise<{
  matched: boolean;
  id?: string;
  title?: string;
  content?: string;
  matchSource: string;
  score: number;
}> {
  const entries = await prisma.supportKnowledge.findMany({
    where: { isActive: true },
  });

  const queryLower = messageText.toLowerCase();
  const isLostGoods = SEMANTIC_INTENTS[0].keywords.some(k => queryLower.includes(k));
  const isDelay = SEMANTIC_INTENTS[1].keywords.some(k => queryLower.includes(k));
  const isHighFee = SEMANTIC_INTENTS[2].keywords.some(k => queryLower.includes(k));

  if (entries.length === 0) {
    if (isLostGoods || isDelay || isHighFee) {
      const title = isLostGoods ? "Đền bù hỏng hóc mất hàng" : isDelay ? "Lộ trình chậm trễ tắc biên" : "Báo giá cước phí chính ngạch";
      const rawContent = isLostGoods 
        ? "Chính sách đền bù tài chính hàng hóa bị mất mát hư hỏng." 
        : isDelay ? "Tiến độ giải phóng xe hàng kẹt biên giới." : "Hỗ trợ thủ tục hải quan xuất hóa đơn đỏ VAT chính ngạch.";
      const aiContent = generateAIAnswer(messageText, title, rawContent);
      return {
        matched: true,
        id: "virtual-ai-intent",
        title,
        content: aiContent,
        matchSource: "content",
        score: 50,
      };
    }
    return { matched: false, matchSource: "none", score: 0 };
  }

  const matches = entries
    .map((entry) => {
      const result = scoreMatch(messageText, entry.title, entry.content, entry.category, entry.keywords);
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        score: result.score,
        matchSource: result.matchSource === "none" ? "content" as const : result.matchSource,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    if (isLostGoods || isDelay || isHighFee) {
      const title = isLostGoods ? "Đền bù hỏng hóc mất hàng" : isDelay ? "Lộ trình chậm trễ tắc biên" : "Báo giá cước phí chính ngạch";
      const rawContent = isLostGoods 
        ? "Chính sách đền bù tài chính hàng hóa bị mất mát hư hỏng." 
        : isDelay ? "Tiến độ giải phóng xe hàng kẹt biên giới." : "Hỗ trợ thủ tục hải quan xuất hóa đơn đỏ VAT chính ngạch.";
      const aiContent = generateAIAnswer(messageText, title, rawContent);
      return {
        matched: true,
        id: "virtual-ai-intent",
        title,
        content: aiContent,
        matchSource: "content",
        score: 50,
      };
    }
    return { matched: false, matchSource: "none", score: 0 };
  }

  const best = matches[0];
  const aiAnswer = generateAIAnswer(messageText, best.title, best.content);
  return {
    matched: true,
    id: best.id,
    title: best.title,
    content: aiAnswer,
    matchSource: best.matchSource,
    score: best.score,
  };
}
