"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, FileCheck2, Building2, Terminal, CheckCircle2, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/* ============================================================================
   CARD 1: ASSET REGISTRY SHUFFLER (unshift(pop()) spring-bounce stack)
   ============================================================================ */
interface ShufflerItem {
  id: string;
  tag: { vi: string; en: string };
  title: { vi: string; en: string };
  metric: { vi: string; en: string };
  meta: { vi: string; en: string };
  status: { vi: string; en: string };
  icon: "building" | "shield" | "file";
}

const INITIAL_SHUFFLER_CARDS: ShufflerItem[] = [
  {
    id: "vinh01",
    tag: { vi: "TÀI SẢN TIÊU BIỂU", en: "FLAGSHIP PROPERTY" },
    title: {
      vi: "VINH01 · Định giá $1,000,000",
      en: "VINH01 · $1,000,000 Valuation",
    },
    metric: {
      vi: "$100 mUSDC / cổ phần",
      en: "$100 mUSDC / share",
    },
    meta: {
      vi: "Penthouse Vinhomes Central Park · 10,000 cổ phần",
      en: "Penthouse Vinhomes Central Park · 10,000 shares",
    },
    status: { vi: "ĐANG MỞ BÁN", en: "OPEN FOR INVESTMENT" },
    icon: "building",
  },
  {
    id: "identity",
    tag: { vi: "XÁC MINH DANH TÍNH", en: "IDENTITY PROTECTION" },
    title: {
      vi: "Sổ trắng Nhà đầu tư đã duyệt",
      en: "Verified Investor Whitelist",
    },
    metric: {
      vi: "Bảo mật CCCD mã hóa AES-256",
      en: "Encrypted 2-sided ID Vault",
    },
    meta: {
      vi: "Chỉ tài khoản đã xác minh mới được nhận và chuyển cổ phần",
      en: "Only verified accounts can hold or transfer property shares",
    },
    status: { vi: "BẢO VỆ TỰ ĐỘNG", en: "AUTO-ENFORCED" },
    icon: "shield",
  },
  {
    id: "ipfs",
    tag: { vi: "PHÁP LÝ MINH BẠCH", en: "LEGAL PROVENANCE" },
    title: {
      vi: "Hồ sơ Pháp lý số đã đối chiếu",
      en: "Verified Digital Legal Deed",
    },
    metric: {
      vi: "Mã xác thực toàn vẹn khớp 100%",
      en: "Document fingerprint 100% matched",
    },
    meta: {
      vi: "Lưu trữ vĩnh viễn trên IPFS, xem & tải bản Word gốc trực tiếp",
      en: "Stored permanently on IPFS with instant in-browser inspection",
    },
    status: { vi: "ĐÃ KIỂM CHỨNG", en: "AUTHENTICATED" },
    icon: "file",
  },
];

