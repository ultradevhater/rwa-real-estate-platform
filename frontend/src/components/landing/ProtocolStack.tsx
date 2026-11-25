"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/context/LanguageContext";

gsap.registerPlugin(ScrollTrigger);

interface ProtocolStep {
  number: string;
  contract: { vi: string; en: string };
  title: { vi: string; en: string };
  italicWord: { vi: string; en: string };
  description: { vi: string; en: string };
  specs: { vi: string[]; en: string[] };
  bg: string;
  text: string;
  accent: string;
  artifact: "seal" | "laser" | "waveform";
}

const PROTOCOL_STEPS: ProtocolStep[] = [
  {
    number: "01",
    contract: {
      vi: "Xác minh Danh tính · Kho KYC Mã hóa AES-256",
      en: "Identity Verification · Encrypted KYC Vault",
    },
    title: { vi: "Định danh & An toàn", en: "Identity & Trusted" },
    italicWord: { vi: "Pháp lý.", en: "Compliance." },
    description: {
      vi: "Nhà đầu tư gửi ảnh CCCD 2 mặt được mã hóa bảo mật tuyệt đối. Sau khi bộ phận kiểm duyệt phê duyệt, tài khoản được cấp quyền tự động để mua bán và nắm giữ cổ phần hợp lệ.",
      en: "Investors submit encrypted 2-sided ID documents into our secure KYC Vault. Once approved by a Compliance Officer, their account is automatically cleared for compliant ownership and trading.",
    },
    specs: {
      vi: [
        "Lưu trữ ảnh định danh mã hóa chuẩn AES-256-GCM",
        "Kiểm soát quy trình xét duyệt chặt chẽ, chống nộp trùng lặp",
        "Tự động chặn giao dịch trái phép từ tài khoản chưa xác minh",
      ],
      en: [
        "Encrypted 2-sided ID storage with AES-256-GCM protection",
        "Deduplicated review queue with strict approval history",
        "Automatic transfer protection against unverified accounts",
      ],
    },
    bg: "bg-[#F4F1EA]",
    text: "text-[#141413]",
    accent: "text-[#B8844A]",
    artifact: "seal",
  },
  {
    number: "02",
    contract: {
      vi: "Chia nhỏ Cổ phần · Chứng thư Pháp lý IPFS",
      en: "Fractional Shares · IPFS Digital Legal Deeds",
    },
    title: { vi: "Số hóa Tài sản &", en: "Fractional Ownership &" },
    italicWord: { vi: "Chứng thư số.", en: "Legal Proof." },
    description: {
      vi: "Đơn vị phát hành đăng ký bất động sản, đính kèm bộ hồ sơ pháp lý bản gốc (.docx) và chia thành các cổ phần chuẩn hóa. Nhà đầu tư có thể đối chiếu mã xác thực tài liệu bất kỳ lúc nào.",
      en: "Issuers register curated properties, attach original legal deeds (.docx) pinned to IPFS, and issue fractional shares backed by a permanent cryptographic fingerprint verifiable in one click.",
    },
    specs: {
      vi: [
        "Bất động sản tiêu biểu VINH01 định giá $1,000,000 (10,000 cổ phần)",
        "Xem trực tiếp hồ sơ pháp lý A4 trên trình duyệt & tải tệp gốc",
        "Cập nhật thẩm định giá minh bạch kèm chứng thư độc lập",
      ],
      en: [
        "Flagship VINH01 property valued at $1,000,000 (10,000 shares)",
        "Inspect A4 legal deeds in-browser or download original Word files",
        "Transparent independent appraisal updates tracked over time",
      ],
    },
    bg: "bg-[#1B2A24]",
    text: "text-[#F4F1EA]",
    accent: "text-[#D7BC8D]",
    artifact: "laser",
  },
  {
    number: "03",
    contract: {
      vi: "Mở bán Sơ cấp · Sàn Ký quỹ · Cổ tức mUSDC",
      en: "Primary Offering · Escrow Market · mUSDC Yield",
    },
    title: { vi: "Thanh khoản Ký quỹ &", en: "Escrow Liquidity &" },
    italicWord: { vi: "Cổ tức.", en: "Dividends." },
    description: {
      vi: "Mua cổ phần với xác thực mã OTP 6 số gửi về Email, giao dịch linh hoạt trên sàn thứ cấp có cơ chế ký quỹ an toàn và nhận cổ tức mUSDC tự động theo tỷ lệ nắm giữ.",
      en: "Purchase shares protected by 6-digit email OTP verification, trade freely via partial-fill escrow listings on the secondary market, and receive automatic pro-rata mUSDC rental dividends.",
    },
    specs: {
      vi: [
        "Xác thực thanh toán 2 bước bằng mã OTP 6 số + biên lai Email",
        "Sàn giao dịch thứ cấp ký quỹ, hỗ trợ mua khớp lệnh từng phần",
        "Phân phối cổ tức mUSDC công bằng và minh bạch cho cổ đông",
      ],
      en: [
        "Two-step 6-digit email OTP confirmation with HTML payment receipts",
        "Secondary escrow marketplace supporting partial order fills",
        "Automated pro-rata mUSDC dividend distributions to shareholders",
      ],
    },
    bg: "bg-[#141413]",
    text: "text-[#F4F1EA]",
    accent: "text-[#B8844A]",
    artifact: "waveform",
  },
];

