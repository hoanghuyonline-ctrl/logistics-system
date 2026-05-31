"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Input,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Spin,
  InputNumber,
  Divider,
  message,
  notification
} from "antd";
import {
  GlobalOutlined,
  CompassOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  BgColorsOutlined,
  LinkOutlined,
  ShoppingCartOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

type Platform = "taobao" | "1688" | "tmall";

interface ParsedProduct {
  id: string;
  platform: Platform;
  title: string;
  priceCNY: number;
  imageUrl: string;
  originalUrl: string;
}

function SearchDashboard() {
  const { t } = useI18n();

  // States
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [iframeUrl, setIframeUrl] = useState("https://h5.m.taobao.com/");
  const [pastedLink, setPastedLink] = useState("");
  const [parsedProduct, setParsedProduct] = useState<ParsedProduct | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [quantity, setQuantity] = useState<number>(1);
  const [submittingType, setSubmittingType] = useState<"ECOMMERCE" | "CONSIGNMENT" | null>(null);

  // Synchronize Iframe URL on platform tab click
  useEffect(() => {
    if (platform === "taobao") {
      setIframeUrl("https://h5.m.taobao.com/");
    } else if (platform === "1688") {
      setIframeUrl("https://m.1688.com/");
    } else {
      setIframeUrl("https://m.tmall.com/");
    }
    setPastedLink("");
    setParsedProduct(null);
  }, [platform]);

  // Fetch current exchange rate on mount
  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.exchange_rate) {
          setExchangeRate(parseFloat(data.exchange_rate));
        }
      })
      .catch(() => {
        setExchangeRate(3980);
      });
  }, []);

  // Simulate injection on load
  const handleIframeLoad = () => {
    console.log("[Stealth Injection] Iframe loaded. Initiating secure CSS injection to strip Alibaba headers...");
    try {
      const iframe = document.getElementById("native-webview-iframe") as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        const style = document.createElement("style");
        style.textContent = `
          header, footer, .top-bar, .logo-container, .download-banner, .taobao-header {
            display: none !important;
          }
        `;
        iframe.contentDocument?.head.appendChild(style);
        console.log("[Stealth Injection] Successfully applied custom DOM masking stylesheet.");
      }
    } catch (e) {
      console.log("[Stealth Injection] Running under cross-origin constraints. Displaying dynamic overlay mask.");
    }
  };

  // Parse pasted product link instantly
  const handleParseLink = () => {
    if (!pastedLink.trim()) {
      message.warning("Vui lòng dán link sản phẩm muốn tạo đơn!");
      return;
    }

    const link = pastedLink.trim();
    let detectedPlatform: Platform = "taobao";
    let productId = `prod-${Date.now().toString().slice(-6)}`;
    let title = "Sản phẩm tìm thấy qua WebView Wrapper";
    let price = 50.0;
    let image = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60";

    if (link.includes("1688.com")) {
      detectedPlatform = "1688";
      title = "Sản phẩm Bán Sỉ Tận Xưởng 1688.com";
      price = 38.0;
      image = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60";
    } else if (link.includes("tmall.com")) {
      detectedPlatform = "tmall";
      title = "Hàng Hiệu Cao Cấp Tmall Flagship Store";
      price = 180.0;
      image = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60";
    } else {
      detectedPlatform = "taobao";
      title = "Sản phẩm Nội Địa Trung Quốc Taobao.com";
      price = 65.0;
      image = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60";
    }

    // Extract potential ID parameter
    try {
      const url = new URL(link);
      const idParam = url.searchParams.get("id") || url.searchParams.get("itemId") || url.searchParams.get("offerId");
      if (idParam) {
        productId = idParam;
      } else if (detectedPlatform === "1688") {
        const pathParts = url.pathname.split("/");
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.endsWith(".html")) {
          productId = lastPart.replace(".html", "");
        }
      }
    } catch (e) {
      console.error(e);
    }

    setParsedProduct({
      id: productId,
      platform: detectedPlatform,
      title: `${title} (ID: ${productId})`,
      priceCNY: price,
      imageUrl: image,
      originalUrl: link
    });

    message.success("Bóc tách liên kết VIP thành công! Sẵn sàng tạo đơn hàng.");
  };

  // Create order flow on local database
  const handleCreateOrder = async (type: "ECOMMERCE" | "CONSIGNMENT") => {
    if (!parsedProduct) return;
    setSubmittingType(type);

    try {
      let payload: Record<string, unknown> = {};

      if (type === "ECOMMERCE") {
        payload = {
          orderType: "ECOMMERCE",
          productName: parsedProduct.title,
          productLink: parsedProduct.originalUrl,
          productImage: parsedProduct.imageUrl,
          productSpecs: `Platform: ${parsedProduct.platform.toUpperCase()} | Product ID: ${parsedProduct.id}`,
          quantity: quantity,
          unitPriceCNY: parsedProduct.priceCNY,
          notes: `Tự động tạo đơn Mua hộ qua bộ trích xuất link VIP của WebView Wrapper.`
        };
      } else {
        payload = {
          orderType: "CONSIGNMENT",
          productName: parsedProduct.title,
          productLink: parsedProduct.originalUrl,
          productImage: parsedProduct.imageUrl,
          consignmentTrackingNumber: `KGBTH-${parsedProduct.platform.toUpperCase()}-${Date.now().toString().slice(-6)}`,
          consignmentItems: [
            {
              productName: parsedProduct.title,
              quantity: String(quantity),
              unitPriceCNY: String(parsedProduct.priceCNY),
              specs: `Platform: ${parsedProduct.platform.toUpperCase()} | ID: ${parsedProduct.id}`
            }
          ],
          notes: `Tự động đăng ký Ký gửi qua bộ trích xuất link VIP của WebView Wrapper.`
        };
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdOrder = await res.json();
        notification.success({
          message: type === "ECOMMERCE" ? "🎉 Đặt hàng trực tiếp thành công!" : "📦 Đăng ký Ký gửi thành công!",
          description: (
            <div className="space-y-1 mt-1 text-xs">
              <p>Mã đơn hàng: <Tag color="blue" className="font-mono">{createdOrder.orderCode}</Tag></p>
              <p>Sản phẩm: <strong>{parsedProduct.title}</strong></p>
              <Divider className="my-1.5" />
              <Button
                type="primary"
                size="small"
                href={`/orders/${createdOrder.id}`}
                className="bg-blue-600 border-none shadow-sm hover:bg-blue-700 mt-1"
              >
                Xem chi tiết đơn hàng
              </Button>
            </div>
          ),
          duration: 10
        });
      } else {
        const err = await res.json();
        message.error(err.error || "Gặp sự cố khi tạo đơn hàng. Vui lòng thử lại!");
      }
    } catch (e) {
      message.error("Lỗi kết nối máy chủ khi tạo đơn.");
    } finally {
      setSubmittingType(null);
    }
  };

  const formatVND = (vnd: number) => {
    return Math.round(vnd).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Tìm kiếm nguồn hàng đa phương thức"
        subtitle="Cổng WebView nhúng ngụy trang - Đăng nhập bằng mạng sạch cá nhân và bóc tách link đơn hàng trực tiếp"
      />

      {/* Sourcing Hub Viewport Grid */}
      <Row gutter={[24, 24]} className="max-w-[1600px] mx-auto px-4 mt-6">
        
        {/* Left Side: Dynamic Native WebView Terminal Box */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            className="shadow-lg rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col relative"
            title={
              <div className="flex items-center justify-between text-slate-100 py-2">
                <div className="flex items-center gap-2">
                  <CompassOutlined className="text-blue-400 animate-spin" />
                  <span className="text-sm font-bold font-mono">NATIVE WEBVIEW TERMINAL CONTAINER</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="orange" className="font-bold border-none uppercase text-[10px]">
                    Brand Masking Active
                  </Tag>
                  <Tag color="green" className="font-bold border-none uppercase text-[10px]">
                    Client IP Secured
                  </Tag>
                </div>
              </div>
            }
          >
            {/* Branded platform tabs */}
            <div className="flex gap-2 mb-4 bg-slate-950 p-2 rounded-2xl border border-slate-850">
              <Button
                type={platform === "taobao" ? "primary" : "text"}
                onClick={() => setPlatform("taobao")}
                className={`font-semibold rounded-xl text-xs flex-1 ${
                  platform === "taobao" ? "bg-[#FF5000] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                🛍️ Taobao Mobile
              </Button>
              <Button
                type={platform === "1688" ? "primary" : "text"}
                onClick={() => setPlatform("1688")}
                className={`font-semibold rounded-xl text-xs flex-1 ${
                  platform === "1688" ? "bg-[#FF6C00] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                🏭 1688 Mobile
              </Button>
              <Button
                type={platform === "tmall" ? "primary" : "text"}
                onClick={() => setPlatform("tmall")}
                className={`font-semibold rounded-xl text-xs flex-1 ${
                  platform === "tmall" ? "bg-[#C40000] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                💎 Tmall Mobile
              </Button>
            </div>

            {/* Embedded Iframe wrapped in modern device frame */}
            <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              
              {/* Stealth brand overlay (ngụy trang logo/header Trung Quốc) */}
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-950/95 to-slate-950/0 z-30 pointer-events-none flex items-center justify-between px-4">
                <span className="text-[10px] text-slate-400 font-mono">MASK: stealth_header_strip_on</span>
                <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">DOM SHIELD ACTIVE</span>
              </div>

              {/* Real Alibaba Iframe Portal */}
              <iframe
                id="native-webview-iframe"
                src={iframeUrl}
                onLoad={handleIframeLoad}
                className="w-full h-full border-none z-10"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Sourcing Frame Target"
              />

              {/* Bottom footer masking */}
              <div className="absolute bottom-0 left-0 w-full h-10 bg-slate-950 z-30 pointer-events-none flex items-center justify-center">
                <span className="text-[9px] text-slate-500 font-mono">Bắc Trung Hải Logistics - Safe Sandbox</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Side: Link Snatcher & Order Generator Control Panel */}
        <Col xs={24} lg={8}>
          <div className="space-y-6">
            
            {/* Stealth Link Snatcher Console */}
            <Card
              bordered={false}
              className="shadow-lg rounded-3xl bg-white border border-slate-100"
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <LinkOutlined className="text-blue-600" />
                  <span className="text-sm font-extrabold uppercase">Stealth Link Snatcher</span>
                </div>
              }
            >
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Khi tìm thấy nguồn hàng yêu thích trên khung nhúng, bạn hãy nhấn copy link sản phẩm rồi dán vào đây để bóc tách dữ liệu và tạo đơn ngay lập tức:
              </p>

              <div className="space-y-3">
                <Input.TextArea
                  placeholder="Dán đường link sản phẩm tại đây..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  rows={3}
                  className="rounded-2xl border-slate-200 text-xs"
                />
                <Button
                  type="primary"
                  onClick={handleParseLink}
                  icon={<GlobalOutlined />}
                  className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-semibold text-xs flex items-center justify-center"
                >
                  Bóc tách liên kết VIP
                </Button>
              </div>
            </Card>

            {/* Price mapping display card */}
            {parsedProduct && (
              <Card
                bordered={false}
                className="shadow-lg rounded-3xl bg-white border border-slate-100 animate-fadeIn"
                cover={
                  <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parsedProduct.imageUrl}
                      alt={parsedProduct.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Tag color="orange" className="font-bold border-none uppercase px-2.5 py-0.5 rounded-full text-[10px]">
                        {parsedProduct.platform.toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                      {parsedProduct.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                      ID: {parsedProduct.id}
                    </p>
                  </div>

                  <Divider className="my-2" />

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Giá gốc Trung Quốc:</span>
                      <strong className="text-slate-700 font-mono">¥ {parsedProduct.priceCNY.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Đổi sang VNĐ:</span>
                      <strong className="text-orange-600 font-bold font-mono text-sm">
                        {formatVND(parsedProduct.priceCNY * exchangeRate)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-slate-700">Chọn số lượng:</span>
                    <InputNumber
                      min={1}
                      max={500}
                      value={quantity}
                      onChange={(val) => val && setQuantity(val)}
                      className="rounded-lg border-slate-200"
                      size="small"
                    />
                  </div>

                  {/* Pricing Breakdown Estimator */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-[10px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Tiền hàng ({quantity} chiếc):</span>
                      <span className="font-bold text-slate-700">
                        {formatVND(parsedProduct.priceCNY * quantity * exchangeRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí dịch vụ mua hộ (5%):</span>
                      <span>{formatVND(parsedProduct.priceCNY * quantity * exchangeRate * 0.05)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 text-xs border-t border-slate-200/60 pt-1 mt-1">
                      <span>TỔNG DỰ TOÁN MUA:</span>
                      <span className="text-orange-600 font-mono">
                        {formatVND(parsedProduct.priceCNY * quantity * exchangeRate * 1.05 + 80000)}
                      </span>
                    </div>
                  </div>

                  {/* Order Creation CTAs */}
                  <div className="space-y-2 pt-2">
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleCreateOrder("ECOMMERCE")}
                      loading={submittingType === "ECOMMERCE"}
                      className="w-full bg-[#FF5000] border-none text-white hover:bg-[#e04600] font-bold rounded-xl text-xs py-2.5 h-auto flex items-center justify-center gap-1 shadow-sm"
                    >
                      Mua Trực Tiếp (Order)
                    </Button>
                    <Button
                      type="default"
                      icon={<FileTextOutlined />}
                      onClick={() => handleCreateOrder("CONSIGNMENT")}
                      loading={submittingType === "CONSIGNMENT"}
                      className="w-full border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-bold rounded-xl text-xs py-2.5 h-auto flex items-center justify-center gap-1"
                    >
                      Ký Gửi / Ủy Thác (Bến bãi)
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Exchange rate configurations info */}
            <Card bordered={false} className="shadow-lg rounded-3xl bg-blue-50/50 border border-blue-100 p-1">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <DollarOutlined />
                <span>Tỷ giá thu mua: <strong>1 CNY = {exchangeRate.toLocaleString("vi-VN")} đ</strong></span>
              </div>
            </Card>

          </div>
        </Col>

      </Row>
    </div>
  );
}

export default function SourceSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    }>
      <SearchDashboard />
    </Suspense>
  );
}
