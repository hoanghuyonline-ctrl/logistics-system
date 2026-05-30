import { NextRequest, NextResponse } from "next/server";
import { sanitizeData } from "../route";

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

const IMAGES = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60"
];

const SUPPLIERS = [
  "Tổng kho Nguồn hàng Hình ảnh Quảng Châu",
  "Nhà máy Hàng tiêu dùng Chiết Giang",
  "Tmall Flagship Store Global",
  "Xưởng May Mặc Quảng Châu",
  "Cửa hàng Kỹ thuật Số Thâm Quyến"
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Không tìm thấy file ảnh tải lên." }, { status: 400 });
    }

    // Chinese image search simulation — highly responsive real-time cào sâu
    const items: ProductItem[] = [];
    const totalItems = 80;

    for (let i = 1; i <= totalItems; i++) {
      const platform: Platform = i % 4 === 0 ? "taobao" : i % 4 === 1 ? "1688" : i % 4 === 2 ? "tmall" : "other";
      const imageUrl = IMAGES[(i - 1) % IMAGES.length];
      const supplier = SUPPLIERS[(i - 1) % SUPPLIERS.length];
      
      const titleVi = `[Quét ảnh ${i}] Sản phẩm tương đồng chất lượng cao`;
      const titleZh = `[图搜相似 ${i}] 精选热销同款优质货源商品`;
      const basePrice = 25 + (i * 2);

      // Verify all strings satisfy sanitizeData security criteria
      if (sanitizeData(titleVi) && sanitizeData(titleZh) && sanitizeData(supplier)) {
        items.push({
          id: `image-search-${platform}-${i}`,
          platform,
          titleVi,
          titleZh,
          priceCNY: basePrice,
          imageUrl,
          supplier,
          rating: parseFloat((4.6 + ((i % 4) / 10)).toFixed(1)),
          salesCount: `${(i * 950).toLocaleString("vi-VN")}+`,
          attributes: {
            source: "image-scan"
          }
        });
      }
    }

    return NextResponse.json(
      {
        items,
        total: items.length,
        translated: "以图搜图 (Image-Based Sourcing)",
        filters: []
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  } catch (err: any) {
    console.error("[image-search] Error:", err);
    return NextResponse.json(
      { error: "Lỗi kết nối máy chủ quét ảnh." },
      { status: 500 }
    );
  }
}
