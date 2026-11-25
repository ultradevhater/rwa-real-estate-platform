import type { Metadata } from "next";
import React, { Suspense } from "react";
import { Be_Vietnam_Pro, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/context/Web3Context";
import { LanguageProvider } from "@/context/LanguageContext";
import { AppShell } from "@/components/Header";
import { AppShellSkeleton } from "@/components/ui/Skeleton";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cổng Bất Động Sản RWA — Đầu tư & Sở hữu Bất động sản Số hóa",
  description:
    "Nền tảng đầu tư, đồng sở hữu và giao dịch cổ phần bất động sản minh bạch với xác minh danh tính và chứng thư pháp lý số.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-[#F4F1EA] text-[#141413] min-h-screen antialiased selection:bg-[#B8844A]/25 selection:text-[#141413]">
        {/* Global Subtle Architectural Film-Grain Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        <LanguageProvider>
          <Web3Provider>
            <Suspense fallback={<AppShellSkeleton />}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </Web3Provider>
        </LanguageProvider>
      </body>
    </html>
  );
}
