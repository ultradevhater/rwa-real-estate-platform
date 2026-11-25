"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/context/Web3Context";
import { StatusBadge, BadgeVariant } from "@/components/ui/StatusBadge";
import { CopyAddress } from "@/components/ui/CopyAddress";
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  FileCheck2,
  Landmark,
} from "lucide-react";

const ROLE_ROUTE: Record<string, string> = {
  admin: "/admin?tab=dashboard",
  issuer: "/admin?tab=issuer-dashboard",
  compliance: "/admin?tab=compliance-dashboard",
  investor: "/assets",
};

const ROLE_LABEL: Record<string, { label: string; variant: BadgeVariant }> = {
  admin: { label: "Quản trị hệ thống", variant: "purple" },
  issuer: { label: "Đơn vị phát hành", variant: "warning" },
  compliance: { label: "Kiểm duyệt KYC", variant: "info" },
  investor: { label: "Nhà đầu tư", variant: "success" },
};

const DEMO_CREDENTIAL_HINTS: Array<{
  username: string;
  role: string;
  variant: BadgeVariant;
  desc: string;
}> = [
  {
    username: "admin",
    role: "Quản trị hệ thống",
    variant: "purple",
    desc: "Phân quyền tài khoản, tạm dừng khẩn cấp, khôi phục cổ phần và xem nhật ký kiểm toán",
  },
  {
    username: "issuer",
    role: "Đơn vị phát hành",
    variant: "warning",
    desc: "Đăng ký bất động sản, phát hành cổ phần, mở bán sơ cấp, cập nhật định giá và chia cổ tức",
  },
  {
    username: "compliance",
    role: "Kiểm duyệt KYC",
    variant: "info",
    desc: "Xét duyệt hồ sơ định danh cá nhân (phê duyệt / từ chối / thu hồi) và khóa tài khoản",
  },
  {
    username: "investora",
    role: "Nhà đầu tư A (Đã xác minh)",
    variant: "success",
    desc: "Mua cổ phần sơ cấp, chuyển nhượng trực tiếp, giao dịch trên sàn thứ cấp và nhận cổ tức",
  },
  {
    username: "investorb",
    role: "Nhà đầu tư B (Chưa xác minh)",
    variant: "warning",
    desc: "Trải nghiệm quy trình gửi ảnh CCCD 2 mặt để xác minh danh tính trước khi đầu tư",
  },
];

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Yếu", color: "bg-[#A63A3A]", width: "33%" };
  if (score <= 3) return { label: "Trung bình", color: "bg-[#B8844A]", width: "66%" };
  return { label: "Mạnh", color: "bg-[#1E6B52]", width: "100%" };
}

