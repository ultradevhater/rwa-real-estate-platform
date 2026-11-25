"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";
import { StatusBadge, BadgeVariant } from "@/components/ui/StatusBadge";
import { CopyAddress } from "@/components/ui/CopyAddress";
import {
  ChevronDown,
  Wallet,
  ShieldCheck,
  Store,
  LayoutDashboard,
  Building2,
  KeyRound,
  LogOut,
  UserCircle2,
  Mail,
} from "lucide-react";

const ROLE_META: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badgeVariant: BadgeVariant;
    avatarBg: string;
    defaultRoute: string;
  }
> = {
  admin: {
    label: "Quản trị hệ thống",
    shortLabel: "Quản trị viên",
    badgeVariant: "purple",
    avatarBg: "bg-[#141413] text-[#F4F1EA] ring-1 ring-[#B8844A]/50",
    defaultRoute: "/admin?tab=dashboard",
  },
  issuer: {
    label: "Đơn vị phát hành",
    shortLabel: "Phát hành",
    badgeVariant: "warning",
    avatarBg: "bg-[#B8844A] text-[#F4F1EA]",
    defaultRoute: "/admin?tab=issuer-dashboard",
  },
  compliance: {
    label: "Kiểm duyệt KYC",
    shortLabel: "Kiểm duyệt",
    badgeVariant: "info",
    avatarBg: "bg-[#1B2A24] text-[#F4F1EA]",
    defaultRoute: "/admin?tab=compliance-dashboard",
  },
  investor: {
    label: "Tài khoản Nhà đầu tư",
    shortLabel: "Nhà đầu tư",
    badgeVariant: "success",
    avatarBg: "bg-[#1E6B52] text-[#F4F1EA]",
    defaultRoute: "/assets",
  },
};

const ACRONYM_STOPWORDS = new Set(["BĐS", "KYC", "RWA", "EOA", "VIP"]);

export function getInitials(name?: string | null, username?: string | null): string {
  let raw = (name || username || "U").trim();
  if (raw.includes("—")) {
    const afterDash = raw.split("—").pop()?.trim();
    if (afterDash) raw = afterDash;
  }
  raw = raw.replace(/\([^)]*\)/g, " ").replace(/#\S+/g, " ");
  let words = raw
    .split(/\s+/)
    .map((token) =>
      Array.from(token)
        .filter((ch) => ch.toLowerCase() !== ch.toUpperCase())
        .join("")
    )
    .filter(Boolean);
  if (words.length >= 3) {
    const filtered = words.filter((w) => !ACRONYM_STOPWORDS.has(w.toUpperCase()));
    if (filtered.length >= 2) words = filtered;
  }
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  const cleanUser = (username || "US").replace(/[^A-Za-z0-9]/g, "");
  return (cleanUser.slice(0, 2) || "U").toUpperCase();
}

