import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock configuration parameters representing active AI Marketing Gói 2
const EXCHANGE_RATE = 3980;

interface MarketingQueueItem {
  id: string;
  platform: string;
  productTitle: string;
  priceCNY: number;
  scriptVi: string;
  audioUrl: string;
  videoUrl: string;
  publishedChannels: string[];
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

// In-Memory Simulated 24/7 Marketing AI Queue for Live Tracking
const MARKETING_QUEUE: MarketingQueueItem[] = [
  {
    id: "MKT-TAOBAO-99120",
    platform: "taobao",
    productTitle: "Tai Nghe Bluetooth Chống Ồn Cao Cấp",
    priceCNY: 159.0,
    scriptVi: "🔥 Hot trend dân buôn 2026! Siêu phẩm tai nghe chống ồn HIFI, âm bass cực căng. Giá tệ chỉ ¥159, mua hộ trực tiếp tại Bắc Trung Hải Logistics chỉ 6xx.000đ! Nhấp link bio hốt ngay!",
    audioUrl: "https://storage.bactrunghai.vn/audio/tts-earbuds-vn.mp3",
    videoUrl: "https://storage.bactrunghai.vn/video/promo-earbuds.mp4",
    publishedChannels: ["TikTok", "Facebook Reels", "YouTube Shorts"],
    status: "COMPLETED",
    createdAt: new Date().toISOString()
  },
  {
    id: "MKT-1688-29931",
    platform: "1688",
    productTitle: "Cốc Sạc Nhanh GaN 65W Đa Năng",
    priceCNY: 45.0,
    scriptVi: "⚡ Cốc sạc nhanh GaN 65W nhỏ gọn tiện lợi, sạc đầy laptop điện thoại trong 30p! Nhập sỉ giá xưởng 1688 chỉ từ 1xx.000đ. Đặt hàng 1 chạm cực mượt tại Bắc Trung Hải Logistics!",
    audioUrl: "https://storage.bactrunghai.vn/audio/tts-charger-vn.mp3",
    videoUrl: "https://storage.bactrunghai.vn/video/promo-charger.mp4",
    publishedChannels: ["TikTok", "YouTube Shorts"],
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

// GET: Retrieve 24/7 AI Marketing status, trends, content logs and queue tracking
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      packageName: "Marketing AI 24/7 Gói 2 - Cao cấp",
      status: "ACTIVE",
      cronInterval: "Every 4 Hours",
      exchangeRate: EXCHANGE_RATE,
      stats: {
        totalScrapedTrends: 148,
        totalVideosRendered: 112,
        totalChannelsSynced: 3,
        leadConversionRate: "12.8%"
      },
      currentQueue: MARKETING_QUEUE
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi hệ thống khi tải dữ liệu Marketing." }, { status: 500 });
  }
}

// POST: Trigger manual override of the background scraping & content generation cycle
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { platform = "taobao", keyword = "tai nghe" } = body;

    // Simulate real-time background trend scraper & content synthesizer
    const newItem: MarketingQueueItem = {
      id: `MKT-GEN-${Date.now().toString().slice(-5)}`,
      platform,
      productTitle: `Sản phẩm ${keyword} hot trend`,
      priceCNY: 99.0,
      scriptVi: `🔥 Phát hiện trend mới! ${keyword} cực hot trên sàn gốc. Báo giá trọn gói về Việt Nam qua Bắc Trung Hải Logistics cực hời. Inbox/Comment ngay nhận link bóc tách giá tệ và tạo đơn trực tiếp chỉ 1 chạm!`,
      audioUrl: "https://storage.bactrunghai.vn/audio/tts-new-vn.mp3",
      videoUrl: "https://storage.bactrunghai.vn/video/promo-new.mp4",
      publishedChannels: ["TikTok", "Facebook Reels", "YouTube Shorts"],
      status: "COMPLETED",
      createdAt: new Date().toISOString()
    };

    MARKETING_QUEUE.unshift(newItem);

    return NextResponse.json({
      success: true,
      message: "Đã kích hoạt chu kỳ quét xu hướng, lồng tiếng và phân phối video ngắn tự động ngầm 24/7!",
      addedItem: newItem
    });
  } catch (error) {
    return NextResponse.json({ error: "Gặp sự cố khi kích hoạt chu kỳ marketing tự động." }, { status: 500 });
  }
}
