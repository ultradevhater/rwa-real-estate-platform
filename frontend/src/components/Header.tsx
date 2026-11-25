"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SyncHealthBadge } from "@/components/ui/SyncHealthBadge";
import { AccountDropdown } from "@/components/ui/AccountDropdown";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  LayoutDashboard,
  Building2,
  Store,
  Wallet,
  ShieldCheck,
  ListTodo,
  FileCheck,
  Settings,
  Users,
  FileSignature,
  Lock,
  ChevronUp,
  ChevronDown,
  Coins,
  UserCheck,
  AlertTriangle,
  Activity,
  Repeat,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  BarChart3,
  History,
  ShieldAlert,
  FileText,
  LogIn,
} from "lucide-react";

const ROLE_DISPLAY: Record<string, { vi: string; en: string }> = {
  admin: { vi: "Quản trị hệ thống", en: "System Admin" },
  issuer: { vi: "Đơn vị phát hành", en: "Property Issuer" },
  compliance: { vi: "Kiểm duyệt KYC", en: "Compliance" },
  investor: { vi: "Nhà đầu tư", en: "Investor" },
  guest: { vi: "Khách tham quan", en: "Guest" },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams?.get("tab") || "";

  const {
    currentUser,
    isAuthenticated,
    isAuthReady,
    usdcBalance,
    claimFaucet,
    setAuthNotice,
  } = useWeb3();
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const role = isAuthenticated && currentUser ? currentUser.role_label : "guest";
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Tự động chuyển hướng sang /login kèm thông báo nếu chưa đăng nhập mà truy cập trang cá nhân / quản trị
  useEffect(() => {
    if (!isAuthReady || isAuthenticated) return;
    const isProtectedPersonalRoute =
      pathname.startsWith("/wallet") ||
      pathname.startsWith("/kyc") ||
      pathname.startsWith("/dividends") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/portfolio");
    if (isProtectedPersonalRoute) {
      setAuthNotice("Vui lòng đăng nhập tài khoản để truy cập chức năng này.");
      router.replace("/login");
    }
  }, [isAuthReady, isAuthenticated, pathname, router, setAuthNotice]);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    kyc: true,
    assets: true,
    admin: true,
  });

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Breadcrumb thân thiện theo đường dẫn & vai trò hiện tại
  const getBreadcrumbs = () => {
    if (pathname.startsWith("/admin")) {
      if (role === "issuer" || activeTabParam.startsWith("issuer")) {
        if (activeTabParam === "issuer-register") {
          return ["BẢNG ĐIỀU KHIỂN", "PHÁT HÀNH TÀI SẢN", "ĐĂNG KÝ & PHÁT HÀNH CỔ PHẦN"];
        }
        if (activeTabParam === "issuer-sales") {
          return ["BẢNG ĐIỀU KHIỂN", "PHÁT HÀNH TÀI SẢN", "QUẢN LÝ ĐỢT MỞ BÁN"];
        }
        if (activeTabParam === "issuer-docs") {
          return ["BẢNG ĐIỀU KHIỂN", "PHÁT HÀNH TÀI SẢN", "HỒ SƠ PHÁP LÝ SỐ"];
        }
        if (activeTabParam === "issuer-reports") {
          return ["BẢNG ĐIỀU KHIỂN", "PHÁT HÀNH TÀI SẢN", "BÁO CÁO PHÁT HÀNH & ĐỊNH GIÁ"];
        }
        return ["BẢNG ĐIỀU KHIỂN", "PHÁT HÀNH TÀI SẢN", "TỔNG QUAN PHÁT HÀNH"];
      }
      if (role === "compliance" || activeTabParam.startsWith("compliance")) {
        if (activeTabParam === "compliance-queue" || activeTabParam === "compliance") {
          return ["BẢNG ĐIỀU KHIỂN", "XÁC MINH DANH TÍNH", "HÀNG ĐỢI XÉT DUYỆT KYC"];
        }
        if (activeTabParam === "compliance-history") {
          return ["BẢNG ĐIỀU KHIỂN", "XÁC MINH DANH TÍNH", "LỊCH SỬ XÉT DUYỆT"];
        }
        if (activeTabParam === "compliance-freeze") {
          return ["BẢNG ĐIỀU KHIỂN", "AN TOÀN TÀI KHOẢN", "KHÓA / MỞ KHÓA TÀI KHOẢN"];
        }
        if (activeTabParam === "compliance-freeze-history") {
          return ["BẢNG ĐIỀU KHIỂN", "AN TOÀN TÀI KHOẢN", "LỊCH SỬ KHÓA TÀI KHOẢN"];
        }
        if (activeTabParam === "compliance-audit") {
          return ["BẢNG ĐIỀU KHIỂN", "KIỂM DUYỆT KYC", "NHẬT KÝ KIỂM TOÁN"];
        }
        return ["BẢNG ĐIỀU KHIỂN", "KIỂM DUYỆT KYC", "TỔNG QUAN KIỂM DUYỆT"];
      }
      if (activeTabParam === "pause") {
        return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "TẠM DỪNG GIAO DỊCH KHẨN CẤP"];
      }
      if (activeTabParam === "forced-transfer") {
        return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "KHÔI PHỤC & CHUYỂN QUYỀN CỔ PHẦN"];
      }
      if (activeTabParam === "roles" || activeTabParam === "role-management") {
        return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "QUẢN LÝ PHÂN QUYỀN"];
      }
      if (activeTabParam === "audit") {
        return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "NHẬT KÝ KIỂM TOÁN"];
      }
      if (activeTabParam === "monitoring") {
        return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "GIÁM SÁT HỆ THỐNG"];
      }
      if (activeTabParam === "settings") {
        return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "CẤU HÌNH HỆ THỐNG"];
      }
      return ["BẢNG ĐIỀU KHIỂN", "QUẢN TRỊ HỆ THỐNG", "TỔNG QUAN QUẢN TRỊ"];
    }
    if (pathname.startsWith("/kyc")) {
      return ["TÀI KHOẢN", "XÁC MINH DANH TÍNH", "HỒ SƠ ĐỊNH DANH CÁ NHÂN"];
    }
    if (pathname.startsWith("/marketplace")) {
      return ["GIAO DỊCH", "SÀN GIAO DỊCH THỨ CẤP", "LỆNH KÝ QUỸ ĐANG MỞ"];
    }
    if (pathname.startsWith("/wallet")) {
      return ["TÀI KHOẢN", "VÍ & DANH MỤC ĐẦU TƯ", "CỔ PHẦN, CỔ TỨC & CHUYỂN NHƯỢNG"];
    }
    if (pathname.startsWith("/dividends")) {
      return ["ĐẦU TƯ", "CỔ TỨC & LỢI NHUẬN", "PHÂN PHỐI CỔ TỨC BẤT ĐỘNG SẢN"];
    }
    if (pathname.startsWith("/login") || pathname.startsWith("/lab-login")) {
      return ["TÀI KHOẢN", "XÁC THỰC", "ĐĂNG NHẬP & CHUYỂN ĐỔI VAI TRÒ"];
    }
    if (pathname.startsWith("/assets/") && pathname !== "/assets") {
      return ["BẤT ĐỘNG SẢN", "HỒ SƠ TÀI SẢN", "CHI TIẾT & ĐẦU TƯ SƠ CẤP"];
    }
    return ["BẤT ĐỘNG SẢN", "DANH MỤC ĐẦU TƯ", "TÀI SẢN ĐANG NIÊM YẾT"];
  };

  // Full-bleed cinematic landing page bypasses dashboard sidebar/topbar chrome
  if (pathname === "/") {
    return <>{children}</>;
  }

  const breadcrumbs = getBreadcrumbs();
  const roleLabel = (ROLE_DISPLAY[role] || ROLE_DISPLAY.investor)[isEn ? "en" : "vi"];

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 transition-all duration-150 border-l-2 ${
      active
        ? "bg-[#B8844A]/18 text-[#EED7B2] border-[#B8844A] font-medium"
        : "border-transparent text-[#F4F1EA]/65 hover:text-[#F4F1EA] hover:bg-[#F4F1EA]/[0.05]"
    }`;

  const subNavItemClass = (active: boolean) =>
    `flex items-center gap-2.5 ${
      sidebarCollapsed ? "px-4 justify-center" : "pl-9 pr-4"
    } py-2 text-[12.5px] transition-all duration-150 border-l-2 ${
      active
        ? "bg-[#B8844A]/18 text-[#EED7B2] border-[#B8844A] font-medium"
        : "border-transparent text-[#F4F1EA]/55 hover:text-[#F4F1EA] hover:bg-[#F4F1EA]/[0.05]"
    }`;

  return (
    <div className="min-h-screen flex bg-[#F4F1EA] text-[#141413] font-jakarta antialiased">
      {/* LEFT VERTICAL DEEP ESTATE SIDEBAR */}
      <aside
        className={`${
          sidebarCollapsed ? "w-[70px]" : "w-[264px]"
        } shrink-0 bg-[#1B2A24] text-[#F4F1EA]/70 flex flex-col border-r border-[#F4F1EA]/10 select-none transition-all duration-200 sticky top-0 h-screen`}
      >
        {/* Brand Header — Links back to Landing Page (/) */}
        <div className="px-4 py-4 border-b border-[#F4F1EA]/10 flex items-center justify-between gap-2 bg-[#141F1B]">
          <Link
            href="/"
            title={isEn ? "Back to RWA Registry Home" : "Về trang chủ Cổng Bất Động Sản RWA"}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-[#F4F1EA] text-[#141413] flex items-center justify-center font-cormorant italic font-bold text-lg shadow-xs ring-2 ring-[#B8844A]/45 group-hover:bg-[#B8844A] group-hover:text-[#F4F1EA] transition-colors">
              R
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight truncate">
                <span className="font-jakarta text-[13.5px] font-bold text-[#F4F1EA] block tracking-tight truncate group-hover:text-[#EED7B2] transition-colors">
                  {t("brand.title")}
                </span>
                <span className="text-[10.5px] text-[#D7BC8D] block truncate mt-0.5 font-medium">
                  {roleLabel}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className="p-1.5 rounded-lg text-[#F4F1EA]/55 hover:text-[#F4F1EA] hover:bg-[#F4F1EA]/10 transition-colors shrink-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Navigation Links Filtered by Role */}
        <nav className="flex-1 overflow-y-auto py-4 text-[13px] space-y-0.5">
          {role === "admin" ? (
            <>
              <Link
                href="/admin?tab=dashboard"
                title="Bảng điều khiển quản trị"
                className={navItemClass(
                  pathname.startsWith("/admin") &&
                    (activeTabParam === "dashboard" || activeTabParam === "admin" || !activeTabParam)
                )}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Tổng quan quản trị</span>}
              </Link>

              <Link
                href="/assets"
                title="Danh mục bất động sản"
                className={navItemClass(pathname.startsWith("/assets"))}
              >
                <Building2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Danh mục bất động sản</span>}
              </Link>

              <Link
                href="/login"
                title="Quản lý tài khoản & Chuyển vai trò"
                className={navItemClass(pathname.startsWith("/login"))}
              >
                <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Tài khoản & Vai trò</span>}
              </Link>

              <div className="pt-1.5">
                <button
                  onClick={() => toggleMenu("admin")}
                  title="Quản trị hệ thống"
                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors border-l-2 ${
                    pathname.startsWith("/admin") &&
                    ["pause", "forced-transfer", "roles", "role-management", "audit", "monitoring"].includes(
                      activeTabParam
                    )
                      ? "bg-[#F4F1EA]/[0.06] text-[#F4F1EA] border-[#B8844A]/70 font-medium"
                      : "border-transparent text-[#F4F1EA]/65 hover:text-[#F4F1EA] hover:bg-[#F4F1EA]/[0.05]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Lock className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!sidebarCollapsed && <span>Quản trị hệ thống</span>}
                  </span>
                  {!sidebarCollapsed &&
                    (openMenus.admin ? (
                      <ChevronUp className="w-4 h-4 opacity-70" strokeWidth={1.75} />
                    ) : (
                      <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
                    ))}
                </button>

                {openMenus.admin && (
                  <div className="bg-[#141F1B]/70 py-1 space-y-0.5">
                    <Link
                      href="/admin?tab=pause"
                      title="Tạm dừng giao dịch khẩn cấp"
                      className={subNavItemClass(
                        pathname.startsWith("/admin") && activeTabParam === "pause"
                      )}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">Tạm dừng khẩn cấp</span>}
                    </Link>

                    <Link
                      href="/admin?tab=forced-transfer"
                      title="Khôi phục & chuyển quyền cổ phần"
                      className={subNavItemClass(
                        pathname.startsWith("/admin") && activeTabParam === "forced-transfer"
                      )}
                    >
                      <Repeat className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">Khôi phục cổ phần</span>}
                    </Link>

                    <Link
                      href="/admin?tab=role-management"
                      title="Quản lý phân quyền"
                      className={subNavItemClass(
                        pathname.startsWith("/admin") &&
                          (activeTabParam === "role-management" || activeTabParam === "roles")
                      )}
                    >
                      <Shield className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">Quản lý phân quyền</span>}
                    </Link>

                    <Link
                      href="/admin?tab=audit"
                      title="Nhật ký kiểm toán"
                      className={subNavItemClass(
                        pathname.startsWith("/admin") && activeTabParam === "audit"
                      )}
                    >
                      <UserCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">Nhật ký kiểm toán</span>}
                    </Link>

                    <Link
                      href="/admin?tab=monitoring"
                      title="Giám sát hệ thống"
                      className={subNavItemClass(
                        pathname.startsWith("/admin") && activeTabParam === "monitoring"
                      )}
                    >
                      <Activity className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">Giám sát hệ thống</span>}
                    </Link>

                    <Link
                      href="/dividends"
                      title="Phân phối cổ tức"
                      className={subNavItemClass(pathname.startsWith("/dividends"))}
                    >
                      <Coins className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">Phân phối cổ tức</span>}
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F4F1EA]/10 mt-2">
                <Link
                  href="/admin?tab=settings"
                  title="Cấu hình hệ thống"
                  className={navItemClass(
                    pathname.startsWith("/admin") && activeTabParam === "settings"
                  )}
                >
                  <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {!sidebarCollapsed && <span>Cấu hình hệ thống</span>}
                </Link>
              </div>
            </>
          ) : role === "issuer" ? (
            <>
              <Link
                href="/admin?tab=issuer-dashboard"
                title="Tổng quan phát hành"
                className={navItemClass(
                  pathname.startsWith("/admin") &&
                    (activeTabParam === "issuer-dashboard" || activeTabParam === "issuer" || !activeTabParam)
                )}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Tổng quan phát hành</span>}
              </Link>

              <Link
                href="/assets"
                title="Danh mục bất động sản"
                className={navItemClass(pathname.startsWith("/assets"))}
              >
                <Building2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Danh mục bất động sản</span>}
              </Link>

              <Link
                href="/admin?tab=issuer-register"
                title="Đăng ký & phát hành cổ phần"
                className={navItemClass(
                  pathname.startsWith("/admin") && activeTabParam === "issuer-register"
                )}
              >
                <FileSignature className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Đăng ký bất động sản</span>}
              </Link>

              <Link
                href="/admin?tab=issuer-sales"
                title="Quản lý đợt mở bán"
                className={navItemClass(
                  pathname.startsWith("/admin") && activeTabParam === "issuer-sales"
                )}
              >
                <Coins className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Quản lý đợt mở bán</span>}
              </Link>

              <Link
                href="/admin?tab=issuer-docs"
                title="Hồ sơ pháp lý số"
                className={navItemClass(
                  pathname.startsWith("/admin") && activeTabParam === "issuer-docs"
                )}
              >
                <FileCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Hồ sơ pháp lý số</span>}
              </Link>

              <Link
                href="/admin?tab=issuer-reports"
                title="Báo cáo phát hành"
                className={navItemClass(
                  pathname.startsWith("/admin") && activeTabParam === "issuer-reports"
                )}
              >
                <Activity className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Báo cáo & Định giá</span>}
              </Link>

              <Link
                href="/dividends"
                title="Phân phối cổ tức"
                className={navItemClass(pathname.startsWith("/dividends"))}
              >
                <Coins className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Phân phối cổ tức</span>}
              </Link>

              <div className="pt-2 mt-2 border-t border-[#F4F1EA]/10">
                <Link
                  href="/login"
                  title="Chuyển đổi tài khoản"
                  className={navItemClass(pathname.startsWith("/login"))}
                >
                  <Users className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {!sidebarCollapsed && <span>Chuyển đổi tài khoản</span>}
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/assets"
                className={navItemClass(pathname === "/assets")}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>Danh mục bất động sản</span>}
              </Link>

              {role === "investor" && (
                <>
                  <Link
                    href="/assets/1"
                    className={navItemClass(
                      pathname.startsWith("/assets/") && pathname !== "/assets"
                    )}
                  >
                    <Coins className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!sidebarCollapsed && <span>Mua cổ phần sơ cấp</span>}
                  </Link>

                  <Link
                    href="/marketplace"
                    className={`justify-between gap-2 ${navItemClass(pathname.startsWith("/marketplace"))}`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Store className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && (
                        <span className="whitespace-nowrap truncate">Sàn giao dịch</span>
                      )}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="whitespace-nowrap shrink-0 rounded-full bg-[#B8844A]/20 text-[#EED7B2] ring-1 ring-inset ring-[#B8844A]/35 text-[10px] font-medium px-2 py-0.5">
                        Ký quỹ
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/wallet"
                    className={navItemClass(pathname.startsWith("/wallet"))}
                  >
                    <Wallet className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!sidebarCollapsed && <span>Ví & Chuyển cổ phần</span>}
                  </Link>

                  <Link
                    href="/kyc"
                    className={navItemClass(pathname.startsWith("/kyc"))}
                  >
                    <FileCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!sidebarCollapsed && <span>Xác minh danh tính</span>}
                  </Link>
                </>
              )}

              {role === "compliance" && (
                <div className="space-y-0.5">
                  <Link
                    href="/admin?tab=compliance-dashboard"
                    className={navItemClass(
                      activeTabParam === "compliance-dashboard" || activeTabParam === ""
                    )}
                  >
                    <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!sidebarCollapsed && <span>Tổng quan kiểm duyệt</span>}
                  </Link>

                  <div>
                    <button
                      onClick={() => toggleMenu("compliance_kyc")}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors border-l-2 ${
                        activeTabParam.startsWith("compliance-queue") ||
                        activeTabParam.startsWith("compliance-history") ||
                        activeTabParam === "compliance"
                          ? "bg-[#F4F1EA]/[0.06] text-[#F4F1EA] border-[#B8844A]/70 font-medium"
                          : "border-transparent text-[#F4F1EA]/65 hover:text-[#F4F1EA] hover:bg-[#F4F1EA]/[0.05]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-[#D7BC8D]" strokeWidth={1.75} />
                        {!sidebarCollapsed && <span>Xác minh danh tính</span>}
                      </span>
                      {!sidebarCollapsed &&
                        (openMenus.compliance_kyc !== false ? (
                          <ChevronUp className="w-4 h-4 opacity-70" strokeWidth={1.75} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
                        ))}
                    </button>
                    {openMenus.compliance_kyc !== false && !sidebarCollapsed && (
                      <div className="bg-[#141F1B]/70 py-1 space-y-0.5">
                        <Link
                          href="/admin?tab=compliance-queue"
                          className={subNavItemClass(
                            activeTabParam === "compliance-queue" || activeTabParam === "compliance"
                          )}
                        >
                          <ListTodo className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">Hàng đợi xét duyệt KYC</span>
                        </Link>
                        <Link
                          href="/admin?tab=compliance-history"
                          className={subNavItemClass(activeTabParam === "compliance-history")}
                        >
                          <History className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">Lịch sử xét duyệt</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => toggleMenu("compliance_account")}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors border-l-2 ${
                        activeTabParam.startsWith("compliance-freeze")
                          ? "bg-[#F4F1EA]/[0.06] text-[#F4F1EA] border-[#B8844A]/70 font-medium"
                          : "border-transparent text-[#F4F1EA]/65 hover:text-[#F4F1EA] hover:bg-[#F4F1EA]/[0.05]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Lock className="w-4 h-4 shrink-0 text-[#D7BC8D]" strokeWidth={1.75} />
                        {!sidebarCollapsed && <span>An toàn tài khoản</span>}
                      </span>
                      {!sidebarCollapsed &&
                        (openMenus.compliance_account !== false ? (
                          <ChevronUp className="w-4 h-4 opacity-70" strokeWidth={1.75} />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-70" strokeWidth={1.75} />
                        ))}
                    </button>
                    {openMenus.compliance_account !== false && !sidebarCollapsed && (
                      <div className="bg-[#141F1B]/70 py-1 space-y-0.5">
                        <Link
                          href="/admin?tab=compliance-freeze"
                          className={subNavItemClass(activeTabParam === "compliance-freeze")}
                        >
                          <ShieldAlert className="w-4 h-4 shrink-0 text-[#E07A7A]" strokeWidth={1.75} />
                          <span className="truncate">Khóa / Mở khóa tài khoản</span>
                        </Link>
                        <Link
                          href="/admin?tab=compliance-freeze-history"
                          className={subNavItemClass(activeTabParam === "compliance-freeze-history")}
                        >
                          <History className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span className="truncate">Lịch sử khóa tài khoản</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/admin?tab=compliance-audit"
                    className={navItemClass(activeTabParam === "compliance-audit")}
                  >
                    <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!sidebarCollapsed && <span>Nhật ký kiểm toán</span>}
                  </Link>
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-[#F4F1EA]/10">
                <Link
                  href="/login"
                  className={navItemClass(pathname.startsWith("/login"))}
                >
                  <LogIn className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  {!sidebarCollapsed && (
                    <span>{currentUser ? "Tài khoản & Đổi vai trò" : "Đăng nhập / Đăng ký"}</span>
                  )}
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Sidebar Footer: System Health Status */}
        <div className="p-3.5 border-t border-[#F4F1EA]/10 bg-[#141F1B] text-[11px] text-[#F4F1EA]/60 space-y-2.5">
          <SyncHealthBadge compact={sidebarCollapsed} />
          <div className="flex items-center gap-2 text-emerald-300/90 font-medium px-1">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            {!sidebarCollapsed && <span className="truncate">{t("nav.rpcConnected")}</span>}
          </div>
        </div>
      </aside>

      {/* RIGHT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Frosted Warm Limestone Topbar */}
        <header className="bg-[#F4F1EA]/85 backdrop-blur-xl border-b border-[#1B2A24]/10 px-6 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 sticky top-0 z-30">
          {/* Left: Clean Tracked Breadcrumb */}
          <div className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.16em] uppercase min-w-0 overflow-hidden">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  <span
                    className={`whitespace-nowrap ${
                      isLast ? "text-[#141413] truncate" : "text-[#141413]/45 hidden md:inline"
                    }`}
                  >
                    {crumb}
                  </span>
                  {!isLast && <span className="text-[#B8844A]/70 font-normal hidden md:inline">/</span>}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right: mUSDC Balance + Quick Demo Top-up, Language Switcher, Bell, Account */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {isAuthenticated && currentUser && role === "investor" && (
              <div className="inline-flex items-center gap-2 bg-white border border-[#1B2A24]/12 rounded-xl px-3 py-1.5 text-xs tabular-nums shadow-xs">
                <span className="text-[#141413]/55 font-medium">Số dư:</span>
                <span className="font-mono font-semibold text-[#141413]">
                  ${Number(usdcBalance).toLocaleString("en-US")}{" "}
                  <span className="text-[10.5px] font-normal text-[#B8844A]">mUSDC</span>
                </span>
                <button
                  onClick={claimFaucet}
                  title={t("nav.faucetTooltip")}
                  className="rounded-full bg-[#1B2A24]/8 hover:bg-[#1B2A24] text-[#1B2A24] hover:text-[#F4F1EA] px-2.5 py-0.5 text-[11px] font-semibold transition-colors"
                >
                  + Nạp thử
                </button>
              </div>
            )}

            <LanguageSwitcher />

            {isAuthenticated && currentUser && <NotificationBell />}

            {isAuthenticated && currentUser ? (
              <AccountDropdown />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1B2A24] hover:bg-[#14201B] px-4 py-2 text-xs font-semibold text-[#F4F1EA] shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D7BC8D]" strokeWidth={1.75} />
                <span>{t("common.loginRegister")}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 px-6 lg:px-8 py-7 max-w-[1420px] w-full mx-auto">
          {children}
        </main>

        {/* Compact Warm Limestone Footer */}
        <footer className="px-6 py-3.5 border-t border-[#1B2A24]/10 bg-[#EAE5DA]/50 text-[11px] text-[#141413]/55 text-center">
          {t("footer.disclaimerBody")}
        </footer>
      </div>
    </div>
  );
}

export function Header() {
  return null;
}

export default AppShell;