function CryptographicSealArtifact({ isEn }: { isEn: boolean }) {
  return (
    <div className="relative w-full max-w-[330px] aspect-square mx-auto flex items-center justify-center">
      <svg viewBox="0 0 280 280" className="w-full h-full">
        <g className="protocol-spin-slow origin-center">
          <circle
            cx="140"
            cy="140"
            r="118"
            fill="none"
            stroke="#1B2A24"
            strokeOpacity="0.22"
            strokeWidth="1.2"
            strokeDasharray="6 8"
          />
          <circle cx="140" cy="22" r="4" fill="#B8844A" />
          <circle cx="140" cy="258" r="4" fill="#1B2A24" />
        </g>

        <g className="protocol-spin-reverse origin-center">
          <polygon
            points="140,48 205,75 232,140 205,205 140,232 75,205 48,140 75,75"
            fill="none"
            stroke="#B8844A"
            strokeOpacity="0.65"
            strokeWidth="1.5"
          />
          <circle
            cx="140"
            cy="140"
            r="74"
            fill="none"
            stroke="#1B2A24"
            strokeOpacity="0.18"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        </g>

        <circle cx="140" cy="140" r="46" fill="#1B2A24" />
        <circle cx="140" cy="140" r="38" fill="none" stroke="#B8844A" strokeWidth="1" strokeOpacity="0.6" />
        <path
          d="M127 140.5L136 149.5L154 131.5"
          fill="none"
          stroke="#F4F1EA"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute bottom-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1B2A24]/60">
        {isEn ? "IDENTITY · VERIFIED · PROTECTED" : "ĐỊNH DANH · AN TOÀN · XÁC THỰC"}
      </span>
    </div>
  );
}