function AssetRegistryShuffler({ isEn }: { isEn: boolean }) {
  const [cards, setCards] = useState<ShufflerItem[]>(INITIAL_SHUFFLER_CARDS);

  const cycleCards = () => {
    setCards((prev) => {
      const next = [...prev];
      const last = next.pop();
      if (last) next.unshift(last);
      return next;
    });
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(cycleCards, 3000);
    return () => clearInterval(timer);
  }, []);

  const renderIcon = (kind: ShufflerItem["icon"]) => {
    if (kind === "building") return <Building2 className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />;
    if (kind === "shield") return <ShieldCheck className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />;
    return <FileCheck2 className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />;
  };

  const langKey = isEn ? "en" : "vi";

  return (
    <div
      onClick={cycleCards}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cycleCards();
        }
      }}
      aria-label={isEn ? "Cycle verified real estate cards" : "Chuyển đổi thẻ hồ sơ bất động sản"}
      className="group relative rounded-[2.25rem] bg-[#EAE5DA]/75 border border-[#1B2A24]/10 p-7 flex flex-col justify-between min-h-[395px] cursor-pointer select-none shadow-[0_18px_45px_-22px_rgba(20,20,19,0.16)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#B8844A] font-semibold block">
            {isEn ? "01 / Verified Assets" : "01 / Hồ sơ minh bạch"}
          </span>
          <h3 className="font-jakarta text-xl font-bold tracking-tight text-[#141413] mt-1">
            {isEn ? "Verified Property Registry" : "Sổ Đăng Ký Tài Sản Thực"}
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 text-[#1B2A24] border border-[#1B2A24]/10">
          {isEn ? "Live Stack" : "Tự động"}
        </span>
      </div>

      {/* 3 Overlapping Spring-Bounce Cards */}
      <div className="relative h-[210px] mt-6">
        {cards.map((card, index) => {
          const translateY = index * 18;
          const scale = 1 - index * 0.05;
          const opacity = 1 - index * 0.22;
          const zIndex = 30 - index * 10;

          return (
            <div
              key={card.id}
              style={{
                transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                opacity,
                zIndex,
                transition: "transform 680ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease",
              }}
              className="absolute inset-x-0 top-0 rounded-[1.5rem] bg-white border border-[#1B2A24]/10 p-5 shadow-[0_14px_32px_-14px_rgba(20,20,19,0.18)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#F4F1EA] flex items-center justify-center">
                    {renderIcon(card.icon)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1B2A24]/65 font-semibold">
                    {card.tag[langKey]}
                  </span>
                </div>
                <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full bg-[#1B2A24]/8 text-[#1B2A24] font-semibold">
                  {card.status[langKey]}
                </span>
              </div>

              <div className="mt-3.5">
                <p className="font-jakarta text-sm font-bold text-[#141413] tracking-tight">
                  {card.title[langKey]}
                </p>
                <p className="font-mono text-xs font-semibold text-[#B8844A] mt-1 tabular-nums">
                  {card.metric[langKey]}
                </p>
                <p className="text-[11.5px] text-[#141413]/65 mt-1.5 leading-relaxed line-clamp-1">
                  {card.meta[langKey]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#141413]/65 leading-relaxed pt-2">
        {isEn
          ? "Valuation data, investor eligibility, and legal ownership deeds stay continuously synchronized and verifiable."
          : "Định giá bất động sản, trạng thái xác minh nhà đầu tư và chứng thư pháp lý được đồng bộ minh bạch theo thời gian thực."}
      </p>
    </div>
  );
}

/* ============================================================================
   CARD 2: SETTLEMENT TELEMETRY TYPEWRITER (Live Feed + blinking bronze cursor)
   ============================================================================ */
const TELEMETRY_MESSAGES = [
  {
    cmd: {
      vi: "Xác minh danh tính nhà đầu tư 0x90F7...b906 → Hợp lệ",
      en: "Investor identity verified (0x90F7...b906) → Approved",
    },
    meta: {
      vi: "ĐÃ CẤP QUYỀN GIAO DỊCH · GHI NHẬN TRÊN CHUỖI",
      en: "ELIGIBLE TO TRADE · RECORDED ON-CHAIN",
    },
  },
  {
    cmd: {
      vi: "Mua 50 cổ phần VINH01 ($5,000 mUSDC) → Thành công",
      en: "Purchased 50 VINH01 shares ($5,000 mUSDC) → Confirmed",
    },
    meta: {
      vi: "ĐÃ XÁC THỰC MÃ OTP EMAIL · GỬI BIÊN LAI",
      en: "2FA EMAIL OTP VERIFIED · RECEIPT SENT",
    },
  },
  {
    cmd: {
      vi: "Khớp lệnh sàn thứ cấp ký quỹ #12 → Hoàn tất",
      en: "Secondary escrow order #12 matched → Settled",
    },
    meta: {
      vi: "THANH TOÁN TỰ ĐỘNG · KHÔNG RỦI RO ĐỐI TÁC",
      en: "ATOMIC SETTLEMENT · ZERO COUNTERPARTY RISK",
    },
  },
  {
    cmd: {
      vi: "Chia cổ tức tiền thuê VINH01 → Đã chuyển mUSDC",
      en: "VINH01 rental dividend payout → mUSDC distributed",
    },
    meta: {
      vi: "CHIA THEO TỶ LỆ SỞ HỮU · LƯU NHẬT KÝ KIỂM TOÁN",
      en: "PRO-RATA PAYOUT · AUDIT LOGGED",
    },
  },
];

function TelemetryTypewriter({ isEn }: { isEn: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "clearing">("typing");

  const langKey = isEn ? "en" : "vi";
  const activeCmd = TELEMETRY_MESSAGES[msgIdx].cmd[langKey];
  const activeMeta = TELEMETRY_MESSAGES[msgIdx].meta[langKey];

  useEffect(() => {
    setCharCount(0);
    setPhase("typing");
  }, [langKey]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCharCount(activeCmd.length);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (charCount < activeCmd.length) {
        timeout = setTimeout(() => setCharCount((c) => c + 1), 32);
      } else {
        timeout = setTimeout(() => setPhase("holding"), 1900);
      }
    } else if (phase === "holding") {
      timeout = setTimeout(() => setPhase("clearing"), 350);
    } else {
      timeout = setTimeout(() => {
        setCharCount(0);
        setMsgIdx((idx) => (idx + 1) % TELEMETRY_MESSAGES.length);
        setPhase("typing");
      }, 240);
    }

    return () => clearTimeout(timeout);
  }, [charCount, phase, msgIdx, activeCmd.length]);

  const previousMsgs = [
    TELEMETRY_MESSAGES[(msgIdx + TELEMETRY_MESSAGES.length - 1) % TELEMETRY_MESSAGES.length],
    TELEMETRY_MESSAGES[(msgIdx + TELEMETRY_MESSAGES.length - 2) % TELEMETRY_MESSAGES.length],
  ];

  return (
    <div className="rounded-[2.25rem] bg-[#141413] text-[#F4F1EA] border border-[#F4F1EA]/10 p-7 flex flex-col justify-between min-h-[395px] shadow-[0_22px_50px_-20px_rgba(20,20,19,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#B8844A] font-semibold block">
            {isEn ? "02 / Settlement Activity" : "02 / Nhật ký giao dịch"}
          </span>
          <h3 className="font-jakarta text-xl font-bold tracking-tight text-[#F4F1EA] mt-1">
            {isEn ? "Live Activity Stream" : "Theo Dõi Giao Dịch Trực Tiếp"}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {isEn ? "Live Feed" : "Đang hoạt động"}
        </span>
      </div>

      {/* Terminal Telemetry Surface */}
      <div className="mt-6 rounded-[1.5rem] bg-[#1C1D1B] border border-[#F4F1EA]/10 p-5 font-mono space-y-4">
        <div className="flex items-center justify-between text-[10px] text-[#F4F1EA]/45 border-b border-[#F4F1EA]/10 pb-2.5">
          <span className="inline-flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#B8844A]" />
            <span>{isEn ? "settlement.ledger" : "so_cai_giao_dich"}</span>
          </span>
          <span>ON-CHAIN</span>
        </div>

        {/* Live Typing Line */}
        <div className="min-h-[64px]">
          <div className="text-xs sm:text-[13px] text-[#F4F1EA] leading-relaxed break-words">
            <span className="text-[#B8844A] mr-1.5">&gt;</span>
            <span>{activeCmd.slice(0, charCount)}</span>
            <span className="inline-block w-2 h-3.5 ml-0.5 align-middle bg-[#B8844A] animate-pulse" />
          </div>
          <div className="text-[10px] text-emerald-300/80 mt-2 tracking-wider uppercase">
            {charCount >= activeCmd.length
              ? activeMeta
              : isEn
              ? "CONFIRMING TRANSACTION..."
              : "ĐANG XÁC NHẬN GIAO DỊCH..."}
          </div>
        </div>

        {/* Settled Log Preview */}
        <div className="space-y-2 pt-3 border-t border-[#F4F1EA]/10 text-[10.5px] text-[#F4F1EA]/50">
          {previousMsgs.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 truncate">
              <span className="truncate">{item.cmd[langKey]}</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400/75 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#F4F1EA]/65 leading-relaxed pt-2">
        {isEn
          ? "Every purchase, share transfer, and dividend payout is automatically signed, confirmed, and stored in an immutable audit trail."
          : "Mọi giao dịch mua cổ phần, chuyển nhượng và chia cổ tức đều được xác thực hai lớp, ghi nhận minh bạch và lưu vết kiểm toán."}
      </p>
    </div>
  );
}

/* ============================================================================
   CARD 3: AUTOMATED GOVERNANCE CURSOR (5-stage pipeline + SVG pointer loop)
   ============================================================================ */
const PIPELINE_STAGES = [
  { key: "KYC", vi: "KYC", en: "KYC" },
  { key: "MINT", vi: "PHÁT HÀNH", en: "ISSUE" },
  { key: "SALE", vi: "MỞ BÁN", en: "OFFER" },
  { key: "ESCROW", vi: "KÝ QUỸ", en: "ESCROW" },
  { key: "YIELD", vi: "CỔ TỨC", en: "YIELD" },
];

type CursorPhase = "enter" | "hover-stage" | "click-stage" | "hover-save" | "click-save" | "fade";

function GovernanceCursorScheduler({ isEn }: { isEn: boolean }) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [activeStages, setActiveStages] = useState<number[]>([0, 1]);
  const [phase, setPhase] = useState<CursorPhase>("enter");
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const runLoop = async () => {
      let stepIndex = 2;
      while (!cancelled) {
        setTargetIdx(stepIndex);
        setSavedToast(false);
        setPhase("enter");
        await wait(500);
        if (cancelled) break;

        setPhase("hover-stage");
        await wait(650);
        if (cancelled) break;

        setPhase("click-stage");
        setActiveStages((prev) => (prev.includes(stepIndex) ? prev : [...prev, stepIndex]));
        await wait(420);
        if (cancelled) break;

        setPhase("hover-save");
        await wait(680);
        if (cancelled) break;

        setPhase("click-save");
        setSavedToast(true);
        await wait(750);
        if (cancelled) break;

        setPhase("fade");
        await wait(750);
        if (cancelled) break;

        stepIndex = (stepIndex + 1) % PIPELINE_STAGES.length;
        if (stepIndex === 0) {
          setActiveStages([]);
        }
      }
    };

    runLoop();
    return () => {
      cancelled = true;
    };
  }, []);

  const stageLeftPct = 10 + targetIdx * 20;
  const cursorStyle: React.CSSProperties = (() => {
    if (phase === "enter") {
      return { left: "88%", top: "12%", opacity: 0, transform: "scale(1)" };
    }
    if (phase === "hover-stage") {
      return { left: `${stageLeftPct}%`, top: "38%", opacity: 1, transform: "scale(1)" };
    }
    if (phase === "click-stage") {
      return { left: `${stageLeftPct}%`, top: "38%", opacity: 1, transform: "scale(0.84)" };
    }
    if (phase === "hover-save") {
      return { left: "74%", top: "78%", opacity: 1, transform: "scale(1)" };
    }
    if (phase === "click-save") {
      return { left: "74%", top: "78%", opacity: 1, transform: "scale(0.84)" };
    }
    return { left: "82%", top: "86%", opacity: 0, transform: "scale(0.95)" };
  })();

  return (
    <div className="rounded-[2.25rem] bg-[#EAE5DA]/75 border border-[#1B2A24]/10 p-7 flex flex-col justify-between min-h-[395px] shadow-[0_18px_45px_-22px_rgba(20,20,19,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#B8844A] font-semibold block">
            {isEn ? "03 / End-to-End Flow" : "03 / Quy trình khép kín"}
          </span>
          <h3 className="font-jakarta text-xl font-bold tracking-tight text-[#141413] mt-1">
            {isEn ? "Guided Ownership Lifecycle" : "Vòng Đời Đầu Tư Trọn Vẹn"}
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 text-[#1B2A24] border border-[#1B2A24]/10">
          {isEn ? "5 Steps" : "5 Bước"}
        </span>
      </div>

      {/* Interactive Stage Matrix + Automated SVG Cursor */}
      <div className="relative mt-6 rounded-[1.5rem] bg-white border border-[#1B2A24]/10 p-5 overflow-hidden shadow-[0_14px_32px_-16px_rgba(20,20,19,0.12)]">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-[#141413]/50 mb-3.5">
          <span>{isEn ? "Lifecycle Stages" : "Các giai đoạn"}</span>
          <span>
            {activeStages.length}/5 {isEn ? "Active" : "Hoàn tất"}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isActive = activeStages.includes(idx);
            const isClicking = phase === "click-stage" && targetIdx === idx;
            return (
              <div
                key={stage.key}
                className={`rounded-xl py-3 px-1 text-center border transition-all duration-300 ${
                  isActive
                    ? "bg-[#1B2A24] text-[#F4F1EA] border-[#1B2A24] shadow-sm"
                    : "bg-[#F4F1EA]/80 text-[#141413]/65 border-[#1B2A24]/10"
                } ${isClicking ? "scale-90" : "scale-100"}`}
              >
                <div className="font-mono text-[9px] font-bold tracking-tight truncate">
                  {isEn ? stage.en : stage.vi}
                </div>
                <div
                  className={`w-1.5 h-1.5 rounded-full mx-auto mt-2 transition-colors ${
                    isActive ? "bg-[#B8844A]" : "bg-[#141413]/15"
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3.5 border-t border-[#1B2A24]/10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#141413]/60">
            <Lock className="w-3.5 h-3.5 text-[#B8844A]" />
            <span>
              {savedToast
                ? isEn
                  ? "Verified & logged"
                  : "Đã xác nhận & lưu sổ"
                : isEn
                ? "2FA OTP Protected"
                : "Bảo vệ 2 lớp OTP"}
            </span>
          </div>
          <div
            className={`px-3.5 py-1.5 rounded-full font-jakarta text-[11px] font-semibold transition-all duration-200 ${
              phase === "click-save"
                ? "scale-90 bg-[#B8844A] text-[#F4F1EA]"
                : savedToast
                ? "bg-[#1B2A24] text-[#F4F1EA]"
                : "bg-[#F4F1EA] text-[#141413] border border-[#1B2A24]/15"
            }`}
          >
            {savedToast
              ? isEn
                ? "Confirmed ✓"
                : "Đã lưu ✓"
              : isEn
              ? "Confirm"
              : "Xác nhận"}
          </div>
        </div>

        {/* Automated SVG Pointer Cursor */}
        <div
          aria-hidden="true"
          style={{
            ...cursorStyle,
            transition:
              "left 600ms cubic-bezier(0.22,1,0.36,1), top 600ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease, transform 200ms ease",
          }}
          className="pointer-events-none absolute z-20 -translate-x-1 -translate-y-1 drop-shadow-md"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5.5 3.5L18.5 11.2L12.6 13.1L10.3 19.2L5.5 3.5Z"
              fill="#B8844A"
              stroke="#141413"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <p className="text-xs text-[#141413]/65 leading-relaxed pt-2">
        {isEn
          ? "Seamless role-based workflows guide every participant from identity verification and primary purchase to dividend payouts."
          : "Quy trình phân quyền rõ ràng dẫn dắt liền mạch từ bước xác minh tài khoản, mua cổ phần sơ cấp đến giao dịch ký quỹ và nhận cổ tức."}
      </p>
    </div>
  );
}

export function FeatureArtifacts() {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <section
      id="instruments"
      data-no-i18n="true"
      className="relative py-24 sm:py-32 px-5 sm:px-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div className="max-w-2xl space-y-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#B8844A] font-semibold block">
            {isEn ? "Core Platform Pillars" : "Trụ cột vận hành nền tảng"}
          </span>
          <h2 className="font-sans text-3xl sm:text-5xl font-bold tracking-tight text-[#141413] leading-[1.35]">
            {isEn ? "Institutional trust, " : "Chuẩn mực minh bạch, "}
            <span className="font-sans font-bold text-[#B8844A]">
              {isEn ? "made effortless." : "vận hành trực quan."}
            </span>
          </h2>
        </div>
        <p className="text-sm text-[#141413]/65 max-w-sm leading-relaxed">
          {isEn
            ? "Smart-contract security, encrypted identity verification, and digital legal deeds working quietly behind an intuitive interface."
            : "Hợp đồng thông minh kiểm soát tự động, kho hồ sơ định danh mã hóa và chứng thư pháp lý số hoạt động đồng bộ sau giao diện tinh gọn."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AssetRegistryShuffler isEn={isEn} />
        <TelemetryTypewriter isEn={isEn} />
        <GovernanceCursorScheduler isEn={isEn} />
      </div>
    </section>
  );
}
