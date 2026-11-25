"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  Coins,
  Info,
  Copy,
  Check,
  ArrowLeftRight,
} from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";

interface NotificationItem {
  id: number;
  category: string;
  title: string;
  message: string;
  tx_hash?: string | null;
  is_read: boolean;
  created_at?: string | null;
}

export function NotificationBell() {
  const { currentUser, isAuthenticated, apiFetch } = useWeb3();
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeAddress = isAuthenticated && currentUser?.address ? currentUser.address : "";

  const loadNotifications = async () => {
    if (!activeAddress) {
      setOpen(false);
      setItems([]);
      setUnread(0);
      return;
    }
    try {
      const data = await apiFetch("/notifications?limit=20");
      setItems(Array.isArray(data?.items) ? data.items : []);
      setUnread(Number(data?.unread_count || 0));
    } catch {
      // Im lặng khi backend chưa sẵn sàng
    }
  };

  useEffect(() => {
    const clearNotifState = () => {
      setOpen(false);
      setItems([]);
      setUnread(0);
      setCopiedId(null);
    };

    window.addEventListener("rwa:session-cleared", clearNotifState);

    if (!activeAddress) {
      clearNotifState();
      return () => {
        window.removeEventListener("rwa:session-cleared", clearNotifState);
      };
    }

    loadNotifications();
    const timer = setInterval(loadNotifications, 5000);
    const onRefresh = () => loadNotifications();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    window.addEventListener("focus", onRefresh);
    window.addEventListener("rwa:notifications-updated", onRefresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      window.removeEventListener("rwa:session-cleared", clearNotifState);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("rwa:notifications-updated", onRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeAddress]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_read: true } : it)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
      setUnread(0);
    } catch {}
  };

  const copyTx = (id: number, tx: string) => {
    navigator.clipboard?.writeText(tx);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderIcon = (cat: string) => {
    if (cat === "transfer")
      return <ArrowLeftRight className="w-4 h-4 text-[#1E6B52] shrink-0" strokeWidth={1.75} />;
    if (cat === "kyc")
      return <ShieldCheck className="w-4 h-4 text-[#1B2A24] shrink-0" strokeWidth={1.75} />;
    if (cat === "freeze")
      return <AlertTriangle className="w-4 h-4 text-[#A63A3A] shrink-0" strokeWidth={1.75} />;
    if (cat === "dividend")
      return <Coins className="w-4 h-4 text-[#B8844A] shrink-0" strokeWidth={1.75} />;
    return <Info className="w-4 h-4 text-[#141413]/50 shrink-0" strokeWidth={1.75} />;
  };

  const formatNotifTime = (iso?: string | null) => {
    if (!iso) return "";
    const normalized = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? iso : d.toLocaleString(lang === "en" ? "en-US" : "vi-VN");
  };

  if (!isAuthenticated || !currentUser || !activeAddress) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) loadNotifications();
        }}
        title={t("notif.title")}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#FAF8F4] hover:border-[#B8844A]/60 text-[#141413] shadow-xs transition-colors"
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A63A3A] text-[#F4F1EA] text-[10px] font-semibold tabular-nums flex items-center justify-center shadow-xs">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#1B2A24]/15 rounded-2xl shadow-[0_20px_50px_-18px_rgba(20,20,19,0.28)] z-50 overflow-hidden">
          <div className="px-4 py-3 bg-[#F4F1EA]/90 border-b border-[#1B2A24]/10 flex items-center justify-between">
            <div className="text-xs font-semibold text-[#141413] tabular-nums">
              {t("notif.header")} ({unread} {t("notif.unread")})
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8844A] hover:text-[#1B2A24] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{t("notif.markAll")}</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#1B2A24]/8">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#141413]/55">
                {t("notif.empty")}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.is_read && markRead(item.id)}
                  className={`px-4 py-3 text-xs cursor-pointer transition-colors hover:bg-[#F4F1EA]/70 ${
                    !item.is_read ? "bg-[#F8EFE2]/55" : "bg-white"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{renderIcon(item.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium text-[#141413] ${!item.is_read ? "font-semibold" : ""}`}>
                          {item.title}
                        </p>
                        {!item.is_read && <span className="w-2 h-2 rounded-full bg-[#B8844A] shrink-0" />}
                      </div>
                      <p className="text-xs text-[#141413]/60 mt-0.5 leading-relaxed">{item.message}</p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[11px] text-[#141413]/45 tabular-nums">
                          {formatNotifTime(item.created_at)}
                        </span>
                        {item.tx_hash && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTx(item.id, item.tx_hash!);
                            }}
                            title={copiedId === item.id ? "Đã sao chép" : item.tx_hash}
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8844A] hover:text-[#1B2A24]"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-[#1E6B52]" strokeWidth={1.75} />
                                <span className="font-sans text-[#1E6B52] font-medium">Đã sao chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" strokeWidth={1.75} />
                                <span>{item.tx_hash.slice(0, 10)}...</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
