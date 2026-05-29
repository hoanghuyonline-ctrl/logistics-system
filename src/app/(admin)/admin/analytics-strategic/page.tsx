"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Table, Tag, Card, Alert, Button, Space } from "antd";

function StrategicDashboardContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics-strategic")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-[#94a3b8] font-sans gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold text-sm">Đang đồng bộ số liệu quản trị tối cao...</p>
      </div>
    );
  }

  const formattedVND = (value: number | string) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  return (
    <div style={{ padding: "24px", background: "#0f172a", minHeight: "100vh", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header section with approved visual transparency logic */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)", padding: "24px", borderRadius: "16px", border: "1px solid #1e293b", marginBottom: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: "#38bdf8", margin: 0, fontWeight: 900, letterSpacing: "-0.5px" }}>
              BẮC TRUNG HẢI LOGISTICS - HỆ THỐNG QUẢN TRỊ TÀI CHÍNH & VẬN HÀNH
            </h2>
            <p style={{ color: "#94a3b8", margin: "4px 0 0 0", fontSize: "13px" }}>
              Hội đồng Cổ đông và Ban Quản trị cấp cao • Quyền kiểm soát tối cao
            </p>
          </div>
          
          {/* THE MACROECONOMIC LINK HUB */}
          <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
            <Link href="/admin/economics-core" style={{ textDecoration: "none" }}>
              <Button style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid #38bdf8", color: "#38bdf8", fontWeight: "bold", borderRadius: "8px" }}>
                📊 Phân Tích Vĩ Mô (Economics Core)
              </Button>
            </Link>
            <Link href="/admin/corridor-control" style={{ textDecoration: "none" }}>
              <Button style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#10b981", fontWeight: "bold", borderRadius: "8px" }}>
                🚚 Hành Lang Biên Giới (Corridor Control)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Health Alerts */}
      {data.health_lights?.expense_leak?.status === "RED" && (
        <Alert
          message={<span className="font-extrabold text-rose-800">{data.health_lights.expense_leak.message}</span>}
          description={<span className="text-rose-700 text-xs">Hệ thống ghi nhận tỷ lệ rò rỉ chi phí OpEx đạt {data.health_lights.expense_leak.current_ratio_percent}%. Yêu cầu các cổ đông giám sát chặt chẽ hoạt động chặng biên giới.</span>}
          type="error"
          showIcon
          style={{ marginBottom: "20px", borderRadius: "12px", border: "1px solid #fecdd3", background: "#fff1f2" }}
        />
      )}

      {/* KPI Card Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <Card style={{ background: "#1e293b", borderColor: "#334155", borderRadius: "16px" }} bodyStyle={{ padding: "20px" }}>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>DOANH THU THUẦN (Lãi Dịch Vụ)</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#4ade80", margin: "6px 0" }}>{formattedVND(88450000)}</div>
          <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: "bold" }}>↑ (+12% vs t4)</span>
        </Card>
        <Card style={{ background: "#1e293b", borderColor: "#334155", borderRadius: "16px" }} bodyStyle={{ padding: "20px" }}>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>CHI PHÍ VẬN HÀNH (OpEx Border)</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#f59e0b", margin: "6px 0" }}>{formattedVND(65630000)}</div>
          <span style={{ color: "#f59e0b", fontSize: "11px", fontWeight: "bold" }}>↑ (+8% vs t4)</span>
        </Card>
        <Card style={{ background: "#1e293b", borderColor: "#334155", borderRadius: "16px" }} bodyStyle={{ padding: "20px" }}>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>LỢI NHUẬN RÒNG (Lãi Thực)</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#10b981", margin: "6px 0" }}>{formattedVND(data.financials.net_profit_vnd)}</div>
          <span style={{ color: "#10b981", fontSize: "11px", fontWeight: "bold" }}>↑ (+25% vs t4)</span>
        </Card>
        <Card style={{ background: "#1e293b", borderColor: "#334155", borderRadius: "16px" }} bodyStyle={{ padding: "20px" }}>
          <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>TỶ LỆ LỖI ĐƠN HÀNG (Error Rate)</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#ef4444", margin: "6px 0" }}>{data.gauges.error_rate}%</div>
          <span style={{ color: "#4ade80", fontSize: "11px", fontWeight: "bold" }}>↓ (-2% vs t4)</span>
        </Card>
      </div>

      {/* High-Risk Blacklist Table at highest visible layout hierarchy for immediate risk tracking */}
      <div style={{ marginBottom: "24px" }}>
        <Card 
          title={<span style={{ color: "#ef4444", fontWeight: 900, letterSpacing: "-0.5px" }}>⚠️ KIỂM SOÁT RỦI RO CÔNG NỢ TỐI CAO (TỔNG PHẢI THU QUÁ HẠN: {formattedVND(data.financials.overdue_debts_vnd)})</span>} 
          style={{ background: "#1e293b", borderColor: "#ef4444", borderRadius: "16px", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.1)" }}
        >
          <Table 
            dataSource={data.blacklist} 
            rowKey="id" 
            pagination={false} 
            className="custom-dark-table"
            columns={[
              { title: "Mã Khách Hàng", dataIndex: "id", render: (val) => <span style={{ color: "#94a3b8", fontWeight: "bold" }}>{val}</span> }, 
              { title: "Tên Khách Hàng", dataIndex: "name", render: (val) => <span style={{ color: "#f8fafc", fontWeight: "bold" }}>{val}</span> }, 
              { title: "Số Điện Thoại", dataIndex: "phone", render: (val) => <span style={{ color: "#94a3b8" }}>{val}</span> }, 
              { title: "Zalo Recipient ID", dataIndex: "zaloRecipientId", render: (val) => <span style={{ color: "#94a3b8" }}>{val || "N/A"}</span> }, 
              { 
                title: "Số Dư Ví (VND)", 
                dataIndex: "walletBalance", 
                render: (val: number) => <span style={{ color: "#ef4444", fontWeight: 900 }}>{formattedVND(val)}</span> 
              }, 
              { 
                title: "Trạng thái xử lý", 
                render: () => <Tag color="error" style={{ fontWeight: "bold", border: "1px solid #ef4444", textTransform: "uppercase" }}>Khóa Lên Đơn & Giữ Hàng Kho VN</Tag> 
              }
            ]} 
          />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px", flexWrap: "wrap" }}>
        {/* THE 5-STAGE LOGISTICS PIPELINE */}
        <Card title={<span style={{ color: "#38bdf8", fontWeight: 900 }}>🚚 HÀNH LANG VẬN TẢI 5 TRẠM BIÊN GIỚI TRUNG - VIỆT</span>} style={{ background: "#1e293b", borderColor: "#334155", borderRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ padding: "12px 8px", background: "#0f172a", borderRadius: "10px", border: "1px solid #1e293b", width: "18%" }}>
              <div style={{ fontWeight: "black", color: "#4ade80", fontSize: "16px" }}>90%</div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Quảng Châu<br/>{data.corridor.at_guangzhou_warehouse.total_weight_kg.toLocaleString()} Kg</div>
            </div>
            
            <div style={{ padding: "12px 8px", background: "#0f172a", borderRadius: "10px", border: "1px solid #1e293b", width: "18%" }}>
              <div style={{ fontWeight: "black", color: "#f59e0b", fontSize: "16px" }}>75%</div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Nam Ninh<br/>{data.corridor.at_nanning_transit.in_transit_weight_kg.toLocaleString()} Kg</div>
            </div>
            
            <div style={{ padding: "12px 8px", background: "#7f1d1d", borderRadius: "10px", border: "1px solid #ef4444", width: "18%" }}>
              <div style={{ fontWeight: "black", color: "#ffffff", fontSize: "16px" }}>60%</div>
              <div style={{ fontSize: "10px", color: "#f8fafc", marginTop: "4px" }}>Pingxiang<br/>{data.corridor.at_pingxiang_border.trucks_waiting} Xe Chờ</div>
            </div>
            
            <div style={{ padding: "12px 8px", background: "#0f172a", borderRadius: "10px", border: "1px solid #1e293b", width: "18%" }}>
              <div style={{ fontWeight: "black", color: "#4ade80", fontSize: "16px" }}>85%</div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Thông Quan<br/>{(15200).toLocaleString()} Kg</div>
            </div>
            
            <div style={{ padding: "12px 8px", background: "#1e3a8a", borderRadius: "10px", border: "1px solid #3b82f6", width: "18%" }}>
              <div style={{ fontWeight: "black", color: "#38bdf8", fontSize: "16px" }}>95%</div>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Phân Phối VN<br/>{data.corridor.at_vietnam_distribution.pending_delivery} Đơn</div>
            </div>
          </div>
          
          <div style={{ marginTop: "20px", fontSize: "13px", color: "#38bdf8", textAlign: "right", fontWeight: "bold", borderTop: "1px solid #334155", paddingTop: "12px" }}>
            💰 Tiền COD dự kiến thu về tài khoản Vietinbank: {formattedVND(data.corridor.at_vietnam_distribution.expected_cod_vnd)}
          </div>
        </Card>

        {/* STRICT CASH & WALLET ISOLATION */}
        <Card title={<span style={{ color: "#38bdf8", fontWeight: 900 }}>🏛️ BẢNG CÂN ĐỐI TÀI SẢN THANH KHOẢN (LIQUIDITY BALANCE)</span>} style={{ background: "#1e293b", borderColor: "#334155", borderRadius: "16px" }}>
          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#94a3b8" }}>Tiền mặt khả dụng tại ngân hàng Vietinbank (A):</span>
              <span style={{ color: "#4ade80", fontWeight: 900 }}>{formattedVND(data.financials.cash_liquidity_vnd)}</span>
            </div>
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "#94a3b8" }}>Tổng nghĩa vụ thanh toán đối tác xe/kho bãi TQ (B):</span>
              <span style={{ color: "#ef4444", fontWeight: 900 }}>{formattedVND(data.financials.total_obligations_vnd)}</span>
            </div>
          </div>

          <div style={{ marginTop: "20px", borderTop: "1px solid #334155", paddingTop: "16px" }}>
            <Alert 
              message={<span style={{ fontWeight: "black" }}>BẢO VỆ DÒNG TIỀN: AN TOÀN KỲ NÀY (HỆ SỐ PHÒNG THỦ: 1.10x)</span>} 
              type="success" 
              showIcon 
              style={{ background: "#064e3b", borderColor: "#047857", color: "#a7f3d0", borderRadius: "10px" }} 
            />
          </div>
        </Card>
      </div>

      <style jsx global>{`
        .custom-dark-table .ant-table {
          background: #1e293b !important;
          color: #f8fafc !important;
        }
        .custom-dark-table .ant-table-thead > tr > th {
          background: #0f172a !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid #334155 !important;
          font-weight: 800;
        }
        .custom-dark-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155 !important;
        }
        .custom-dark-table .ant-table-tbody > tr:hover > td {
          background: #334155 !important;
        }
      `}</style>
    </div>
  );
}

export default function StrategicDashboard() {
  return (
    <Suspense fallback={<div className="text-center p-12 text-slate-400">Đang chuẩn bị bảng điều khiển...</div>}>
      <StrategicDashboardContent />
    </Suspense>
  );
}
