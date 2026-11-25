"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ShieldCheck,
  Mail,
  KeyRound,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  X,
  ArrowLeft,
  Coins,
} from "lucide-react";

export interface PaymentOtpPayload {
  txType: "PRIMARY_BUY" | "MARKET_BUY";
  targetId: number; // real_estate_id (PRIMARY_BUY) hoặc listing_id (MARKET_BUY)
  estateName: string;
  symbol: string;
  tokenAddress: string;
  amount: number;
  pricePerShare: number;
}

export interface PaymentOtpSuccessResult {
  otp_id: string;
  otp_verified: boolean;
  tx_type: string;
  approve_tx_hash: string;
  tx_hash: string;
  block_number: number;
  shares_bought: number;
  price_per_share: number;
  usdc_paid: number;
  new_usdc_balance: number;
  new_token_balance: number;
  ownership_percent: number;
  receipt_email_queued: boolean;
  recipient_email?: string | null;
}

interface PaymentOtpModalProps {
  open: boolean;
  payload: PaymentOtpPayload | null;
  onClose: () => void;
  onSuccess?: (result: PaymentOtpSuccessResult) => void;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PaymentOtpModal({
  open,
  payload,
  onClose,
  onSuccess,
}: PaymentOtpModalProps) {
  const {
    currentUser,
    usdcBalance,
    isKYCVerified,
    isFrozen,
    apiFetch,
    refreshBalances,
    claimFaucet,
  } = useWeb3();

  const [screen, setScreen] = useState<"request" | "verify" | "success">("request");
  const [email, setEmail] = useState<string>("");
  const [otpId, setOtpId] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [expiresLeft, setExpiresLeft] = useState<number>(300); // 5:00
  const [resendCooldown, setResendCooldown] = useState<number>(0); // 60s
  const [busy, setBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentOtpSuccessResult | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);

  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Reset state mỗi khi mở Modal mới
  useEffect(() => {
    if (open) {
      setScreen("request");
      setEmail(currentUser?.email || "");
      setOtpId("");
      setOtpDigits(["", "", "", "", "", ""]);
      setExpiresLeft(300);
      setResendCooldown(0);
      setBusy(false);
      setErrorMsg(null);
      setInfoMsg(null);
      setReceipt(null);
      setCopiedTx(false);
    }
  }, [open, currentUser?.email, payload?.targetId, payload?.amount, payload?.txType]);

  // Đồng hồ đếm ngược 5:00 & cooldown Gửi lại mã 60s khi đang ở Màn hình 2
  useEffect(() => {
    if (!open || screen !== "verify") return;
    const timer = setInterval(() => {
      setExpiresLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, screen]);

  if (!open || !payload) return null;

  const isPrimary = payload.txType === "PRIMARY_BUY";
  const totalUsdc = payload.amount * payload.pricePerShare;
  const currentBalanceNum = Number(usdcBalance || 0);
  const isInsufficientBalance = currentBalanceNum < totalUsdc;
  const otpCode = otpDigits.join("");

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!currentUser) {
      setErrorMsg("Vui lòng đăng nhập tài khoản Nhà đầu tư trước khi thanh toán!");
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg("Vui lòng nhập địa chỉ Gmail hợp lệ để nhận mã xác thực OTP!");
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch("/payments/request-otp", {
        method: "POST",
        body: JSON.stringify({
          tx_type: payload.txType,
          target_id: payload.targetId,
          amount: payload.amount,
          email: cleanEmail,
        }),
      });
      setOtpId(res.otp_id);
      setOtpDigits(["", "", "", "", "", ""]);
      setExpiresLeft(Number(res.expires_in_seconds || 300));
      setResendCooldown(60);
      setInfoMsg(res.message || `Đã gửi mã OTP 6 chữ số về Gmail ${cleanEmail}`);
      setScreen("verify");
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err?.message || "Không thể gửi mã OTP về Gmail!");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (expiresLeft <= 0) {
      setErrorMsg("Mã OTP đã hết hạn (quá 5 phút). Vui lòng bấm 'Gửi lại mã' để nhận mã mới!");
      return;
    }
    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số mã OTP đã gửi về Gmail của bạn!");
      return;
    }

    setBusy(true);
    try {
      const res: PaymentOtpSuccessResult = await apiFetch("/payments/confirm", {
        method: "POST",
        body: JSON.stringify({
          otp_id: otpId,
          otp_code: otpCode,
        }),
      });
      await refreshBalances();
      setReceipt(res);
      setScreen("success");
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setErrorMsg(err?.message || "Xác thực OTP hoặc ký giao dịch thất bại!");
    } finally {
      setBusy(false);
    }
  };

