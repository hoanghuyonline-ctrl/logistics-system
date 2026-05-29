"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Table, Tag, Card, Alert } from "antd";
function StrategicDashboardContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`/api/admin/analytics-strategic`).then((res) => res.json()).then((resData) => { setData(resData); setLoading(false); }); }, []);
  if (loading || !data) return <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>Đang đồng bộ số liệu quản trị tối cao...</div>;
  return (
    <div style={{ padding: "20px", background: "#0f172a", minHeight: "100vh", color: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)", padding: "20px", borderRadius: "8px", border: "1px solid #1e293b", marginBottom: "20px" }}>
        <h2 style={{ color: "#38bdf8", margin: 0 }}>BẮC TRUNG HẢI LOGISTICS - HỆ THỐNG QUẢN TRỊ TÀI CHÍNH & VẬN HÀNH</h2>
        <p style={{ color: "#94a3b8", margin: "4px 0 0 0" }}>Dành riêng cho Hội đồng Cổ đông và Ban Quản trị cấp cao</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "20px" }}>
        <Card style={{ background: "#1e293b", borderColor: "#334155" }} bodyStyle={{ padding: "15px" }}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>DOANH THU THUẦN (Lãi Dịch Vụ)</div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#4ade80", margin: "5px 0" }}>88,450,000 VND</div>
          <span style={{ color: "#4ade80", fontSize: "11px" }}>↑ (+12% vs t4)</span>
        </Card>
        <Card style={{ background: "#1e293b", borderColor: "#334155" }} bodyStyle={{ padding: "15px" }}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>CHI PHÍ VẬN HÀNH (OpEx Border)</div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#f59e0b", margin: "5px 0" }}>65,630,000 VND</div>
          <span style={{ color: "#f59e0b", fontSize: "11px" }}>↑ (+8% vs t4)</span>
        </Card>
        <Card style={{ background: "#1e293b", borderColor: "#334155" }} bodyStyle={{ padding: "15px" }}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>LỢI NHUẬN RÒNG (Lãi Thực)</div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#10b981", margin: "5px 0" }}>22,820,000 VND</div>
          <span style={{ color: "#10b981", fontSize: "11px" }}>↑ (+25% vs t4)</span>
        </Card>
        <Card style={{ background: "#1e293b", borderColor: "#334155" }} bodyStyle={{ padding: "15px" }}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>TỶ LỆ LỖI ĐƠN HÀNG (Error Rate)</div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#ef4444", margin: "5px 0" }}>{data.gauges.error_rate}%</div>
          <span style={{ color: "#4ade80", fontSize: "11px" }}>↓ (-2% vs t4)</span>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <Card title={<span style={{ color: "#38bdf8" }}>HÀNH LANG VẬN TẢI 5 TRẠM BIÊN GIỚI</span>} style={{ background: "#1e293b", borderColor: "#334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
            <div style={{ padding: "10px", background: "#0f172a", borderRadius: "6px", width: "18%" }}><div style={{ fontWeight: "bold", color: "#4ade80" }}>90%</div><div style={{ fontSize: "11px", color: "#94a3b8" }}>Quảng Châu<br/>12K Kg</div></div>
            <div style={{ padding: "10px", background: "#0f172a", borderRadius: "6px", width: "18%" }}><div style={{ fontWeight: "bold", color: "#f59e0b" }}>75%</div><div style={{ fontSize: "11px", color: "#94a3b8" }}>Nam Ninh<br/>8K Kg</div></div>
            <div style={{ padding: "10px", background: "#ef4444", borderRadius: "6px", width: "18%" }}><div style={{ fontWeight: "bold", color: "#ffffff" }}>60%</div><div style={{ fontSize: "11px", color: "#f8fafc" }}>Cửa Khẩu<br/>2 Xe Chờ</div></div>
            <div style={{ padding: "10px", background: "#0f172a", borderRadius: "6px", width: "18%" }}><div style={{ fontWeight: "bold", color: "#4ade80" }}>85%</div><div style={{ fontSize: "11px", color: "#94a3b8" }}>Thông Quan<br/>15K Kg</div></div>
            <div style={{ padding: "10px", background: "#1e3a8a", borderRadius: "6px", width: "18%" }}><div style={{ fontWeight: "bold", color: "#38bdf8" }}>95%</div><div style={{ fontSize: "11px", color: "#94a3b8" }}>Phân Phối VN<br/>68 Pending</div></div>
          </div>
          <div style={{ marginTop: "15px", fontSize: "12px", color: "#38bdf8", textAlign: "right", fontWeight: "bold" }}>Tiền COD dự kiến thu về Vietinbank: {data.corridor.at_vietnam_distribution.expected_cod_vnd.toLocaleString()} VND</div>
        </Card>
        <Card title={<span style={{ color: "#38bdf8" }}>CÂN ĐỐI VỐN VÀ DÒNG TIỀN MẶT</span>} style={{ background: "#1e293b", borderColor: "#334155" }}>
          <div style={{ marginBottom: "15px" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span>Tiền mặt sẵn có (Vietinbank Liquidity):</span><span style={{ color: "#4ade80", fontWeight: "bold" }}>455M VND</span></div></div>
          <div style={{ marginBottom: "15px" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span>Tổng nợ phải trả Chủ xe/Đối tác TQ:</span><span style={{ color: "#ef4444", fontWeight: "bold" }}>412M VND</span></div></div>
          <Alert message="An toàn tài chính: KHỎE (Hệ số 1.1)" type="success" showIcon style={{ background: "#064e3b", borderColor: "#047857", color: "#a7f3d0" }} />
        </Card>
      </div>
      <Card title={<span style={{ color: "#ef4444" }}>TOP 5 KHÁCH HÀNG NỢ ÂM VÍ (KIỂM SOÁT RỦI RO CÔNG NỢ: {data.financials.overdue_debts_vnd.toLocaleString()} VND)</span>} style={{ background: "#1e293b", borderColor: "#334155" }}>
        <Table dataSource={data.blacklist} rowKey="id" pagination={false} columns={[
          { title: "Mã Khách Hàng", dataIndex: "id" }, { title: "Tên Khách Hàng", dataIndex: "name" }, { title: "Số Điện Thoại", dataIndex: "phone" }, { title: "Zalo Recipient ID", dataIndex: "zaloRecipientId" }, { title: "Số Dư Ví (VND)", dataIndex: "walletBalance", render: (val: number) => <span style={{ color: "#ef4444", fontWeight: "bold" }}>{val.toLocaleString()} VND</span> }, { title: "Trạng thái", render: () => <Tag color="error">Khóa Lên Đơn & Giữ Hàng Kho VN</Tag> }
        ]} />
      </Card>
    </div>
  );
}
export default function StrategicDashboard() { return <Suspense fallback={<div>Đang tải...</div>}><StrategicDashboardContent /></Suspense>; }