export default function LoginPage() {
  const router = useRouter();
  const {
    currentUser,
    authNotice,
    clearAuthNotice,
    loginWithCredentials,
    registerAccount,
    changePassword,
    logoutSession,
    isConnecting,
  } = useWeb3();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regDisplayName, setRegDisplayName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pwStrength = getPasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    clearAuthNotice();

    if (!loginUsername.trim()) {
      setErrorMsg("Vui lòng nhập Tên đăng nhập hoặc Email.");
      return;
    }
    if (!loginPassword) {
      setErrorMsg("Vui lòng nhập Mật khẩu.");
      return;
    }
    try {
      const user = await loginWithCredentials(loginUsername, loginPassword);
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${user.display_name}.`);
      const target = ROLE_ROUTE[user.role_label] || "/assets";
      router.push(target);
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    clearAuthNotice();

    const cleanName = regDisplayName.trim();
    const cleanUser = regUsername.trim().toLowerCase();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (cleanName.length < 2) {
      setErrorMsg("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }
    if (!USERNAME_RE.test(cleanUser)) {
      setErrorMsg(
        "Tên đăng nhập phải từ 3–40 ký tự, bắt đầu bằng chữ hoặc số, chỉ chứa chữ thường, số, dấu chấm (.), gạch dưới (_) hoặc gạch ngang (-)."
      );
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setErrorMsg("Địa chỉ Email không đúng định dạng (VD: ten@domain.com).");
      return;
    }
    if (regPassword.trim().length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự và không được toàn khoảng trắng.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const created = await registerAccount({
        display_name: cleanName,
        username: cleanUser,
        email: cleanEmail,
        password: regPassword,
      });
      setSuccessMsg(
        `Đăng ký thành công! Tài khoản @${created.username} đã được tạo kèm địa chỉ ví ${created.address.slice(0, 10)}...`
      );
      router.push("/kyc");
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng ký tài khoản thất bại.");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!curPw) {
      setErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPw.trim().length < 6) {
      setErrorMsg("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPw !== confirmNewPw) {
      setErrorMsg("Xác nhận mật khẩu mới không khớp.");
      return;
    }
    if (newPw === curPw) {
      setErrorMsg("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setChangingPw(true);
    try {
      const msg = await changePassword(curPw, newPw);
      setSuccessMsg(msg);
      setCurPw("");
      setNewPw("");
      setConfirmNewPw("");
      setShowPasswordPanel(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Đổi mật khẩu thất bại.");
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = async () => {
    await logoutSession();
    setShowPasswordPanel(false);
    setSuccessMsg("Đã đăng xuất khỏi phiên làm việc hiện tại.");
    setErrorMsg(null);
  };

  const fillDemoAccount = (username: string) => {
    setMode("login");
    setLoginUsername(username);
    setLoginPassword("123456");
    setErrorMsg(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 py-1">
      {authNotice && (
        <div className="rounded-2xl border border-[#B8844A]/35 bg-[#F8EFE2] px-4 py-3 text-xs text-[#8F622C] flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B8844A]" strokeWidth={1.75} />
            <span>{authNotice}</span>
          </div>
          <button onClick={clearAuthNotice} className="font-bold ml-4 text-[#8F622C] hover:text-[#141413]">
            ✕
          </button>
        </div>
      )}

      {/* Active Session Banner */}
      {currentUser && (
        <div className="bg-white rounded-2xl border border-[#1B2A24]/12 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#1B2A24] text-[#D7BC8D] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[#141413]">{currentUser.display_name}</span>
                  {currentUser.username && (
                    <span className="font-mono text-xs text-[#141413]/55">@{currentUser.username}</span>
                  )}
                  <StatusBadge
                    variant={(ROLE_LABEL[currentUser.role_label] || ROLE_LABEL.investor).variant}
                    dot
                  >
                    {(ROLE_LABEL[currentUser.role_label] || ROLE_LABEL.investor).label}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#141413]/60">
                  <Wallet className="w-3.5 h-3.5 text-[#B8844A]" strokeWidth={1.75} />
                  <span>Địa chỉ ví:</span>
                  <CopyAddress
                    value={currentUser.address}
                    prefixLen={10}
                    suffixLen={6}
                    textClassName="text-xs text-[#141413]/75"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordPanel((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#F4F1EA] text-[#141413] text-xs font-medium shadow-xs transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#141413]/60" strokeWidth={1.75} />
                <span>Đổi mật khẩu</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(ROLE_ROUTE[currentUser.role_label] || "/assets")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B2A24] hover:bg-[#14201B] text-[#F4F1EA] text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Vào trang làm việc</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D7BC8D]" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#A63A3A]/20 bg-[#FBF0F0] text-[#A63A3A] hover:bg-[#F5E0E0] text-xs font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {showPasswordPanel && (
            <form
              onSubmit={handleChangePasswordSubmit}
              className="pt-4 border-t border-[#1B2A24]/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs"
            >
              <div>
                <label className="block font-medium text-[#141413]/75 mb-1">Mật khẩu hiện tại (*):</label>
                <input
                  type="password"
                  required
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  placeholder="Nhập mật khẩu cũ"
                  className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/50 px-3 py-2 text-xs text-[#141413] focus:bg-white focus:border-[#B8844A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-[#141413]/75 mb-1">Mật khẩu mới (*):</label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/50 px-3 py-2 text-xs text-[#141413] focus:bg-white focus:border-[#B8844A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-[#141413]/75 mb-1">Xác nhận mật khẩu mới (*):</label>
                <input
                  type="password"
                  required
                  value={confirmNewPw}
                  onChange={(e) => setConfirmNewPw(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/50 px-3 py-2 text-xs text-[#141413] focus:bg-white focus:border-[#B8844A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={changingPw}
                className="px-4 py-2 rounded-xl bg-[#1E6B52] hover:bg-[#175540] text-[#F4F1EA] font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {changingPw ? "Đang lưu..." : "Lưu mật khẩu mới"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Split Editorial Auth Card */}
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Deep Estate Panel */}
        <div className="lg:col-span-5 bg-[#1B2A24] text-[#F4F1EA] p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, #B8844A 0%, transparent 70%)" }}
          />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#F4F1EA] text-[#141413] flex items-center justify-center font-cormorant italic font-bold text-lg">
                R
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#D7BC8D]">
                Cổng Bất Động Sản RWA
              </span>
            </div>

            <div className="space-y-2.5">
              <h1 className="font-sans text-2xl sm:text-[26px] font-bold leading-snug tracking-tight">
                Đầu tư bất động sản{" "}
                <span className="font-sans font-bold text-[#D7BC8D]">
                  an toàn &amp; minh bạch.
                </span>
              </h1>
              <p className="text-xs text-[#F4F1EA]/70 leading-relaxed">
                Đăng nhập tài khoản của bạn hoặc đăng ký mới — hệ thống tự động cấp ví lưu giữ cổ phần riêng mà không cần cài đặt tiện ích ví phức tạp.
              </p>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-[#F4F1EA]/12 text-xs">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#D7BC8D] shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="font-semibold text-[#F4F1EA]">Xác minh danh tính an toàn</p>
                  <p className="text-[11px] text-[#F4F1EA]/60 mt-0.5">
                    Hồ sơ CCCD mã hóa bảo mật, đảm bảo mọi giao dịch hợp lệ.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck2 className="w-4 h-4 text-[#D7BC8D] shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="font-semibold text-[#F4F1EA]">Chứng thư pháp lý minh bạch</p>
                  <p className="text-[11px] text-[#F4F1EA]/60 mt-0.5">
                    Xem trực tiếp hồ sơ pháp lý và kiểm chứng tính toàn vẹn mọi lúc.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Landmark className="w-4 h-4 text-[#D7BC8D] shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="font-semibold text-[#F4F1EA]">Thanh toán 2 lớp &amp; ký quỹ</p>
                  <p className="text-[11px] text-[#F4F1EA]/60 mt-0.5">
                    Xác thực OTP qua Email khi mua cổ phần và nhận cổ tức tự động.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pt-6 mt-8 border-t border-[#F4F1EA]/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#F4F1EA]/50">
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống sẵn sàng
            </span>
            <span className="text-[#D7BC8D]">mUSDC</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1B2A24]/10">
            <div>
              <h2 className="font-jakarta text-lg font-bold text-[#141413]">
                {mode === "login" ? "Đăng nhập tài khoản" : "Đăng ký tài khoản Nhà đầu tư"}
              </h2>
              <p className="text-xs text-[#141413]/55 mt-0.5">
                {mode === "login"
                  ? "Nhập thông tin tài khoản hoặc chọn nhanh tài khoản trải nghiệm bên dưới."
                  : "Tài khoản mới được tự động cấp ví đầu tư và có thể xác minh KYC ngay."}
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-[#1B2A24]/15 bg-[#EAE5DA]/80 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === "login"
                    ? "bg-[#1B2A24] text-[#F4F1EA] shadow-xs"
                    : "text-[#141413]/65 hover:text-[#141413]"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === "register"
                    ? "bg-[#1B2A24] text-[#F4F1EA] shadow-xs"
                    : "text-[#141413]/65 hover:text-[#141413]"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Đăng ký</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-[#A63A3A]/25 bg-[#FBF0F0] px-4 py-3 text-xs text-[#A63A3A] flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-[#1E6B52]/25 bg-[#E9F4EF] px-4 py-3 text-xs text-[#1E6B52] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#141413]/75 mb-1.5">
                  Tên đăng nhập hoặc Email (*)
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-[#141413]/40 absolute left-3.5 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="VD: admin, issuer, compliance, investora hoặc email..."
                    className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/40 pl-10 pr-3.5 py-2.5 text-sm text-[#141413] placeholder-[#141413]/35 focus:bg-white focus:border-[#B8844A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141413]/75 mb-1.5">
                  Mật khẩu (*)
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-[#141413]/40 absolute left-3.5 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type={showLoginPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/40 pl-10 pr-10 py-2.5 text-sm text-[#141413] placeholder-[#141413]/35 focus:bg-white focus:border-[#B8844A] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141413]/45 hover:text-[#141413]"
                    title={showLoginPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showLoginPw ? (
                      <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                    ) : (
                      <Eye className="w-4 h-4" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B2A24] hover:bg-[#14201B] px-4 py-3 text-sm font-semibold text-[#F4F1EA] shadow-xs transition-colors disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
                <span>{isConnecting ? "Đang xác thực..." : "Đăng nhập"}</span>
              </button>

              <p className="text-center text-xs text-[#141413]/60 pt-1">
                Chưa có tài khoản Nhà đầu tư?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-[#B8844A] font-semibold hover:text-[#1B2A24] hover:underline"
                >
                  Đăng ký tài khoản mới ngay
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#E9F4EF]/80 border border-[#1E6B52]/20 text-xs text-[#1E6B52] space-y-1">
                <p className="font-semibold">Tự động khởi tạo ví đầu tư riêng:</p>
                <p className="text-[#1E6B52]/85 leading-relaxed">
                  Tài khoản mới có vai trò <strong>Nhà đầu tư</strong>. Ngay sau khi đăng ký, bạn có thể hoàn tất xác minh danh tính để mua bán cổ phần bất động sản.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141413]/75 mb-1">
                    Họ và tên (*)
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-[#141413]/40 absolute left-3 top-1/2 -translate-y-1/2"
                      strokeWidth={1.75}
                    />
                    <input
                      type="text"
                      required
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      placeholder="VD: Lê Minh Hoàng"
                      className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/40 pl-9 pr-3 py-2 text-sm text-[#141413] focus:bg-white focus:border-[#B8844A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413]/75 mb-1">
                    Tên đăng nhập (*)
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="w-4 h-4 text-[#141413]/40 absolute left-3 top-1/2 -translate-y-1/2"
                      strokeWidth={1.75}
                    />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
                      placeholder="VD: minhhoang"
                      className={`w-full rounded-xl border bg-[#F4F1EA]/40 pl-9 pr-3 py-2 text-sm text-[#141413] focus:bg-white focus:outline-none ${
                        regUsername && !USERNAME_RE.test(regUsername.trim())
                          ? "border-[#A63A3A]"
                          : "border-[#1B2A24]/15 focus:border-[#B8844A]"
                      }`}
                    />
                  </div>
                  {regUsername && !USERNAME_RE.test(regUsername.trim()) && (
                    <p className="text-[11px] text-[#A63A3A] mt-0.5">
                      3–40 ký tự, chỉ gồm a-z, 0-9, dấu chấm, gạch dưới/ngang.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141413]/75 mb-1">
                  Địa chỉ Email (*)
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-[#141413]/40 absolute left-3 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="VD: minhhoang@gmail.com"
                    className={`w-full rounded-xl border bg-[#F4F1EA]/40 pl-9 pr-3 py-2 text-sm text-[#141413] focus:bg-white focus:outline-none ${
                      regEmail && !EMAIL_RE.test(regEmail.trim())
                        ? "border-[#A63A3A]"
                        : "border-[#1B2A24]/15 focus:border-[#B8844A]"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141413]/75 mb-1">
                    Mật khẩu (*)
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-[#141413]/40 absolute left-3 top-1/2 -translate-y-1/2"
                      strokeWidth={1.75}
                    />
                    <input
                      type={showRegPw ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full rounded-xl border border-[#1B2A24]/15 bg-[#F4F1EA]/40 pl-9 pr-9 py-2 text-sm text-[#141413] focus:bg-white focus:border-[#B8844A] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#141413]/45 hover:text-[#141413]"
                    >
                      {showRegPw ? (
                        <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="w-4 h-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                  {regPassword && (
                    <div className="mt-1.5 space-y-0.5">
                      <div className="h-1.5 w-full bg-[#EAE5DA] rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                      </div>
                      <span className="text-[11px] text-[#141413]/60">
                        Độ mạnh mật khẩu: <strong>{pwStrength.label}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413]/75 mb-1">
                    Xác nhận mật khẩu (*)
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 text-[#141413]/40 absolute left-3 top-1/2 -translate-y-1/2"
                      strokeWidth={1.75}
                    />
                    <input
                      type={showRegPw ? "text" : "password"}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className={`w-full rounded-xl border bg-[#F4F1EA]/40 pl-9 pr-3 py-2 text-sm text-[#141413] focus:bg-white focus:outline-none ${
                        regConfirmPassword && regConfirmPassword !== regPassword
                          ? "border-[#A63A3A]"
                          : "border-[#1B2A24]/15 focus:border-[#B8844A]"
                      }`}
                    />
                  </div>
                  {regConfirmPassword && regConfirmPassword !== regPassword && (
                    <p className="text-[11px] text-[#A63A3A] mt-0.5">Mật khẩu xác nhận chưa khớp.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E6B52] hover:bg-[#175540] px-4 py-3 text-sm font-semibold text-[#F4F1EA] shadow-xs transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                <span>{isConnecting ? "Đang khởi tạo tài khoản..." : "Tạo tài khoản mới"}</span>
              </button>

              <p className="text-center text-xs text-[#141413]/60 pt-1">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#B8844A] font-semibold hover:text-[#1B2A24] hover:underline"
                >
                  Quay lại đăng nhập
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Friendly Quick-Experience Demo Credentials Table */}
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1B2A24]/10 bg-[#F4F1EA]/70 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-jakarta text-sm font-bold text-[#141413]">
              Tài khoản trải nghiệm nhanh{" "}
              <span className="font-normal text-xs text-[#141413]/60">
                (Mật khẩu chung:{" "}
                <code className="font-mono text-[#A63A3A] font-semibold bg-[#FBF0F0] px-1.5 py-0.5 rounded">
                  123456
                </code>
                )
              </span>
            </h2>
            <p className="text-xs text-[#141413]/55 mt-0.5">
              Chọn nhanh bất kỳ vai trò nào để trải nghiệm đầy đủ các tính năng của hệ thống.
            </p>
          </div>
          <Building2 className="w-4 h-4 text-[#B8844A] hidden sm:block" strokeWidth={1.75} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-[#1B2A24]/10 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/50">
                <th className="py-3 px-5 whitespace-nowrap">Tên đăng nhập</th>
                <th className="py-3 px-4 whitespace-nowrap">Mật khẩu</th>
                <th className="py-3 px-4 whitespace-nowrap">Vai trò</th>
                <th className="py-3 px-4 hidden md:table-cell">Chức năng chính</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Điền nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2A24]/8 text-sm">
              {DEMO_CREDENTIAL_HINTS.map((item) => (
                <tr key={item.username} className="hover:bg-[#F4F1EA]/60 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold text-[#1B2A24] whitespace-nowrap">
                    {item.username}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#141413]/55 whitespace-nowrap tabular-nums">
                    123456
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge variant={item.variant}>{item.role}</StatusBadge>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#141413]/65 hidden md:table-cell">
                    {item.desc}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => fillDemoAccount(item.username)}
                      className="px-3 py-1.5 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#1B2A24] hover:text-[#F4F1EA] text-[#141413] text-xs font-semibold shadow-xs transition-colors"
                    >
                      Điền vào form
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
