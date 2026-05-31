"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Select, Progress, Divider, message } from "antd";
import {
  LineChartOutlined,
  DollarOutlined,
  UserOutlined,
  CompassOutlined,
  StockOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import PageHeader from "@/components/ui/PageHeader";

const EXCHANGE_RATE = 3980;

interface VIPMerchant {
  key: string;
  cid: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpendVND: number;
  marginBenefitVND: number;
  status: "ACTIVE" | "PENDING";
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  // Financial Metrics with exact 3980 margins and conversions
  const totalRevenueVND = 25880875; 
  const totalOrders = 23;
  
  // Computed values
  const totalRevenueCNY = totalRevenueVND / EXCHANGE_RATE;
  const rawServiceFeeVND = totalRevenueVND * 0.05; // 5% fee
  const exchangeSurplusVND = totalRevenueVND * 0.025; // 2.5% surplus gained from 3980 locked rate
  const grossProfitVND = rawServiceFeeVND + exchangeSurplusVND;

  // VIP Sourcing Clients bám sát mã CID
  const vipMerchants: VIPMerchant[] = [
    {
      key: "1",
      cid: "CID-BTH-9021",
      name: "Nguyễn Văn Hùng (Hùng Sỉ)",
      phone: "0912***888",
      totalOrders: 12,
      totalSpendVND: 15480000,
      marginBenefitVND: 387000,
      status: "ACTIVE"
    },
    {
      key: "2",
      cid: "CID-BTH-4431",
      name: "Trần Thị Lan (Lan Order)",
      phone: "0988***999",
      totalOrders: 8,
      totalSpendVND: 8400875,
      marginBenefitVND: 210020,
      status: "ACTIVE"
    },
    {
      key: "3",
      cid: "CID-BTH-0882",
      name: "Hoàng Minh Đức (Đức Quảng Châu)",
      phone: "0934***777",
      totalOrders: 3,
      totalSpendVND: 2000000,
      marginBenefitVND: 50000,
      status: "PENDING"
    }
  ];

  const columns = [
    {
      title: "MÃ CID KHÁCH BUÔN",
      dataIndex: "cid",
      key: "cid",
      render: (cid: string) => <Tag color="blue" className="font-mono font-bold">{cid}</Tag>
    },
    {
      title: "TÊN KHÁCH HÀNG",
      dataIndex: "name",
      key: "name",
      className: "font-semibold text-slate-800"
    },
    {
      title: "SỐ ĐIỆN THOẠI",
      dataIndex: "phone",
      key: "phone",
      className: "font-mono"
    },
    {
      title: "TỔNG ĐƠN HÀNG",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "center" as const,
      render: (val: number) => <span className="font-bold">{val} đơn</span>
    },
    {
      title: "DOANH SỐ TIÊU DÙNG",
      dataIndex: "totalSpendVND",
      key: "totalSpendVND",
      align: "right" as const,
      render: (val: number) => <span className="font-mono text-slate-700 font-bold">{val.toLocaleString("vi-VN")} ₫</span>
    },
    {
      title: "THẶNG DƯ TỶ GIÁ 3980",
      dataIndex: "marginBenefitVND",
      key: "marginBenefitVND",
      align: "right" as const,
      render: (val: number) => <span className="text-emerald-600 font-mono font-bold">+{val.toLocaleString("vi-VN")} ₫</span>
    },
    {
      title: "TRẠNG THÁI",
      dataIndex: "status",
      key: "status",
      render: (status: "ACTIVE" | "PENDING") => (
        <Tag color={status === "ACTIVE" ? "emerald" : "orange"} className="font-bold border-none">
          {status === "ACTIVE" ? "HOẠT ĐỘNG" : "ĐỢI KẾT NỐI"}
        </Tag>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Bảng điều khiển Phân tích Chiến lược dòng tiền"
        subtitle="Hạ tầng giám sát thặng dư tỷ giá 3980 và bám đuổi hành vi Khách buôn CID đích danh"
        action={
          <Select
            value={days}
            onChange={(val) => setDays(val)}
            className="w-44"
            options={[
              { value: 7, label: "7 ngày qua" },
              { value: 30, label: "30 ngày qua" },
              { value: 90, label: "90 ngày qua" }
            ]}
          />
        }
      />

      {/* Main KPI Stats Dashboard */}
      <Row gutter={[20, 20]}>
        
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-3xl bg-white border border-slate-100 hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DOANH THU VND TRỌN GÓI</span>}
              value={totalRevenueVND}
              precision={0}
              valueStyle={{ color: "#1e293b", fontWeight: 800, fontSize: "22px", fontFamily: "monospace" }}
              prefix={<DollarOutlined className="text-blue-500 mr-1.5" />}
              suffix=" ₫"
            />
            <div className="text-[10px] text-slate-400 mt-2">
              Tương đương: <strong className="font-mono">¥ {totalRevenueCNY.toFixed(2)} CNY</strong> (Tỷ giá 3980)
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-3xl bg-white border border-slate-100 hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LỢI NHUẬN GỘP CHIẾN LƯỢC</span>}
              value={grossProfitVND}
              precision={0}
              valueStyle={{ color: "#059669", fontWeight: 800, fontSize: "22px", fontFamily: "monospace" }}
              prefix={<StockOutlined className="text-emerald-500 mr-1.5" />}
              suffix=" ₫"
            />
            <div className="text-[10px] text-slate-400 mt-2">
              Biên gộp: <strong>7.5%</strong> (Phí DV 5% + Thặng dư tỷ giá 2.5%)
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-3xl bg-white border border-slate-100 hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">THẶNG DƯ BÓC TÁCH TỶ GIÁ</span>}
              value={exchangeSurplusVND}
              precision={0}
              valueStyle={{ color: "#b45309", fontWeight: 800, fontSize: "22px", fontFamily: "monospace" }}
              prefix={<ThunderboltOutlined className="text-amber-500 mr-1.5" />}
              suffix=" ₫"
            />
            <div className="text-[10px] text-slate-400 mt-2">
              Ghi nhận từ chênh lệch dải giá quy đổi 3980
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-3xl bg-white border border-slate-100 hover:shadow-md transition-all">
            <Statistic
              title={<span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TỔNG LƯỢNG ĐƠN HOÀN TẤT</span>}
              value={totalOrders}
              precision={0}
              valueStyle={{ color: "#4f46e5", fontWeight: 800, fontSize: "22px" }}
              prefix={<CheckCircleOutlined className="text-indigo-500 mr-1.5" />}
              suffix=" Đơn"
            />
            <div className="text-[10px] text-slate-400 mt-2">
              Đơn hàng khép kín lưu trực tiếp vào Database
            </div>
          </Card>
        </Col>

      </Row>

      {/* Multicurrency cash-flow graph simulator */}
      <Card
        bordered={false}
        className="shadow-sm rounded-3xl bg-white border border-slate-100 mt-6"
        title={
          <div className="flex items-center gap-2">
            <LineChartOutlined className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">PHÂN BỔ DÒNG TIỀN THEO HẠ TẦNG TỶ GIÁ</span>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Thành phần dòng tiền VND quy đổi chuẩn (1 CNY = 3980 đ)</span>
              <strong className="text-slate-700">100% (25.880.875 ₫)</strong>
            </div>
            <Progress percent={100} strokeColor="#3b82f6" showInfo={false} className="h-3" />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Giá gốc phải thanh toán đối tác Trung Quốc (Tệ gốc quy đổi)</span>
              <strong className="text-slate-700">92.5% (23.939.809 ₫)</strong>
            </div>
            <Progress percent={92.5} strokeColor="#10b981" showInfo={false} className="h-3" />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Biên độ doanh thu ròng dịch vụ + thặng dư 3980</span>
              <strong className="text-slate-700">7.5% (1.941.066 ₫)</strong>
            </div>
            <Progress percent={7.5} strokeColor="#f59e0b" showInfo={false} className="h-3" />
          </div>
        </div>
      </Card>

      {/* VIP Sourcing Client Tracker bám sát mã CID */}
      <Card
        bordered={false}
        className="shadow-sm rounded-3xl bg-white border border-slate-100 mt-6"
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">DANH SÁCH KHÁCH BUÔN VIP THEO MÃ ĐỊNH DANH BẮT CID TRÌNH DUYỆT</span>
          </div>
        }
      >
        <Table
          dataSource={vipMerchants}
          columns={columns}
          pagination={false}
          className="rounded-2xl overflow-hidden border border-slate-50"
        />
      </Card>
    </div>
  );
}
