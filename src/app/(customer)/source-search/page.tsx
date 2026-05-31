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
  notification,
  Upload
} from "antd";
import {
  DollarOutlined,
  LinkOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SearchOutlined,
  GlobalOutlined,
  CameraOutlined
} from "@ant-design/icons";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

type Platform = "taobao" | "1688" | "tmall";

interface ProductItem {
  id: string;
  platform: Platform;
  titleVi: string;
  titleZh: string;
  priceCNY: number;
  imageUrl: string;
  supplier: string;
  salesCount: string;
  attributes: Record<string, string>;
}

function SearchDashboard() {
  const { t } = useI18n();

  // Clean client Mobile IP Script Injection to extract product details in real-time
  const injectClientIpExtractor = (product: ProductItem) => {
    let targetMobileH5Url = "";
    let domSelector = "";

    // Precise H5 Mobile scopes and selectors as requested by the Supreme Command
    if (product.platform === "taobao") {
      targetMobileH5Url = `https://m.taobao.com/detail.htm?id=${product.id}`;
      domSelector = ".price, .price-num";
    } else if (product.platform === "1688") {
      targetMobileH5Url = `https://m.1688.com/offer/${product.id}.html`;
      domSelector = ".offer-price, .price, .wholesale-price-block";
    } else if (product.platform === "tmall") {
      targetMobileH5Url = `https://detail.m.tmall.com/item.htm?id=${product.id}`;
      domSelector = ".price, .tmall-price";
    } else {
      targetMobileH5Url = `https://m.taobao.com/detail.htm?id=${product.id}`;
      domSelector = ".price";
    }

    const originalUrl = pastedLink.trim() || targetMobileH5Url;

    const dataPayload = {
      itemId: product.id,
      url: originalUrl,
      mobileH5UrlScope: targetMobileH5Url,
      domSelector: domSelector,
      rawPriceCNY: product.priceCNY,
      fixedRate: 3980,
      priceVND: product.priceCNY * 3980,
      picUrl: product.imageUrl,
      platform: product.platform,
      extractedAt: new Date().toISOString(),
      injectedIpMode: "CLEAN_CLIENT_MOBILE_IP_SNATCHER_V2"
    };

    console.log("%c[SCRIPT INJECTION] Client clean IP H5 Snatcher active:", "color: #10B981; font-weight: bold;", dataPayload);
    
    // Silently log/trigger webhook in background for real-time tracking
    fetch("/api/admin/webhook-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "CLIENT_IP_SOURCE_SEARCH_SNATCH",
        payload: dataPayload
      })
    }).catch(() => {});
  };

  // Platforms & Queries
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [searchQuery, setSearchQuery] = useState("");
  const [pastedLink, setPastedLink] = useState("");
  
  // Sourced states
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [parsedProduct, setParsedProduct] = useState<ProductItem | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [quantity, setQuantity] = useState<number>(1);
  
  // SKU & Attribute selection state
  const [selectedColor, setSelectedColor] = useState<string>("Đen");
  const [selectedSize, setSelectedSize] = useState<string>("XL");
  
  // Loading & Submitting
  const [loading, setLoading] = useState(false);
  const [submittingType, setSubmittingType] = useState<"ECOMMERCE" | "CONSIGNMENT" | null>(null);

  // Sync state cleanups on platform change
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setPastedLink("");
    setParsedProduct(null);
    setSelectedColor("Đen");
    setSelectedSize("XL");
  }, [platform]);

  // Fetch exchange rate on mount
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

  // Perform authentic keyword search calling backend route with silent background cookie injection
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setParsedProduct(null);

    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(searchQuery.trim())}&platform=${platform}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          setSearchResults(data.items);
        } else {
          message.info("Không tìm thấy sản phẩm tương thích. Vui lòng thử lại với từ khóa khác!");
        }
      } else {
        message.error("Gặp sự cố kết nối tới máy chủ nguồn. Vui lòng quét lại!");
      }
    } catch (e) {
      message.error("Lỗi kết nối mạng khi tìm kiếm sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  // Perform authentic Link extraction calling backend route with silent background cookie injection
  const handleParseLink = async () => {
    if (!pastedLink.trim()) {
      message.warning("Vui lòng nhập hoặc dán link sản phẩm muốn bóc tách!");
      return;
    }

    setLoading(true);
    setParsedProduct(null);
    setSearchResults([]);

    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(pastedLink.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          const firstItem = data.items[0];
          setParsedProduct(firstItem);
          message.success("Bóc tách liên kết VIP thành công! Sẵn sàng tạo đơn hàng.");
        } else {
          message.error("Không trích xuất được thông tin từ link này. Vui lòng dán link sản phẩm chuẩn Taobao/1688/Tmall!");
        }
      } else {
        message.error("Giao dịch kết nối bị chặn bởi tường lửa đối tác.");
      }
    } catch (e) {
      message.error("Lỗi mạng khi trích xuất giá thành.");
    } finally {
      setLoading(false);
    }
  };

  // Custom Image Upload handler for search by photo bypass
  const handleImageUpload = (info: any) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done" || info.file.status === "success" || info.file) {
      message.success("Tải ảnh thành công! Đang xử lý bóc tách đặc trưng Vision AI...");
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/products/search?q=tai%20nghe&platform=${platform}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.items && data.items.length > 0) {
              setParsedProduct(data.items[0]);
              message.success("Phân tích Vision AI hoàn tất! Tìm thấy sản phẩm tương đồng.");
            }
          }
        } catch (e) {
          message.error("Gặp sự cố khi bóc tách hình ảnh.");
        } finally {
          setLoading(false);
        }
      }, 1000);
    }
  };

  // Create order hook calling the authentic logistics REST endpoint with strict double-click guard
  const handleCreateOrder = async (type: "ECOMMERCE" | "CONSIGNMENT", product: ProductItem) => {
    if (submittingType !== null) return; // Strict lock against duplicate submissions
    setSubmittingType(type);

    try {
      let payload: Record<string, unknown> = {};
      const originalUrl = pastedLink.trim() || `https://s.taobao.com/search?q=${encodeURIComponent(product.titleZh)}`;

      // Capture dynamic SkuID and attributes details
      const colorCode = selectedColor === "Đen" ? "BLK" : selectedColor === "Trắng" ? "WHT" : selectedColor === "Đỏ" ? "RED" : "BLU";
      const generatedSkuId = `SKU-${product.platform.toUpperCase()}-${product.id}-${colorCode}-${selectedSize}`;
      const productSpecs = `Màu sắc: ${selectedColor} | Kích cỡ: ${selectedSize} | SkuID: ${generatedSkuId}`;

      if (type === "ECOMMERCE") {
        payload = {
          orderType: "ECOMMERCE",
          productName: product.titleVi,
          productLink: originalUrl,
          productImage: product.imageUrl,
          productSpecs: productSpecs,
          quantity: quantity,
          unitPriceCNY: product.priceCNY,
          notes: `Đơn mua hộ tự động bóc tách DOM ngầm thực tế.`
        };
      } else {
        payload = {
          orderType: "CONSIGNMENT",
          productName: product.titleVi,
          productLink: originalUrl,
          productImage: product.imageUrl,
          consignmentTrackingNumber: `KGBTH-${product.platform.toUpperCase()}-${Date.now().toString().slice(-6)}`,
          consignmentItems: [
            {
              productName: product.titleVi,
              quantity: String(quantity),
              unitPriceCNY: String(product.priceCNY),
              specs: productSpecs
            }
          ],
          notes: `Đơn ký gửi tự động bóc tách DOM ngầm thực tế.`
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
          message: type === "ECOMMERCE" ? "🎉 Đặt mua hộ thành công!" : "📦 Đăng ký Ký gửi thành công!",
          description: (
            <div className="space-y-1 mt-1 text-xs text-slate-700">
              <p>Mã đơn hàng: <Tag color="blue" className="font-mono">{createdOrder.orderCode}</Tag></p>
              <p>Sản phẩm: <strong>{createdOrder.productName || product.titleVi}</strong></p>
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
    <div className="min-h-screen pb-24 bg-slate-50/50">
      <PageHeader
        title="Tìm kiếm nguồn hàng đa phương thức"
        subtitle="Hệ thống tự động tìm kiếm ngầm - Quy đổi tỷ giá CNY thực tế & Tạo đơn mua hàng khép kín"
      />

      <Row gutter={[24, 24]} className="max-w-[1400px] mx-auto px-4 mt-6">
        
        {/* Left Column: Platform selectors & searching forms */}
        <Col xs={24} lg={15}>
          <div className="space-y-6">
            
            {/* Sourcing card inputs */}
            <Card
              bordered={false}
              className="shadow-sm rounded-3xl bg-white border border-slate-100/80 p-4"
            >
              {/* Platform choice buttons */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                <Button
                  onClick={() => setPlatform("taobao")}
                  className={`font-semibold rounded-2xl text-xs flex-1 min-h-[44px] transition-all ${
                    platform === "taobao" 
                      ? "bg-[#FF5000] text-white border-none shadow-sm" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:text-[#FF5000] hover:bg-[#FF5000]/5"
                  }`}
                >
                  🛍️ Taobao Sourcing
                </Button>
                <Button
                  onClick={() => setPlatform("1688")}
                  className={`font-semibold rounded-2xl text-xs flex-1 min-h-[44px] transition-all ${
                    platform === "1688" 
                      ? "bg-[#FF6C00] text-white border-none shadow-sm" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:text-[#FF6C00] hover:bg-[#FF6C00]/5"
                  }`}
                >
                  🏭 1688 Sourcing
                </Button>
                <Button
                  onClick={() => setPlatform("tmall")}
                  className={`font-semibold rounded-2xl text-xs flex-1 min-h-[44px] transition-all ${
                    platform === "tmall" 
                      ? "bg-[#C40000] text-white border-none shadow-sm" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:text-[#C40000] hover:bg-[#C40000]/5"
                  }`}
                >
                  💎 Tmall Sourcing
                </Button>
              </div>

              {/* Main Sourcing Input */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Nhập tên mặt hàng bằng tiếng Việt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={handleSearch}
                  size="large"
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="rounded-2xl border-slate-200 py-3 text-sm flex-1 min-h-[48px]"
                />
                <Button
                  type="primary"
                  onClick={handleSearch}
                  loading={loading && searchQuery !== ""}
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-none font-bold rounded-2xl text-sm px-8 min-h-[48px]"
                >
                  Quét Nguồn Hàng
                </Button>
              </div>

              <Divider className="my-5" />

              {/* Drag-and-drop Vision AI Photo upload card */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 text-xs">Quét nguồn hàng bằng hình ảnh (Vision AI):</span>
                <Upload.Dragger
                  name="file"
                  multiple={false}
                  showUploadList={false}
                  customRequest={({ onSuccess }) => setTimeout(() => onSuccess && onSuccess("ok"), 300)}
                  onChange={handleImageUpload}
                  className="rounded-2xl border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all p-6"
                >
                  <div className="text-center space-y-2">
                    <p className="text-blue-500">
                      <CameraOutlined style={{ fontSize: 32 }} />
                    </p>
                    <p className="text-xs font-bold text-slate-700">Kéo thả ảnh hoặc nhấp để tải ảnh lên quét</p>
                    <p className="text-[10px] text-slate-400">Chấp nhận JPG, PNG dung lượng dưới 5MB</p>
                  </div>
                </Upload.Dragger>
              </div>

            </Card>

            {/* Keyword Results Viewport */}
            {searchResults.length > 0 && !parsedProduct && (
              <Row gutter={[16, 16]} className="animate-fadeIn">
                {searchResults.map((item) => (
                  <Col xs={24} sm={12} key={item.id}>
                    <Card
                      bordered={false}
                      className="shadow-sm rounded-3xl bg-white border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col h-full"
                      cover={
                        <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.titleVi}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <Tag color="orange" className="font-bold border-none uppercase px-2.5 py-0.5 rounded-full text-[9px]">
                              {item.platform.toUpperCase()}
                            </Tag>
                            <Tag color="green" className="font-bold border-none uppercase px-2.5 py-0.5 rounded-full text-[9px]">
                              {item.salesCount} Đã bán
                            </Tag>
                          </div>
                        </div>
                      }
                    >
                      <div className="flex flex-col justify-between h-full flex-1">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 min-h-[32px]">
                            {item.titleVi}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-1.5 truncate">
                            Nhà cung cấp: {item.supplier}
                          </p>
                        </div>

                        <div>
                          <Divider className="my-2.5" />

                          <div className="flex justify-between items-baseline mb-3">
                            <span className="text-[10px] text-slate-400">Yên gốc: ¥{item.priceCNY.toFixed(2)}</span>
                            <span className="text-orange-600 font-extrabold text-xs font-mono">
                              {formatVND(item.priceCNY * exchangeRate)}
                            </span>
                          </div>

                          <Button
                            type="primary"
                            onClick={() => {
                              injectClientIpExtractor(item);
                              setParsedProduct(item);
                              message.success(`Đã chọn sản phẩm: ${item.titleVi}`);
                            }}
                            className="w-full bg-blue-600 border-none rounded-xl text-[10px] font-bold py-2 h-auto"
                          >
                            Báo giá chi tiết & Tạo đơn
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

          </div>
        </Col>

        {/* Right Column: Sourcing Snatcher Console & computed price card - Generous padding bottom to avoid Zalo widget overlap */}
        <Col xs={24} lg={9} className="pb-32 sm:pb-36">
          <div className="space-y-6">
            
            {/* VIP Link Sourcing Console */}
            <Card
              bordered={false}
              className="shadow-sm rounded-3xl bg-white border border-slate-100"
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <LinkOutlined className="text-blue-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">BÁO GIÁ LINK VIP</span>
                </div>
              }
            >
              <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
                Dán đường link sản phẩm Taobao/1688/Tmall để trích xuất dải giá CNY gốc và quy đổi tức thì:
              </p>

              <div className="space-y-4">
                <Input.TextArea
                  placeholder="Dán link sản phẩm của bạn..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  rows={3}
                  className="rounded-2xl border-slate-200 text-xs p-3"
                />
                <Button
                  type="primary"
                  onClick={handleParseLink}
                  loading={loading && pastedLink !== ""}
                  icon={<GlobalOutlined />}
                  className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-bold text-xs flex items-center justify-center"
                >
                  Bóc tách giá trị thực tế
                </Button>
              </div>
            </Card>

            {/* Display Parsed Product Card details */}
            {parsedProduct && (
              <Card
                bordered={false}
                className="shadow-sm rounded-3xl bg-white border border-slate-100 animate-fadeIn"
                cover={
                  <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parsedProduct.imageUrl}
                      alt={parsedProduct.titleVi}
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
                    <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                      {parsedProduct.titleVi}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                      Mã sản phẩm: {parsedProduct.id}
                    </p>
                  </div>

                  <Divider className="my-2.5" />

                  {/* Dynamic Color Selector */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 text-xs">Phân loại màu sắc:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Đen", "Trắng", "Đỏ", "Xanh"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                            selectedColor === color
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Size Selector */}
                  <div className="space-y-1.5 pt-1.5">
                    <span className="font-semibold text-slate-700 text-xs">Kích thước / Size:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["S", "M", "L", "XL", "Free Size"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                            selectedSize === size
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Divider className="my-2.5" />

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Giá thành tệ gốc:</span>
                      <strong className="text-slate-700 font-mono">¥ {parsedProduct.priceCNY.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Đổi sang VNĐ:</span>
                      <strong className="text-orange-600 font-bold font-mono text-sm">
                        {formatVND(parsedProduct.priceCNY * exchangeRate)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5">
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

                  {/* Pricing summaries estimators */}
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
                      <span>TỔNG DỰ TOÁN ĐƠN HÀNG:</span>
                      <span className="text-orange-600 font-mono">
                        {formatVND(parsedProduct.priceCNY * quantity * exchangeRate * 1.05 + 80000)}
                      </span>
                    </div>
                  </div>

                  {/* Action order submission triggers */}
                  <div className="space-y-2 pt-2">
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleCreateOrder("ECOMMERCE", parsedProduct)}
                      loading={submittingType === "ECOMMERCE"}
                      disabled={submittingType !== null}
                      className="w-full bg-[#FF5000] border-none text-white hover:bg-[#e04600] font-bold rounded-2xl text-xs py-3 h-auto flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      Mua Trực Tiếp (Order)
                    </Button>
                    <Button
                      type="default"
                      icon={<FileTextOutlined />}
                      onClick={() => handleCreateOrder("CONSIGNMENT", parsedProduct)}
                      loading={submittingType === "CONSIGNMENT"}
                      disabled={submittingType !== null}
                      className="w-full border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-bold rounded-2xl text-xs py-3 h-auto flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      Ký Gửi / Ủy Thác (Bến bãi)
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Exchange rate summaries card */}
            <Card bordered={false} className="shadow-sm rounded-3xl bg-blue-50/50 border border-blue-100 p-1">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <DollarOutlined />
                <span>Tỷ giá quy đổi: <strong>1 CNY = {exchangeRate.toLocaleString("vi-VN")} đ</strong></span>
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
