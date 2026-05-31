import React, { useState, useEffect } from "react";

export default function SourceSearch() {
  const [exchangeRate] = useState<number>(3980);
  const [cid, setCid] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const activeCid = urlParams.get("cid") || localStorage.getItem("browser_cid") || "BTH-CLIENT-ID-DEFAULT";
      setCid(activeCid);
      localStorage.setItem("browser_cid", activeCid);
    }
  }, []);

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1>Bắc Trung Hải Logistics - Sourcing Engine</h1>
      <p>Mã định danh Client ID (CID): <code>{cid}</code></p>
      <p>Tỷ giá quy đổi hoạt động: <strong>1 CNY = {exchangeRate} VND</strong></p>
    </div>
  );
}
