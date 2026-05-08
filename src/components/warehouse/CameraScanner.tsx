"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

interface CameraScannerProps {
  onDetected: (code: string) => void;
}

export default function CameraScanner({ onDetected }: CameraScannerProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = "camera-scanner-container";

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        // 2 = SCANNING, 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore cleanup errors
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await stopScanner();

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
        },
        (decodedText) => {
          onDetected(decodedText);
        },
        () => {
          // ignore scan failures (no code found in frame)
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setError(t("scan.cameraPermissionDenied"));
      } else if (msg.includes("NotFoundError") || msg.includes("no camera")) {
        setError(t("scan.cameraNotFound"));
      } else {
        setError(t("scan.cameraError"));
      }
      setActive(false);
    }
  }, [onDetected, stopScanner, t]);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [active, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  function handleToggle() {
    setActive((prev) => !prev);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm ${
            active
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
          }`}
        >
          <span>{active ? "⏹" : "📷"}</span>
          {active ? t("scan.cameraStop") : t("scan.cameraStart")}
        </button>
        {active && (
          <span className="text-xs text-slate-500">{t("scan.cameraHint")}</span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {active && (
        <div
          id={containerId}
          ref={containerRef}
          className="rounded-xl overflow-hidden border border-slate-200"
          style={{ maxWidth: 500 }}
        />
      )}
    </div>
  );
}