function ScanningParcelGridArtifact({ isEn }: { isEn: boolean }) {
  const cells = Array.from({ length: 25 });
  const highlighted = new Set([6, 7, 8, 11, 12, 13, 16, 17, 18]);

  return (
    <div className="relative w-full max-w-[330px] aspect-square mx-auto rounded-[2rem] bg-[#131F1A] border border-[#F4F1EA]/12 p-6 overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#D7BC8D]/85">
        <span>{isEn ? "SHARE MATRIX" : "CƠ CẤU CỔ PHẦN"}</span>
        <span>10,000 VINH01</span>
      </div>

      <div className="relative my-auto py-3">
        <div className="grid grid-cols-5 gap-2.5">
          {cells.map((_, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-lg border transition-colors ${
                highlighted.has(idx)
                  ? "bg-[#B8844A]/25 border-[#D7BC8D]/60"
                  : "bg-[#F4F1EA]/[0.04] border-[#F4F1EA]/10"
              }`}
            />
          ))}
        </div>

        <div
          aria-hidden="true"
          className="protocol-laser-beam pointer-events-none absolute inset-x-0 top-2 h-0.5 bg-gradient-to-r from-transparent via-[#D7BC8D] to-transparent shadow-[0_0_18px_4px_rgba(184,132,74,0.65)]"
        />
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] text-[#F4F1EA]/60">
        <span>{isEn ? "DEED AUTHENTICATED" : "CHỨNG THƯ HỢP LỆ"}</span>
        <span className="text-emerald-300">IPFS</span>
      </div>
    </div>
  );
}

function LiquidityWaveformArtifact({ isEn }: { isEn: boolean }) {
  return (
    <div className="relative w-full max-w-[350px] aspect-square mx-auto rounded-[2rem] bg-[#1C1D1B] border border-[#F4F1EA]/10 p-6 flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#B8844A]">
        <span>{isEn ? "SETTLEMENT PULSE" : "DÒNG TIỀN & CỔ TỨC"}</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          mUSDC
        </span>
      </div>

      <svg viewBox="0 0 320 140" className="w-full h-36 overflow-visible">
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B8844A" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#D7BC8D" stopOpacity="1" />
            <stop offset="100%" stopColor="#4EB883" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <line x1="0" y1="35" x2="320" y2="35" stroke="#F4F1EA" strokeOpacity="0.06" strokeDasharray="3 5" />
        <line x1="0" y1="70" x2="320" y2="70" stroke="#F4F1EA" strokeOpacity="0.1" />
        <line x1="0" y1="105" x2="320" y2="105" stroke="#F4F1EA" strokeOpacity="0.06" strokeDasharray="3 5" />

        <path
          d="M 0 78 L 48 78 L 68 78 L 84 42 L 102 102 L 122 22 L 142 94 L 160 66 L 195 66 L 214 48 L 234 86 L 254 34 L 272 78 L 320 78"
          fill="none"
          stroke="#F4F1EA"
          strokeOpacity="0.12"
          strokeWidth="2"
        />

        <path
          className="protocol-wave-path"
          d="M 0 78 L 48 78 L 68 78 L 84 42 L 102 102 L 122 22 L 142 94 L 160 66 L 195 66 L 214 48 L 234 86 L 254 34 L 272 78 L 320 78"
          fill="none"
          stroke="url(#waveGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="520"
          strokeDashoffset="520"
        />
      </svg>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F4F1EA]/10 font-mono">
        <div>
          <span className="block text-[9.5px] uppercase text-[#F4F1EA]/45">
            {isEn ? "Settlement Speed" : "Tốc độ xác nhận"}
          </span>
          <span className="text-sm font-semibold text-[#F4F1EA] tabular-nums">&lt; 1.0s</span>
        </div>
        <div className="text-right">
          <span className="block text-[9.5px] uppercase text-[#F4F1EA]/45">
            {isEn ? "2FA Protection" : "Bảo mật thanh toán"}
          </span>
          <span className="text-sm font-semibold text-[#D7BC8D] tabular-nums">OTP 6-Digit</span>
        </div>
      </div>
    </div>
  );
}

export function ProtocolStack() {
  const sectionRef = useRef<HTMLElement>(null);
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const langKey = isEn ? "en" : "vi";

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".protocol-stack-card");
      cards.forEach((card, i) => {
        const nextCard = cards[i + 1];
        if (!nextCard) return;

        gsap.to(card, {
          scale: 0.9,
          opacity: 0.5,
          filter: "blur(20px)",
          ease: "none",
          scrollTrigger: {
            trigger: nextCard,
            start: "top bottom-=80",
            end: "top top+=100",
            scrub: true,
          },
        });
      });

      gsap.to(".protocol-spin-slow", {
        rotation: 360,
        duration: 24,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });
      gsap.to(".protocol-spin-reverse", {
        rotation: -360,
        duration: 18,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });
      gsap.to(".protocol-laser-beam", {
        y: 185,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".protocol-wave-path", {
        strokeDashoffset: 0,
        duration: 2.4,
        repeat: -1,
        repeatDelay: 0.4,
        ease: "power2.inOut",
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="protocol" data-no-i18n="true" className="relative py-20 sm:py-28 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#B8844A] font-semibold block">
            {isEn ? "How It Works" : "Cơ chế vận hành"}
          </span>
          <h2 className="font-sans text-3xl sm:text-5xl font-bold tracking-tight text-[#141413] mt-2 leading-[1.35]">
            {isEn ? "Three layers of " : "Ba tầng bảo chứng "}
            <span className="font-sans font-bold text-[#B8844A] whitespace-nowrap">
              {isEn ? "trusted ownership." : "quyền sở hữu."}
            </span>
          </h2>
        </div>
        <p className="text-sm text-[#141413]/65 max-w-sm leading-relaxed">
          {isEn
            ? "From investor identity verification to legal document integrity and liquid secondary trading."
            : "Từ xác minh danh tính người tham gia, đối chiếu hồ sơ pháp lý số đến thanh khoản ký quỹ minh bạch."}
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-10 pb-12">
        {PROTOCOL_STEPS.map((step, idx) => (
          <div
            key={step.number}
            style={{ top: `${72 + idx * 18}px` }}
            className={`protocol-stack-card sticky min-h-[78vh] rounded-[2.75rem] border border-[#1B2A24]/15 p-8 sm:p-12 lg:p-16 shadow-[0_28px_70px_-24px_rgba(20,20,19,0.28)] flex flex-col justify-between origin-top ${step.bg} ${step.text}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-5">
              <span className={`font-mono text-xs font-semibold tracking-[0.22em] uppercase ${step.accent}`}>
                {isEn ? `STEP ${step.number} / 03` : `TẦNG ${step.number} / 03`}
              </span>
              <span className="font-mono text-[11px] opacity-70 tracking-wide">
                {step.contract[langKey]}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto py-8">
              <div className="lg:col-span-7 space-y-6">
                <h3 className="font-sans text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight leading-[1.32]">
                  <span className="block">{step.title[langKey]}</span>
                  <span className={`block mt-2 font-sans font-bold ${step.accent}`}>
                    {step.italicWord[langKey]}
                  </span>
                </h3>
                <p className="text-sm sm:text-base opacity-80 leading-relaxed max-w-xl">
                  {step.description[langKey]}
                </p>
                <ul className="space-y-2.5 pt-2">
                  {step.specs[langKey].map((spec) => (
                    <li key={spec} className="flex items-center gap-3 text-xs sm:text-[13px] opacity-85">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8844A] shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5">
                {step.artifact === "seal" && <CryptographicSealArtifact isEn={isEn} />}
                {step.artifact === "laser" && <ScanningParcelGridArtifact isEn={isEn} />}
                {step.artifact === "waveform" && <LiquidityWaveformArtifact isEn={isEn} />}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] opacity-55 pt-4 border-t border-current/10">
              <span>{isEn ? "AUDITED SMART CONTRACTS" : "HỢP ĐỒNG THÔNG MINH KIỂM CHỨNG"}</span>
              <span>{isEn ? "TRANSPARENT & TRACEABLE" : "MINH BẠCH TRÊN CHUỖI"}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
