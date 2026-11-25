"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";
import { MagneticButton } from "./MagneticButton";

export function LandingNavbar() {
  const { isAuthenticated, currentUser } = useWeb3();
  const { lang, setLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  const isEn = lang === "en";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 56);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-5 inset-x-0 z-40 px-4 pointer-events-none" data-no-i18n="true">
      <nav
        aria-label={isEn ? "Primary Landing Navigation" : "Điều hướng chính"}
        className={`pointer-events-auto mx-auto max-w-5xl rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "bg-[#F4F1EA]/85 backdrop-blur-xl text-[#1B2A24] border border-[#1B2A24]/15 shadow-[0_14px_40px_-14px_rgba(20,20,19,0.22)]"
            : "bg-[#141413]/30 backdrop-blur-md text-[#F4F1EA] border border-[#F4F1EA]/15"
        }`}
      >
        {/* Brand Monogram */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center font-cormorant italic font-bold text-base transition-colors ${
              scrolled
                ? "bg-[#1B2A24] text-[#F4F1EA]"
                : "bg-[#F4F1EA] text-[#141413]"
            }`}
          >
            R
          </span>
          <div className="leading-none">
            <span className="font-jakarta font-bold text-sm tracking-tight block">
              {isEn ? "RWA Registry" : "Cổng Bất Động Sản RWA"}
            </span>
            <span
              className={`font-mono text-[9.5px] tracking-[0.16em] uppercase block mt-0.5 ${
                scrolled ? "text-[#1B2A24]/60" : "text-[#F4F1EA]/65"
              }`}
            >
              {isEn ? "Verified Real Estate" : "Sở hữu số minh bạch"}
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-jakarta font-medium tracking-wide">
          <Link
            href="/assets"
            className={`transition-colors ${
              scrolled ? "text-[#1B2A24]/80 hover:text-[#1B2A24]" : "text-[#F4F1EA]/80 hover:text-white"
            }`}
          >
            {isEn ? "Properties" : "Bất động sản"}
          </Link>
          <Link
            href="/marketplace"
            className={`transition-colors ${
              scrolled ? "text-[#1B2A24]/80 hover:text-[#1B2A24]" : "text-[#F4F1EA]/80 hover:text-white"
            }`}
          >
            {isEn ? "Secondary Market" : "Sàn giao dịch"}
          </Link>
          <Link
            href="/kyc"
            className={`transition-colors ${
              scrolled ? "text-[#1B2A24]/80 hover:text-[#1B2A24]" : "text-[#F4F1EA]/80 hover:text-white"
            }`}
          >
            {isEn ? "Identity Check" : "Xác minh danh tính"}
          </Link>
          <Link
            href="/wallet"
            className={`transition-colors ${
              scrolled ? "text-[#1B2A24]/80 hover:text-[#1B2A24]" : "text-[#F4F1EA]/80 hover:text-white"
            }`}
          >
            {isEn ? "Portfolio" : "Ví & Tài sản"}
          </Link>
        </div>

        {/* Right: Compact VI/EN Switcher + Magnetic CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`inline-flex items-center rounded-full p-0.5 text-[10.5px] font-mono font-semibold border transition-colors ${
              scrolled
                ? "bg-[#1B2A24]/8 border-[#1B2A24]/15"
                : "bg-[#F4F1EA]/12 border-[#F4F1EA]/20"
            }`}
          >
            <button
              type="button"
              onClick={() => setLang("vi")}
              className={`px-2 py-1 rounded-full transition-colors ${
                lang === "vi"
                  ? scrolled
                    ? "bg-[#1B2A24] text-[#F4F1EA]"
                    : "bg-[#F4F1EA] text-[#141413]"
                  : scrolled
                  ? "text-[#1B2A24]/65 hover:text-[#1B2A24]"
                  : "text-[#F4F1EA]/70 hover:text-white"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-full transition-colors ${
                lang === "en"
                  ? scrolled
                    ? "bg-[#1B2A24] text-[#F4F1EA]"
                    : "bg-[#F4F1EA] text-[#141413]"
                  : scrolled
                  ? "text-[#1B2A24]/65 hover:text-[#1B2A24]"
                  : "text-[#F4F1EA]/70 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <MagneticButton
            href={isAuthenticated && currentUser ? "/assets" : "/login"}
            variant={scrolled ? "estate" : "bronze"}
            size="sm"
          >
            <span>
              {isAuthenticated && currentUser
                ? isEn
                  ? "Open Dashboard"
                  : "Vào hệ thống"
                : isEn
                ? "Sign In"
                : "Đăng nhập"}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
          </MagneticButton>
        </div>
      </nav>
    </header>
  );
}
