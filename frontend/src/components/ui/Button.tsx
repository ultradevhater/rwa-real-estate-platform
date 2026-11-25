import React from "react";

export type ButtonVariant = "primary" | "approve" | "secondary" | "danger" | "ghost";
export type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary: "bg-[#1B2A24] hover:bg-[#14201B] text-[#F4F1EA] shadow-xs",
  approve: "bg-[#1E6B52] hover:bg-[#175540] text-[#F4F1EA] shadow-xs",
  secondary:
    "bg-white border border-[#1B2A24]/15 text-[#141413] hover:bg-[#EAE5DA]/70 hover:border-[#B8844A]/50 shadow-xs",
  danger: "bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/20 hover:bg-[#F5E0E0]",
  ghost: "bg-transparent text-[#141413]/70 hover:bg-[#EAE5DA] hover:text-[#141413]",
};

const SIZE_MAP: Record<ButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs rounded-xl",
  sm: "px-3.5 py-1.5 text-xs rounded-xl",
  md: "px-4 py-2 text-sm rounded-xl",
};

export function Button({
  variant = "primary",
  size = "sm",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-tight transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANT_MAP[variant]} ${SIZE_MAP[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
