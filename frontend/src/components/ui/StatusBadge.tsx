import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

interface StatusBadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, { pill: string; dot: string }> = {
  success: {
    pill: "bg-[#E9F4EF] text-[#1E6B52] ring-[#1E6B52]/20",
    dot: "bg-[#1E6B52]",
  },
  warning: {
    pill: "bg-[#F8EFE2] text-[#8F622C] ring-[#B8844A]/30",
    dot: "bg-[#B8844A]",
  },
  danger: {
    pill: "bg-[#FBF0F0] text-[#A63A3A] ring-[#A63A3A]/20",
    dot: "bg-[#A63A3A]",
  },
  info: {
    pill: "bg-[#EEF2F0] text-[#1B2A24] ring-[#1B2A24]/18",
    dot: "bg-[#1B2A24]",
  },
  neutral: {
    pill: "bg-[#EAE5DA] text-[#141413]/75 ring-[#141413]/12",
    dot: "bg-[#141413]/45",
  },
  purple: {
    pill: "bg-[#F3EDF5] text-[#5C3D6E] ring-[#5C3D6E]/20",
    dot: "bg-[#5C3D6E]",
  },
};

export function StatusBadge({
  variant = "neutral",
  dot = false,
  children,
  className = "",
  title,
}: StatusBadgeProps) {
  const styles = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${styles.pill} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      {children}
    </span>
  );
}
