"use client";

import React, { useRef } from "react";
import Link from "next/link";

interface MagneticButtonProps {
  href?: string;
  onClick?: () => void;
  variant?: "bronze" | "estate" | "light" | "outline-light" | "outline-dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

const VARIANT_STYLES = {
  bronze: {
    base: "bg-[#B8844A] text-[#F4F1EA] border border-[#B8844A]",
    fill: "bg-[#1B2A24]",
    hoverText: "group-hover:text-[#F4F1EA]",
  },
  estate: {
    base: "bg-[#1B2A24] text-[#F4F1EA] border border-[#1B2A24]",
    fill: "bg-[#B8844A]",
    hoverText: "group-hover:text-[#141413]",
  },
  light: {
    base: "bg-[#F4F1EA] text-[#141413] border border-[#F4F1EA]",
    fill: "bg-[#B8844A]",
    hoverText: "group-hover:text-[#F4F1EA]",
  },
  "outline-light": {
    base: "bg-transparent text-[#F4F1EA] border border-[#F4F1EA]/35 backdrop-blur-sm",
    fill: "bg-[#F4F1EA]",
    hoverText: "group-hover:text-[#141413]",
  },
  "outline-dark": {
    base: "bg-transparent text-[#141413] border border-[#141413]/20",
    fill: "bg-[#1B2A24]",
    hoverText: "group-hover:text-[#F4F1EA]",
  },
};

const SIZE_STYLES = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-sm",
};

export function MagneticButton({
  href,
  onClick,
  variant = "bronze",
  size = "md",
  className = "",
  children,
}: MagneticButtonProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const styles = VARIANT_STYLES[variant];

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = elRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.14;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    const el = elRef.current;
    if (!el) return;
    el.style.transform = "translate3d(0px, 0px, 0) scale(1)";
  };

  const sharedClasses = `group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-jakarta font-semibold tracking-tight transition-transform duration-300 ease-out active:scale-[0.98] ${styles.base} ${SIZE_STYLES[size]} ${className}`;

  const innerContent = (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 translate-y-[102%] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 ${styles.fill}`}
      />
      <span
        className={`relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-300 ${styles.hoverText}`}
      >
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        ref={(node) => {
          elRef.current = node;
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={sharedClasses}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      ref={(node) => {
        elRef.current = node;
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={sharedClasses}
    >
      {innerContent}
    </button>
  );
}
