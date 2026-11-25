"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";

interface SyncReport {
  status: "SYNCED" | "DRIFT_DETECTED" | "OFFLINE";
  rpc_connected: boolean;
  block_number: number;
  drift_count: number;
}

export function SyncHealthBadge({ compact = false }: { compact?: boolean }) {
  const { currentUser, apiFetch, refreshBalances } = useWeb3();
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [report, setReport] = useState<SyncReport | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadSync = async () => {
    try {
      const data = await apiFetch("/system/sync-status");
      if (data?.status) setReport(data);
    } catch {
      setReport({ status: "OFFLINE", rpc_connected: false, block_number: 0, drift_count: 0 });
    }
  };

  useEffect(() => {
    loadSync();
    const timer = setInterval(loadSync, 20000);
    return () => clearInterval(timer);
  }, [currentUser?.address]);

  const handleReconcile = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch("/system/reconcile", { method: "POST" });
      if (res?.sync_report) setReport(res.sync_report);
      await refreshBalances();
    } catch {
      await loadSync();
    } finally {
      setSyncing(false);
    }
  };

  if (!report) return null;

  const canReconcile = ["admin", "compliance", "issuer"].includes(currentUser?.role_label || "");

  if (report.status === "SYNCED") {
    if (compact) {
      return (
        <button
          type="button"
          onClick={loadSync}
          title={
            isEn
              ? `Data synchronized (Block #${report.block_number})`
              : `Dữ liệu đã đồng bộ hoàn toàn (Khối #${report.block_number})`
          }
          className="flex items-center justify-center w-full py-1.5 rounded-xl bg-[#F4F1EA]/[0.06] hover:bg-[#F4F1EA]/[0.12] text-emerald-300 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={loadSync}
        title={
          isEn
            ? `Data synchronized (Block #${report.block_number})`
            : `Dữ liệu đã đồng bộ hoàn toàn (Khối #${report.block_number})`
        }
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#F4F1EA]/[0.05] hover:bg-[#F4F1EA]/[0.09] border border-[#F4F1EA]/10 text-[11px] text-[#F4F1EA]/80 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate font-medium text-[#F4F1EA]">
            {isEn ? "Data Synced" : "Đã đồng bộ"}
          </span>
        </span>
        <span className="font-mono tabular-nums text-[10.5px] text-[#D7BC8D] font-medium shrink-0">
          #{report.block_number}
        </span>
      </button>
    );
  }

  if (report.status === "DRIFT_DETECTED") {
    return (
      <button
        type="button"
        disabled={syncing || !canReconcile}
        onClick={canReconcile ? handleReconcile : loadSync}
        title={
          canReconcile
            ? `Phát hiện ${report.drift_count} bản ghi cần đồng bộ lại. Nhấn để đồng bộ ngay.`
            : `Phát hiện ${report.drift_count} bản ghi chưa đồng bộ.`
        }
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#B8844A]/20 hover:bg-[#B8844A]/30 border border-[#B8844A]/35 text-[11px] text-[#EED7B2] font-medium transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          {syncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.75} />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D7BC8D]" />
          )}
          {!compact && (
            <span className="truncate">
              {syncing
                ? isEn
                  ? "Syncing..."
                  : "Đang đồng bộ..."
                : isEn
                ? `Needs Sync (${report.drift_count})`
                : `Cần đồng bộ (${report.drift_count})`}
            </span>
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={loadSync}
      title={isEn ? "Blockchain service is currently offline" : "Dịch vụ chuỗi khối đang ngoại tuyến"}
      className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#A63A3A]/20 border border-[#A63A3A]/35 text-[11px] text-rose-200 font-medium"
    >
      <span className="inline-flex items-center gap-1.5 truncate">
        <WifiOff className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
        {!compact && <span className="truncate">{isEn ? "Network Offline" : "Mất kết nối"}</span>}
      </span>
    </button>
  );
}
