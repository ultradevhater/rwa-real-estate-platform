"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, ArrowRight, Check, Building2, ShieldCheck, Wallet } from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";
import { LandingNavbar } from "./LandingNavbar";
import { MagneticButton } from "./MagneticButton";
import { FeatureArtifacts } from "./FeatureArtifacts";
import { ProtocolStack } from "./ProtocolStack";

gsap.registerPlugin(ScrollTrigger);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85";

const MANIFESTO_TEXTURE =
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2200&q=80";

const ROLE_PORTALS = [
  {
    key: "investor",
    badge: { vi: "NHÀ ĐẦU TƯ CÁ NHÂN", en: "INDIVIDUAL INVESTOR" },
    title: { vi: "Nhà đầu tư", en: "Investor" },
    italicSubtitle: { vi: "Đồng sở hữu linh hoạt", en: "Fractional ownership" },
    summary: {
      vi: "Hoàn tất xác minh danh tính nhanh chóng, sở hữu từng cổ phần bất động sản cao cấp và giao dịch an toàn qua cơ chế ký quỹ.",
      en: "Complete quick identity verification, acquire fractional shares in premier properties, and trade safely via escrow.",
    },
    capabilities: {
      vi: [
        "Mua cổ phần sơ cấp từ $100 mUSDC (dự án VINH01)",
        "Xác thực thanh toán 2 lớp bằng mã OTP gửi về Email",
        "Mua bán linh hoạt trên sàn thứ cấp ký quỹ & chuyển P2P",
        "Nhận cổ tức tiền thuê bằng mUSDC theo tỷ lệ nắm giữ",
      ],
      en: [
        "Invest from $100 mUSDC per share (flagship VINH01)",
        "2-step email OTP payment confirmation + digital receipts",
        "Secondary escrow marketplace & direct peer-to-peer transfer",
        "Automatic pro-rata mUSDC rental dividend payouts",
      ],
    },
    ctaLabel: { vi: "Khám phá bất động sản", en: "Explore Properties" },
    ctaHref: "/assets",
    featured: false,
    icon: Wallet,
  },
  {
    key: "issuer",
    badge: { vi: "ĐƠN VỊ PHÁT HÀNH", en: "PROPERTY ISSUER" },
    title: { vi: "Đơn vị phát hành", en: "Property Issuer" },
    italicSubtitle: { vi: "Niêm yết & gọi vốn", en: "Originate & distribute" },
    summary: {
      vi: "Đăng ký hồ sơ bất động sản, lưu trữ chứng thư pháp lý số, phát hành cổ phần hóa và quản trị đợt chào bán trực tuyến.",
      en: "Register curated properties, publish verified digital legal deeds, issue fractional shares, and manage primary offerings.",
    },
    capabilities: {
      vi: [
        "Đăng ký & phát hành cổ phần bất động sản chỉ với vài bước",
        "Đính kèm hồ sơ pháp lý (.docx) có mã đối chiếu toàn vẹn",
        "Mở/đóng đợt chào bán sơ cấp và cập nhật định giá tài sản",
        "Phân phối cổ tức mUSDC tự động tới toàn bộ cổ đông",
      ],
      en: [
        "Streamlined property registration & fractional share issuance",
        "Attach legal deeds (.docx) with instant cryptographic proof",
        "Open or close primary offerings & publish new appraisals",
        "Distribute mUSDC dividends across all verified shareholders",
      ],
    },
    ctaLabel: { vi: "Vào Cổng Phát Hành", en: "Open Issuer Portal" },
    ctaHref: "/login",
    featured: true,
    icon: Building2,
  },
  {
    key: "governance",
    badge: { vi: "KIỂM DUYỆT & QUẢN TRỊ", en: "COMPLIANCE & ADMIN" },
    title: { vi: "Tuân thủ & Quản trị", en: "Compliance & Governance" },
    italicSubtitle: { vi: "Bảo chứng an toàn", en: "Enforce integrity" },
    summary: {
      vi: "Thẩm định hồ sơ định danh KYC, quản lý danh sách nhà đầu tư hợp lệ, bảo vệ tài khoản và tra cứu toàn bộ lịch sử kiểm toán.",
      en: "Review encrypted identity applications, maintain eligible investor lists, safeguard accounts, and audit all platform actions.",
    },
    capabilities: {
      vi: [
        "Hàng đợi thẩm định CCCD 2 mặt mã hóa, chống nộp trùng",
        "Phê duyệt, từ chối hoặc thu hồi quyền giao dịch minh bạch",
        "Khóa tài khoản khẩn cấp, tạm dừng giao dịch & khôi phục cổ phần",
        "Tra cứu nhật ký kiểm toán đầy đủ mọi thao tác hệ thống",
      ],
      en: [
        "Deduplicated encrypted 2-sided ID verification queue",
        "Clear approve, reject, or revoke eligibility controls",
        "Account freeze, emergency pause & authorized share recovery",
        "Complete immutable audit history for every system action",
      ],
    },
    ctaLabel: { vi: "Vào Cổng Quản Trị", en: "Access Governance" },
    ctaHref: "/login",
    featured: false,
    icon: ShieldCheck,
  },
];

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { apiFetch } = useWeb3();
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const langKey = isEn ? "en" : "vi";
  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch("/system/sync-status")
      .then((res) => {
        if (active && typeof res?.block_number === "number") {
          setBlockNumber(res.block_number);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [apiFetch]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-reveal", {
        y: 36,
        opacity: 0,
        duration: 1.05,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
      });

      gsap.to(".manifesto-parallax-img", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: ".manifesto-section",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.from(".manifesto-word", {
        yPercent: 115,
        opacity: 0,
        duration: 0.9,
        stagger: 0.05,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".manifesto-section",
          start: "top 72%",
          once: true,
        },
      });

      gsap.from(".portal-card", {
        y: 32,
        opacity: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".portals-section",
          start: "top 78%",
          once: true,
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const legacyWords = isEn
    ? ["Legacy", "real", "estate", "asks:", "Who", "has", "$1,000,000?"]
    : ["Bất", "động", "sản", "truyền", "thống", "hỏi:", "Ai", "có", "$1,000,000?"];
  const protocolWords = isEn ? ["We", "ask:", "Who", "is"] : ["Chúng", "tôi", "hỏi:", "Ai", "đã"];
  const emphasisWords = isEn ? ["ready", "to", "co-own?"] : ["sẵn", "sàng", "đồng", "sở", "hữu?"];

  return (
    <div
      ref={rootRef}
      data-no-i18n="true"
      className="relative min-h-screen bg-[#F4F1EA] text-[#141413] font-jakarta antialiased overflow-x-clip"
    >
      {/* A. FLOATING ISLAND NAVBAR */}
      <LandingNavbar />

      {/* B. HERO SECTION (100dvh Architectural Monograph) */}
      <section className="relative h-[100dvh] min-h-[680px] w-full overflow-hidden flex items-end">
        <img
          src={HERO_IMAGE}
          alt={isEn ? "Luxury contemporary architectural residence at dusk" : "Biệt thự kiến trúc hiện đại cao cấp"}
          className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
        />

        {/* Heavy Deep Estate to Obsidian Gradient Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-[#141413] via-[#1B2A24]/80 to-[#141413]/35"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#141413] via-transparent to-[#141413]/45"
        />

        {/* Bottom-Left Third Editorial Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
          <div className="max-w-3xl space-y-6">
            {/* Live Status Pill */}
            <div className="hero-reveal inline-flex flex-wrap items-center gap-2.5 rounded-full bg-[#F4F1EA]/10 backdrop-blur-md border border-[#F4F1EA]/15 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#F4F1EA]/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isEn ? "System Operational" : "Hệ thống đang hoạt động"}</span>
              <span className="text-[#F4F1EA]/35">•</span>
              <span className="text-[#D7BC8D]">
                {blockNumber !== null
                  ? isEn
                    ? `Block #${blockNumber}`
                    : `Khối #${blockNumber}`
                  : isEn
                  ? "Verified On-Chain"
                  : "Xác thực trên chuỗi"}
              </span>
            </div>

            {/* Monumental Contrast Headline */}
            <h1 className="hero-reveal text-[#F4F1EA]">
              <span className="block font-sans font-extrabold tracking-[-0.025em] text-4xl sm:text-5xl lg:text-[62px] leading-[1.25]">
                {isEn ? "Real Estate, made" : "Sở hữu Bất động sản,"}
              </span>
              <span className="block font-sans font-extrabold tracking-[-0.025em] text-4xl sm:text-6xl lg:text-[70px] leading-[1.25] text-[#D7BC8D] mt-2.5 pb-2">
                {isEn ? "Accessible." : "Minh bạch hơn."}
              </span>
            </h1>

            <p className="hero-reveal text-sm sm:text-base text-[#F4F1EA]/80 max-w-xl leading-relaxed font-normal">
              {isEn
                ? "Invest in fractional shares of verified real estate starting from $100 mUSDC—backed by digital legal deeds, identity protection, and instant escrow settlement."
                : "Đầu tư đồng sở hữu từng cổ phần bất động sản cao cấp chỉ từ $100 mUSDC — bảo chứng bằng hồ sơ pháp lý số, xác minh danh tính và cơ chế ký quỹ an toàn."}
            </p>

            {/* Magnetic CTAs */}
            <div className="hero-reveal flex flex-wrap items-center gap-3.5 pt-2">
              <MagneticButton href="/assets" variant="bronze" size="lg">
                <span>{isEn ? "Explore Properties" : "Khám phá bất động sản"}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </MagneticButton>
              <MagneticButton href="/login" variant="outline-light" size="lg">
                <span>{isEn ? "Sign In / Try Demo" : "Đăng nhập / Trải nghiệm"}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </MagneticButton>
            </div>
          </div>

          {/* Subtle Bottom-Right Portfolio Anchor */}
          <div className="hero-reveal hidden lg:flex items-center gap-8 absolute right-8 bottom-20 font-mono text-xs text-[#F4F1EA]/70 border-l border-[#F4F1EA]/15 pl-8">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#D7BC8D]">
                {isEn ? "Flagship Asset" : "Tài sản tiêu biểu"}
              </span>
              <span className="text-sm font-semibold text-[#F4F1EA] mt-0.5 block">
                VINH01 · $1.0M
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#D7BC8D]">
                {isEn ? "Min. Share" : "Giá khởi điểm"}
              </span>
              <span className="text-sm font-semibold text-[#F4F1EA] mt-0.5 block">
                $100 mUSDC
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#D7BC8D]">
                {isEn ? "Security" : "Bảo mật"}
              </span>
              <span className="text-sm font-semibold text-[#F4F1EA] mt-0.5 block">
                KYC + 2FA OTP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* C. FEATURES (Precision Micro-UI Functional Artifacts) */}
      <FeatureArtifacts />

      {/* D. PHILOSOPHY (The Manifesto — High-Contrast Obsidian + Parallax Texture) */}
      <section className="manifesto-section relative overflow-hidden bg-[#141413] text-[#F4F1EA] py-28 sm:py-40 px-5 sm:px-8 rounded-[2.75rem] sm:rounded-[3.5rem] mx-2 sm:mx-5">
        <img
          src={MANIFESTO_TEXTURE}
          alt={isEn ? "Minimalist architectural interior shadow texture" : "Không gian kiến trúc tối giản"}
          className="manifesto-parallax-img pointer-events-none absolute -top-20 inset-x-0 w-full h-[130%] object-cover opacity-20 mix-blend-luminosity"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#141413]/85 via-[#141413]/70 to-[#141413]/95"
        />

        <div className="relative z-10 max-w-5xl mx-auto space-y-12">
          <div className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[#B8844A]">
            <span className="w-8 h-px bg-[#B8844A]" />
            <span>{isEn ? "Our Philosophy" : "Triết lý sản phẩm"}</span>
          </div>

          <div className="space-y-10">
            <p className="font-jakarta text-2xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#F4F1EA]/45 leading-[1.4] flex flex-wrap gap-x-3.5 gap-y-3">
              {legacyWords.map((word, idx) => (
                <span key={`${langKey}-l-${idx}`} className="overflow-hidden inline-block py-1.5 -my-1.5">
                  <span className="manifesto-word inline-block">{word}</span>
                </span>
              ))}
            </p>

            <h2 className="leading-[1.35] flex flex-wrap items-baseline gap-x-4 gap-y-3.5">
              {protocolWords.map((word, idx) => (
                <span key={`${langKey}-p-${idx}`} className="overflow-hidden inline-block py-2 -my-2">
                  <span className="manifesto-word inline-block font-sans text-3xl sm:text-5xl lg:text-[58px] font-extrabold tracking-[-0.025em] text-[#F4F1EA]">
                    {word}
                  </span>
                </span>
              ))}
              {emphasisWords.map((word, idx) => (
                <span key={`${langKey}-e-${idx}`} className="overflow-hidden inline-block py-2 -my-2">
                  <span className="manifesto-word inline-block font-sans text-3xl sm:text-5xl lg:text-[58px] font-extrabold tracking-[-0.025em] text-[#D7BC8D]">
                    {word}
                  </span>
                </span>
              ))}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#F4F1EA]/12 text-sm text-[#F4F1EA]/70">
            <p className="leading-relaxed">
              {isEn
                ? "Every share transfer is automatically verified against approved investor identities, preventing unauthorized transfers before they can occur."
                : "Mọi giao dịch chuyển nhượng cổ phần đều được kiểm tra tư cách nhà đầu tư tự động, ngăn chặn giao dịch trái phép ngay từ gốc."}
            </p>
            <p className="leading-relaxed">
              {isEn
                ? "Original property legal deeds are anchored with tamper-proof digital fingerprints so any shareholder can verify authenticity in one click."
                : "Hồ sơ pháp lý gốc của từng bất động sản được gắn mã xác thực chống sửa đổi, cho phép mọi cổ đông kiểm chứng dễ dàng chỉ với một cú nhấp."}
            </p>
            <p className="leading-relaxed">
              {isEn
                ? "Built for everyday usability—no browser wallet extensions required, with clear email receipts and transparent transaction records."
                : "Thiết kế thân thiện cho mọi người dùng — không cần cài đặt tiện ích ví phức tạp, nhận biên lai xác nhận rõ ràng qua Email."}
            </p>
          </div>
        </div>
      </section>

      {/* E. PROTOCOL (Sticky Stacking Archive with GSAP ScrollTrigger) */}
      <ProtocolStack />

      {/* F. PARTICIPATION PORTALS (3-Tier Institutional Role Grid) */}
      <section className="portals-section relative py-24 sm:py-32 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#B8844A] font-semibold block">
            {isEn ? "Access Portals" : "Cổng truy cập theo vai trò"}
          </span>
          <h2 className="font-sans text-3xl sm:text-5xl font-bold tracking-tight text-[#141413] leading-[1.35]">
            {isEn ? "Choose your " : "Lựa chọn vai trò "}
            <span className="font-sans font-bold text-[#1B2A24] whitespace-nowrap">
              {isEn ? "experience." : "tham gia."}
            </span>
          </h2>
          <p className="text-sm text-[#141413]/65 leading-relaxed">
            {isEn
              ? "Pre-configured accounts are ready so you can explore investing, property issuance, compliance review, and governance immediately."
              : "Hệ thống đã chuẩn bị sẵn các tài khoản dùng thử để bạn trải nghiệm ngay quy trình đầu tư, phát hành, kiểm duyệt KYC và quản trị."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {ROLE_PORTALS.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.key}
                className={`portal-card rounded-[2.5rem] p-8 sm:p-9 flex flex-col justify-between transition-transform duration-300 ${
                  portal.featured
                    ? "bg-[#1B2A24] text-[#F4F1EA] border border-[#B8844A]/40 shadow-[0_28px_70px_-20px_rgba(27,42,36,0.55)] lg:-translate-y-4"
                    : "bg-white text-[#141413] border border-[#1B2A24]/12 shadow-[0_18px_45px_-22px_rgba(20,20,19,0.12)]"
                }`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1 rounded-full font-semibold ${
                        portal.featured
                          ? "bg-[#B8844A]/20 text-[#D7BC8D] border border-[#B8844A]/35"
                          : "bg-[#F4F1EA] text-[#1B2A24] border border-[#1B2A24]/10"
                      }`}
                    >
                      {portal.badge[langKey]}
                    </span>
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        portal.featured
                          ? "bg-[#F4F1EA]/10 text-[#D7BC8D]"
                          : "bg-[#F4F1EA] text-[#1B2A24]"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                  </div>

                  <div>
                    <h3 className="font-jakarta text-2xl font-bold tracking-tight">
                      {portal.title[langKey]}
                    </h3>
                    <p
                      className={`font-sans font-medium text-sm mt-1 ${
                        portal.featured ? "text-[#D7BC8D]" : "text-[#B8844A]"
                      }`}
                    >
                      {portal.italicSubtitle[langKey]}
                    </p>
                    <p
                      className={`text-xs sm:text-[13px] leading-relaxed mt-3 ${
                        portal.featured ? "text-[#F4F1EA]/78" : "text-[#141413]/65"
                      }`}
                    >
                      {portal.summary[langKey]}
                    </p>
                  </div>

                  <ul
                    className={`space-y-3 pt-5 border-t text-xs ${
                      portal.featured
                        ? "border-[#F4F1EA]/12 text-[#F4F1EA]/85"
                        : "border-[#1B2A24]/10 text-[#141413]/75"
                    }`}
                  >
                    {portal.capabilities[langKey].map((cap) => (
                      <li key={cap} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            portal.featured ? "text-[#D7BC8D]" : "text-[#1B2A24]"
                          }`}
                          strokeWidth={2}
                        />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8 mt-6">
                  <MagneticButton
                    href={portal.ctaHref}
                    variant={portal.featured ? "bronze" : "outline-dark"}
                    size="lg"
                    className="w-full"
                  >
                    <span>{portal.ctaLabel[langKey]}</span>
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                  </MagneticButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DEEP OBSIDIAN ROUNDED-T-[4REM] FOOTER */}
      <footer className="bg-[#141413] text-[#F4F1EA] rounded-t-[3rem] sm:rounded-t-[4rem] pt-16 sm:pt-20 pb-12 px-6 sm:px-10 mt-8">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-[#F4F1EA] text-[#141413] flex items-center justify-center font-cormorant italic font-bold text-lg">
                  R
                </span>
                <div>
                  <span className="font-jakarta font-bold text-base tracking-tight block">
                    {isEn ? "RWA Registry" : "Cổng Bất Động Sản RWA"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8844A]">
                    {isEn ? "Fractional Real Estate Platform" : "Nền tảng Đồng sở hữu Bất động sản"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#F4F1EA]/60 max-w-sm leading-relaxed">
                {isEn
                  ? "Transparent fractional real-estate ownership combining digital legal deeds, identity verification, and escrow-protected liquidity."
                  : "Nền tảng đầu tư và đồng sở hữu bất động sản số hóa với chứng thư pháp lý minh bạch, xác minh danh tính và giao dịch ký quỹ an toàn."}
              </p>

              {/* Pulsing System Operational Indicator */}
              <div className="inline-flex items-center gap-2.5 rounded-full bg-[#1C1D1B] border border-[#F4F1EA]/10 px-4 py-2 font-mono text-[11px] text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isEn ? "System Operational" : "Hệ thống đang hoạt động"}
                  {blockNumber !== null
                    ? isEn
                      ? ` · Block #${blockNumber}`
                      : ` · Khối #${blockNumber}`
                    : ""}
                </span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8844A] block">
                {isEn ? "Explore" : "Khám phá"}
              </span>
              <ul className="space-y-2.5 text-[#F4F1EA]/70">
                <li>
                  <Link href="/assets" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Property Directory" : "Danh mục bất động sản"}
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Secondary Marketplace" : "Sàn giao dịch thứ cấp"}
                  </Link>
                </li>
                <li>
                  <Link href="/kyc" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Identity Verification (KYC)" : "Xác minh danh tính (KYC)"}
                  </Link>
                </li>
                <li>
                  <Link href="/wallet" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Portfolio & Transfers" : "Ví tài sản & Chuyển nhượng"}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B8844A] block">
                {isEn ? "Account & Administration" : "Tài khoản & Quản trị"}
              </span>
              <ul className="space-y-2.5 text-[#F4F1EA]/70">
                <li>
                  <Link href="/login" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Sign In / Create Account" : "Đăng nhập / Đăng ký tài khoản"}
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Management Console" : "Bảng điều khiển quản trị"}
                  </Link>
                </li>
                <li>
                  <Link href="/dividends" className="hover:text-[#F4F1EA] transition-colors">
                    {isEn ? "Dividend Payouts (mUSDC)" : "Phân phối cổ tức (mUSDC)"}
                  </Link>
                </li>
                <li>
                  <a
                    href="http://127.0.0.1:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#D7BC8D] transition-colors font-mono text-[11px]"
                  >
                    <span>{isEn ? "API Documentation" : "Tài liệu API kỹ thuật"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#F4F1EA]/10 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-[#F4F1EA]/45">
            <span>{isEn ? "RWA Registry · Official Platform" : "Cổng Bất Động Sản RWA · Bản Chính thức"}</span>
            <span>{isEn ? "Verified Digital Ownership" : "Sở hữu số hóa minh bạch"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