  const handleDigitChange = (index: number, rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = "";
      setOtpDigits(next);
      return;
    }
    if (cleaned.length > 1) {
      const next = [...otpDigits];
      for (let i = 0; i < 6 && i < cleaned.length; i++) {
        next[i] = cleaned[i];
      }
      setOtpDigits(next);
      const focusIdx = Math.min(cleaned.length, 5);
      digitRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);
    if (index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      e.preventDefault();
      const next = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i];
      }
      setOtpDigits(next);
      digitRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const copyTxHash = () => {
    if (!receipt?.tx_hash) return;
    navigator.clipboard?.writeText(receipt.tx_hash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#141413]/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-2xl max-w-lg w-full overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1B2A24] text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="mb-1">
              <StatusBadge variant={screen === "success" ? "success" : "info"} dot>
                {isPrimary
                  ? "Bảo mật 2 bước (Gmail OTP) · Mua sơ cấp"
                  : `Bảo mật 2 bước (Gmail OTP) · Marketplace #${payload.targetId}`}
              </StatusBadge>
            </div>
            <h3 className="text-base font-semibold mt-1 flex items-center gap-2 text-white">
              {screen === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
              ) : screen === "verify" ? (
                <KeyRound className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
              )}
              <span>
                {screen === "request"
                  ? "Bước 1/2: Xác nhận giao dịch & Gửi OTP"
                  : screen === "verify"
                  ? "Bước 2/2: Nhập mã OTP 6 chữ số"
                  : "Thanh toán On-chain thành công"}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-[#14201B] text-[#141413]/45 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Step Indicator */}
        {screen !== "success" && (
          <div className="px-6 py-3 bg-[#F4F1EA]/70 border-b border-[#1B2A24]/12 flex items-center gap-3 text-xs font-medium">
            <span
              className={`flex items-center gap-1.5 ${
                screen === "request" ? "text-[#1B2A24] font-semibold" : "text-[#1E6B52] font-semibold"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-semibold text-white ${
                  screen === "request" ? "bg-[#1B2A24]" : "bg-[#1E6B52]"
                }`}
              >
                {screen === "verify" ? "✓" : "1"}
              </span>
              Thông tin &amp; Gmail
            </span>
            <span className="flex-1 h-px bg-[#EAE5DA]" />
            <span
              className={`flex items-center gap-1.5 ${
                screen === "verify" ? "text-[#1B2A24] font-semibold" : "text-[#141413]/45"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-semibold ${
                  screen === "verify"
                    ? "bg-[#1B2A24] text-white"
                    : "bg-[#EAE5DA] text-[#141413]/65"
                }`}
              >
                2
              </span>
              Nhập OTP &amp; Ký On-chain
            </span>
          </div>
        )}

        <div className="p-6 space-y-4 text-xs">
          {/* ================= MÀN HÌNH 1: THÔNG TIN & GMAIL ================= */}
          {screen === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="rounded-xl border border-[#1B2A24]/12 bg-[#F4F1EA]/70 divide-y divide-slate-200/70 overflow-hidden">
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#141413]/55">Loại giao dịch:</span>
                  <StatusBadge variant="info">
                    {isPrimary ? "Mua sơ cấp" : `Mua thứ cấp (Lệnh #${payload.targetId})`}
                  </StatusBadge>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#141413]/55">Bất động sản:</span>
                  <strong className="text-[#141413] font-semibold">
                    {payload.estateName} ({payload.symbol})
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#141413]/55">Số lượng &amp; Đơn giá:</span>
                  <strong className="text-[#141413] font-semibold tabular-nums">
                    {payload.amount.toLocaleString("en-US")} {payload.symbol} × $
                    {payload.pricePerShare.toLocaleString("en-US")}
                  </strong>
                </div>
                <div className="px-4 py-3 flex justify-between items-center bg-[#E9F4EF]">
                  <span className="font-semibold text-[#1E6B52]">Tổng số tiền cần thanh toán:</span>
                  <span className="text-base font-bold text-[#1E6B52] tabular-nums">
                    ${totalUsdc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mUSDC
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#141413]/55">Số dư ví hiện có:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold tabular-nums ${
                        isInsufficientBalance ? "text-[#A63A3A]" : "text-[#1E6B52]"
                      }`}
                    >
                      ${currentBalanceNum.toLocaleString("en-US")} mUSDC
                    </span>
                    {isInsufficientBalance && (
                      <button
                        type="button"
                        onClick={claimFaucet}
                        className="px-2 py-0.5 rounded-full bg-[#E9F4EF] hover:bg-[#D8ECE3] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[11px] font-medium transition-colors"
                      >
                        + Nạp thử
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(!isKYCVerified || isFrozen || isInsufficientBalance) && (
                <div className="p-3 rounded-xl bg-[#FBF0F0] border border-[#A63A3A]/22 text-xs text-[#A63A3A] space-y-1">
                  {!isKYCVerified && (
                    <p>• Tài khoản chưa được duyệt KYC trên IdentityRegistry.</p>
                  )}
                  {isFrozen && <p>• Ví hiện đang bị đóng băng.</p>}
                  {isInsufficientBalance && (
                    <p>• Số dư mUSDC chưa đủ thanh toán. Nhấn &ldquo;+ Nạp thử&rdquo; để nhận thêm $50,000 mUSDC.</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-medium text-[#141413] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#1B2A24]" strokeWidth={1.75} />
                  <span>Địa chỉ Gmail nhận mã xác nhận OTP (*):</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={busy}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: investor@gmail.com"
                  className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2.5 text-sm text-[#141413] focus:border-[#B8844A] focus:ring-2 focus:ring-[#B8844A]/20 focus:outline-none disabled:bg-slate-50 transition-all"
                />
                <p className="text-[11px] text-[#141413]/55 leading-relaxed">
                  Hệ thống sẽ kiểm tra KYC &amp; số dư, khóa tham số giao dịch và gửi mã OTP 6 chữ số (hiệu lực 5 phút) về Gmail này trước khi ký on-chain.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FBF0F0] border border-[#A63A3A]/22 text-xs text-[#A63A3A] flex items-start gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#A63A3A] mt-0.5" strokeWidth={1.75} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1B2A24]/8">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-medium text-[#141413]/80 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                  <span>{busy ? "Đang kiểm tra & gửi OTP..." : "Gửi mã xác nhận OTP"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= MÀN HÌNH 2: NHẬP MÃ OTP 6 CHỮ SỐ ================= */}
          {screen === "verify" && (
            <form onSubmit={handleConfirmOtp} className="space-y-4">
              {infoMsg && (
                <div className="p-3 rounded-xl bg-[#EEF2F0] border border-[#1B2A24]/18 text-xs text-[#1B2A24] flex items-start gap-2">
                  <Mail className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2A24]" strokeWidth={1.75} />
                  <div className="space-y-0.5">
                    <p className="font-semibold">{infoMsg}</p>
                    <p className="text-[11px] text-[#1B2A24]">
                      Vui lòng mở hộp thư đến (hoặc mục Spam) của <strong>{email}</strong> để lấy mã 6 số.
                    </p>
                  </div>
                </div>
              )}

              {/* Tóm tắt ngắn gọn giao dịch đã khóa */}
              <div className="px-3.5 py-2.5 rounded-xl bg-[#F4F1EA]/70 border border-[#1B2A24]/12 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#141413]/80">
                  <strong className="text-[#141413] tabular-nums">
                    {payload.amount.toLocaleString("en-US")} {payload.symbol}
                  </strong>{" "}
                  ({payload.estateName})
                </span>
                <strong className="text-[#1E6B52] tabular-nums">
                  ${totalUsdc.toLocaleString("en-US", { minimumFractionDigits: 2 })} mUSDC
                </strong>
              </div>

              {/* 6 ô nhập OTP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#141413]">Nhập mã OTP 6 chữ số (*):</label>
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-semibold text-xs tabular-nums ${
                      expiresLeft <= 0
                        ? "text-[#A63A3A]"
                        : expiresLeft <= 60
                        ? "text-[#B8844A]"
                        : "text-[#1B2A24]"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{expiresLeft > 0 ? `Còn ${formatMMSS(expiresLeft)}` : "Đã hết hạn!"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2.5 py-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      disabled={busy || expiresLeft <= 0}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={handlePaste}
                      aria-label={`Chữ số OTP thứ ${idx + 1}`}
                      className="h-12 text-center text-lg font-bold font-mono tabular-nums rounded-lg border border-[#1B2A24]/20 bg-white text-[#141413] focus:border-[#B8844A] focus:ring-2 focus:ring-[#B8844A]/20 focus:outline-none disabled:bg-slate-50 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setScreen("request");
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1 text-[#141413]/55 hover:text-[#141413] font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Đổi địa chỉ Gmail</span>
                  </button>

                  <button
                    type="button"
                    disabled={busy || resendCooldown > 0}
                    onClick={() => handleRequestOtp()}
                    className="inline-flex items-center gap-1 text-[#1B2A24] hover:text-[#1B2A24] font-medium disabled:text-slate-400 tabular-nums transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} strokeWidth={1.75} />
                    <span>
                      {resendCooldown > 0 ? `Gửi lại mã (${resendCooldown}s)` : "Gửi lại mã OTP"}
                    </span>
                  </button>
                </div>
              </div>

              {busy && (
                <div className="p-3 rounded-xl bg-[#EEF2F0] border border-[#1B2A24]/18 text-xs text-[#1B2A24] font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    Đang xác thực mã OTP và hoàn tất giao dịch thanh toán{" "}
                    trên hệ thống...
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#FBF0F0] border border-[#A63A3A]/22 text-xs text-[#A63A3A] flex items-start gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#A63A3A] mt-0.5" strokeWidth={1.75} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1B2A24]/8">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-medium text-[#141413]/80 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={busy || expiresLeft <= 0 || otpCode.length !== 6}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1E6B52] hover:bg-[#175540] text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-45"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Coins className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                  <span>{busy ? "Đang thanh toán On-chain..." : "Xác nhận & Thanh toán"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= MÀN HÌNH 3: BIÊN LAI THÀNH CÔNG ================= */}
          {screen === "success" && receipt && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#E9F4EF] border border-[#1E6B52]/22 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#1E6B52] shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-[#1B2A24] tabular-nums">
                    Xác thực OTP &amp; Thanh toán thành công +{receipt.shares_bought.toLocaleString("en-US")}{" "}
                    {payload.symbol}!
                  </p>
                  <p className="text-xs text-[#1E6B52]">
                    {receipt.receipt_email_queued && receipt.recipient_email
                      ? `Biên lai chi tiết giao dịch cũng đã được gửi về Gmail (${receipt.recipient_email}).`
                      : "Giao dịch đã được xác nhận vĩnh viễn trên mạng cục bộ Anvil."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#1B2A24]/12 bg-[#F4F1EA]/70 divide-y divide-slate-200/70 overflow-hidden">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413]/55">Bất động sản / Token:</span>
                  <strong className="text-[#141413] font-semibold">
                    {payload.estateName} ({payload.symbol})
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413]/55">Tổng số tiền đã thanh toán:</span>
                  <strong className="text-[#1E6B52] text-sm font-bold tabular-nums">
                    ${Number(receipt.usdc_paid).toLocaleString("en-US")} mUSDC
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413]/55">Số dư {payload.symbol} &amp; Tỷ lệ sở hữu mới:</span>
                  <strong className="text-[#1B2A24] font-semibold tabular-nums">
                    {Number(receipt.new_token_balance).toLocaleString("en-US")} {payload.symbol} (
                    {Number(receipt.ownership_percent).toFixed(4)}%)
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413]/55">Số dư mUSDC còn lại:</span>
                  <strong className="text-[#141413] font-semibold tabular-nums">
                    ${Number(receipt.new_usdc_balance).toLocaleString("en-US")} mUSDC
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center gap-2">
                  <span className="text-[#141413]/55 shrink-0">Mã giao dịch (TxHash):</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <code className="font-mono text-[11px] text-[#1B2A24] truncate" title={receipt.tx_hash}>
                      {receipt.tx_hash}
                    </code>
                    <button
                      type="button"
                      onClick={copyTxHash}
                      className="p-1 rounded-md border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] shrink-0 transition-colors"
                      title="Sao chép TxHash"
                    >
                      {copiedTx ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B52]" strokeWidth={2} />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#141413]/45" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413]/55">Số khối xác nhận:</span>
                  <code className="font-mono text-[#141413] tabular-nums">Block #{receipt.block_number}</code>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white text-xs font-medium shadow-xs transition-colors"
                >
                  Hoàn tất &amp; Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
