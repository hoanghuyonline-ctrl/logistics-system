"use client";

import { useState } from "react";
import { getPresignedUrl } from "@/app/actions/upload.action";

export default function UploadImage() {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const { url } = await getPresignedUrl(file.name, file.type);

      const res = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!res.ok) throw new Error(await res.text());
      alert("Upload thành công!");
    } catch (error) {
      console.error(error);
      alert("Lỗi 403 Forbidden hoặc lỗi mạng");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return <input type="file" accept="image/*" onChange={handleUpload} disabled={loading} />;
}
