"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";

interface ExportCsvButtonProps {
  endpoint: string;
  filename: string;
  label?: string;
}

export function ExportCsvButton({ endpoint, filename, label = "Xuất CSV" }: ExportCsvButtonProps) {
  const { apiUrl, sessionToken } = useWeb3();
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const url = endpoint.startsWith("http") ? endpoint : `${apiUrl}${endpoint}`;
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }
      const res = await fetch(url, { headers, credentials: "include" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error("CSV export error:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#EAE5DA]/70 hover:border-[#B8844A]/50 text-[#141413] text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5 text-[#1B2A24]/65" strokeWidth={1.75} />
      <span>{busy ? "Đang xuất..." : label}</span>
    </button>
  );
}