export function AccountDropdown() {
  const router = useRouter();
  const {
    currentUser,
    usdcBalance,
    isKYCVerified,
    isFrozen,
    claimFaucet,
    logoutSession,
  } = useWeb3();
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!currentUser) return null;

  const role = currentUser.role_label || "investor";
  const meta = ROLE_META[role] || ROLE_META.investor;
  const initials = getInitials(currentUser.display_name, currentUser.username);

  const handleLogout = async () => {
    setOpen(false);
    await logoutSession();
    router.push("/login");
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 text-left transition-colors ${
          open
            ? "border-[#B8844A] bg-[#F8EFE2]/70 ring-2 ring-[#B8844A]/15"
            : "border-[#1B2A24]/15 bg-white hover:border-[#B8844A]/60 hover:bg-[#FAF8F4] shadow-xs"
        }`}
      >
        <div className="relative shrink-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold tracking-tight shadow-xs ${meta.avatarBg}`}
          >
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1E6B52] border-2 border-white" />
        </div>

        <div className="hidden sm:flex flex-col leading-tight min-w-0">
          <span className="text-xs font-semibold text-[#141413] max-w-[145px] truncate">
            {currentUser.display_name}
          </span>
          <span className="text-[11px] font-medium text-[#141413]/55 flex items-center gap-1">
            <span>{t(`role.${role}.short`, meta.shortLabel)}</span>
            {currentUser.username && (
              <span className="font-mono text-[#141413]/40">· @{currentUser.username}</span>
            )}
          </span>
        </div>

        <ChevronDown
          strokeWidth={1.75}
          className={`w-4 h-4 text-[#141413]/45 transition-transform duration-150 ${
            open ? "rotate-180 text-[#B8844A]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[360px] bg-white border border-[#1B2A24]/15 rounded-2xl shadow-[0_20px_50px_-18px_rgba(20,20,19,0.28)] z-50 overflow-hidden"
        >
          {/* Header: Account Summary */}
          <div className="p-4 bg-[#F4F1EA]/90 border-b border-[#1B2A24]/10 space-y-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 shadow-xs ${meta.avatarBg}`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-[#141413] truncate">
                  {currentUser.display_name}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <StatusBadge variant={meta.badgeVariant}>
                    {t(`role.${role}.label`, meta.label)}
                  </StatusBadge>
                  {currentUser.username && (
                    <span className="font-mono text-xs text-[#141413]/55">
                      @{currentUser.username}
                    </span>
                  )}
                </div>
                {currentUser.email && (
                  <div className="flex items-center gap-1 text-xs text-[#141413]/55 mt-1 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Address Row */}
            {currentUser.address && (
              <div className="flex items-center justify-between gap-2 bg-white border border-[#1B2A24]/10 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-[#141413]/55 font-medium shrink-0">{t("account.walletLabel")}</span>
                <CopyAddress
                  value={currentUser.address}
                  prefixLen={8}
                  suffixLen={6}
                  textClassName="text-xs font-medium text-[#141413]"
                />
              </div>
            )}

            {/* Investor Quick Balance & KYC Status */}
            {role === "investor" && (
              <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                <div className="flex items-center gap-1.5 tabular-nums whitespace-nowrap">
                  <span className="text-[#141413]/55">{t("account.balanceLabel")}</span>
                  <strong className="text-[#141413] font-semibold font-mono">
                    ${Number(usdcBalance).toLocaleString("en-US")} mUSDC
                  </strong>
                  <button
                    type="button"
                    onClick={() => claimFaucet()}
                    className="px-2 py-0.5 rounded-full bg-[#1B2A24]/8 hover:bg-[#1B2A24] text-[#1B2A24] hover:text-[#F4F1EA] text-[10.5px] font-semibold transition-colors"
                  >
                    + Nạp thử
                  </button>
                </div>
                {isFrozen ? (
                  <StatusBadge variant="danger" dot>
                    {t("nav.frozen")}
                  </StatusBadge>
                ) : isKYCVerified ? (
                  <StatusBadge variant="success" dot>
                    {t("nav.whitelisted")}
                  </StatusBadge>
                ) : (
                  <StatusBadge variant="warning" dot>
                    {t("nav.pendingKyc")}
                  </StatusBadge>
                )}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1.5 text-sm text-[#141413]/80">
            {role === "investor" ? (
              <>
                <Link
                  href="/wallet"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
                >
                  <Wallet className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />
                  <span>{t("account.myWallet")}</span>
                </Link>
                <Link
                  href="/kyc"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#1E6B52]" strokeWidth={1.75} />
                  <span>{t("account.myKyc")}</span>
                </Link>
                <Link
                  href="/marketplace"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
                >
                  <Store className="w-4 h-4 text-[#B8844A]" strokeWidth={1.75} />
                  <span>{t("account.marketplace")}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={meta.defaultRoute}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />
                  <span>
                    {t("account.dashboard")} ({t(`role.${role}.short`, meta.shortLabel)})
                  </span>
                </Link>
                <Link
                  href="/assets"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#1E6B52]" strokeWidth={1.75} />
                  <span>{t("account.assets")}</span>
                </Link>
              </>
            )}

            <div className="my-1 border-t border-[#1B2A24]/8" />

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
            >
              <KeyRound className="w-4 h-4 text-[#141413]/50" strokeWidth={1.75} />
              <span>{t("account.profilePassword")}</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
            >
              <UserCircle2 className="w-4 h-4 text-[#141413]/50" strokeWidth={1.75} />
              <span>{t("account.switchAccount")}</span>
            </Link>
          </div>

          {/* Footer: Logout */}
          <div className="p-2.5 bg-[#F4F1EA]/80 border-t border-[#1B2A24]/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#A63A3A] bg-[#FBF0F0] border border-[#A63A3A]/20 hover:bg-[#F5E0E0] transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
