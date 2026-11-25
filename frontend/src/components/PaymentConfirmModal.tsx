"use client";

import React, { useEffect, useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Loader2,
  ShieldCheck,
  Coins,
  Copy,
  Check,
  X,
  Receipt,
} from "lucide-react";

export interface PaymentModalPayload {
  mode: "primary" | "marketplace";
  estateName: string;
  symbol: string;
  tokenAddress: string;
  amount: number;
  pricePerShare: number;
  realEstateId?: number;
  listingId?: number;
  sellerAddress?: string;
}

export interface PaymentReceiptResult {
  approve_tx_hash?: string;
  tx_hash: string;
  block_number: number;
  shares_bought: number;
  price_per_share: number;
  usdc_paid: number;
  new_usdc_balance: number;
  new_token_balance: number;
  ownership_percent: number;
  email_queued: boolean;
  recipient_email?: string | null;
  seller_email_queued?: boolean;
}

interface PaymentConfirmModalProps {
  open: boolean;
  payload: PaymentModalPayload | null;
  onClose: () => void;
  onSuccess?: (receipt: PaymentReceiptResult) => void;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function PaymentConfirmModal({
  open,
  payload,
  onClose,
  onSuccess,
}: PaymentConfirmModalProps) {
  const { currentUser, usdcBalance, isKYCVerified, isFrozen, apiFetch, refreshBalances, claimFaucet } =
    useWeb3();

  const [confirmEmail, setConfirmEmail] = useState<string>("");
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0: idle, 1: KYC check, 2: Signing tx, 3: Sending email
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptResult | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setConfirmEmail(currentUser?.email || "");
      setStep(0);
      setSubmitting(false);
      setErrorMsg(null);
      setReceipt(null);
      setCopiedTx(false);
    }
  }, [open, currentUser?.email, payload?.amount, payload?.listingId, payload?.realEstateId]);

  if (!open || !payload) return null;

  const totalUsdc = payload.amount * payload.pricePerShare;
  const currentBalanceNum = Number(usdcBalance || 0);
  const isInsufficientBalance = currentBalanceNum < totalUsdc;

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg("Bạn chưa đăng nhập phiên làm việc. Vui lòng đăng nhập tài khoản Nhà đầu tư trước!");
      return;
    }
    if (payload.amount <= 0) {
      setErrorMsg("Số lượng cổ phần đặt mua phải lớn hơn 0!");
      return;
    }
    const cleanEmail = confirmEmail.trim();
    if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg("Địa chỉ Gmail nhận biên lai không đúng định dạng (VD: ten@gmail.com)!");
      return;
    }

    setSubmitting(true);
    setStep(1);

    let stepTimer1: ReturnType<typeof setTimeout> | null = null;
    let stepTimer2: ReturnType<typeof setTimeout> | null = null;

    try {
      stepTimer1 = setTimeout(() => setStep(2), 350);
      stepTimer2 = setTimeout(() => setStep(3), 1300);

      const endpoint =
        payload.mode === "primary" ? "/sales/primary/buy" : "/marketplace/buy";

      const body =
        payload.mode === "primary"
          ? {
              real_estate_id: payload.realEstateId,
              token_address: payload.tokenAddress,
              amount: payload.amount,
              confirm_email: cleanEmail || undefined,
            }
          : {
              listing_id: payload.listingId,
              amount: payload.amount,
              confirm_email: cleanEmail || undefined,
            };

      const res: PaymentReceiptResult = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setStep(3);
      await refreshBalances();
      setReceipt(res);
      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setStep(0);
      setErrorMsg(err?.message || "Giao dịch thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      if (stepTimer1) clearTimeout(stepTimer1);
      if (stepTimer2) clearTimeout(stepTimer2);
      setSubmitting(false);
    }
  };

  const copyTxHash = () => {
    if (!receipt?.tx_hash) return;
    navigator.clipboard?.writeText(receipt.tx_hash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 1600);
  };

  const isPrimary = payload.mode === "primary";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#141413]/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-2xl max-w-lg w-full overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1B2A24] text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#D7BC8D] block">
              {isPrimary
                ? "Thanh toán mua cổ phần sơ cấp"
                : `Thanh toán mua cổ phần (Lệnh #${payload.listingId})`}
            </span>
            <h3 className="text-base font-semibold mt-0.5 flex items-center gap-2 text-white">
              <Receipt className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
              <span>{receipt ? "Biên lai thanh toán thành công" : "Xác nhận thanh toán"}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-[#14201B] text-[#141413]/45 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {receipt ? (
            /* ========== SUCCESS RECEIPT VIEW ========== */
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-[#2fb344]/10 border border-[#2fb344]/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2fb344] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#1E6B52]">
                    Thanh toán thành công +{receipt.shares_bought.toLocaleString("en-US")} {payload.symbol}!
                  </p>
                  <p className="text-[11.5px] text-[#1E6B52]">
                    {receipt.email_queued && receipt.recipient_email ? (
                      <>
                        Biên lai xác nhận đã được gửi về Gmail của bạn:{" "}
                        <strong className="underline">{receipt.recipient_email}</strong>
                      </>
                    ) : (
                      "Giao dịch đã xác nhận thành công trên Blockchain Anvil (không chọn gửi email)."
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-[#e6e8ec] bg-[#f8fafd] divide-y divide-[#eef0f3]">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Bất động sản / Token:</span>
                  <strong className="text-[#182433]">
                    {payload.estateName} ({payload.symbol})
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Tổng số tiền đã thanh toán:</span>
                  <strong className="text-[#1E6B52] text-sm">
                    ${Number(receipt.usdc_paid).toLocaleString("en-US")} mUSDC
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Số dư {payload.symbol} &amp; Tỷ lệ sở hữu mới:</span>
                  <strong className="text-[#206bc4]">
                    {Number(receipt.new_token_balance).toLocaleString("en-US")} {payload.symbol} (
                    {Number(receipt.ownership_percent).toFixed(4)}%)
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Số dư mUSDC còn lại:</span>
                  <strong className="text-[#182433]">
                    ${Number(receipt.new_usdc_balance).toLocaleString("en-US")} mUSDC
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center gap-2">
                  <span className="text-[#141413/60] shrink-0">Mã giao dịch (TxHash):</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <code className="font-mono text-[11px] text-[#206bc4] truncate" title={receipt.tx_hash}>
                      {receipt.tx_hash}
                    </code>
                    <button
                      type="button"
                      onClick={copyTxHash}
                      className="p-1 rounded border border-[#dce1e7] bg-white hover:bg-[#F4F1EA] shrink-0"
                      title="Sao chép TxHash"
                    >
                      {copiedTx ? (
                        <Check className="w-3 h-3 text-[#2fb344]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#141413/60]" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Số khối xác nhận:</span>
                  <code className="font-mono text-[#182433]">Block #{receipt.block_number}</code>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded bg-[#182433] hover:bg-[#2c3b50] text-white font-semibold transition"
                >
                  Hoàn tất &amp; Đóng
                </button>
              </div>
            </div>
          ) : (
            /* ========== CONFIRMATION & PAYMENT FORM ========== */
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Tóm tắt giao dịch */}
              <div className="rounded-md border border-[#e6e8ec] bg-[#f8fafd] divide-y divide-[#eef0f3]">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Loại giao dịch:</span>
                  <strong className="text-[#182433]">
                    {isPrimary ? "Mua sơ cấp (PrimarySale)" : `Mua thứ cấp (Marketplace #${payload.listingId})`}
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Bất động sản:</span>
                  <strong className="text-[#182433]">
                    {payload.estateName} ({payload.symbol})
                  </strong>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Hợp đồng AssetToken:</span>
                  <code className="font-mono text-[11px] text-[#206bc4]">
                    {payload.tokenAddress.slice(0, 10)}...{payload.tokenAddress.slice(-8)}
                  </code>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#141413/60]">Số lượng &amp; Đơn giá:</span>
                  <strong className="text-[#182433]">
                    {payload.amount.toLocaleString("en-US")} {payload.symbol} × $
                    {payload.pricePerShare.toLocaleString("en-US")}
                  </strong>
                </div>
                <div className="px-4 py-3 flex justify-between items-center bg-[#eef8f0]">
                  <span className="font-bold text-[#1E6B52]">Tổng số tiền cần thanh toán:</span>
                  <span className="text-base font-extrabold text-[#1E6B52]">
                    ${totalUsdc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mUSDC
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#141413/60]">Số dư ví hiện có:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isInsufficientBalance ? "text-[#d63939]" : "text-[#2fb344]"}`}>
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

              {/* Kiểm tra nhanh điều kiện trước khi bấm */}
              {(!isKYCVerified || isFrozen || isInsufficientBalance) && (
                <div className="p-3 rounded-md bg-[#d63939]/10 border border-[#d63939]/30 text-[11.5px] text-[#b02a37] space-y-1">
                  {!isKYCVerified && (
                    <p>• Tài khoản chưa được duyệt KYC trên IdentityRegistry (sẽ bị Smart Contract từ chối).</p>
                  )}
                  {isFrozen && <p>• Ví hiện đang bị đóng băng, không thể giao dịch token.</p>}
                  {isInsufficientBalance && (
                    <p>• Số dư mUSDC chưa đủ để thanh toán. Nhấn &ldquo;+ Nạp thử&rdquo; để nhận thêm $50,000 mUSDC.</p>
                  )}
                </div>
              )}

              {/* Ô nhập Gmail nhận xác nhận giao dịch */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-[#182433] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#206bc4]" />
                  <span>Gmail nhận xác nhận giao dịch (Biên lai điện tử):</span>
                </label>
                <input
                  type="email"
                  disabled={submitting}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="VD: nhadautu@gmail.com (để trống nếu không cần gửi mail)"
                  className="w-full rounded-md border border-[#dce1e7] bg-white px-3 py-2 text-xs text-[#182433] focus:border-[#206bc4] focus:outline-none disabled:bg-[#f4f6fa]"
                />
                <p className="text-[11px] text-[#141413/60]">
                  Hệ thống tự động gửi biên lai chứa TxHash, Block Number và tỷ lệ sở hữu mới về Gmail qua Google Apps Script sau khi xác nhận on-chain.
                </p>
              </div>

              {/* Thanh tiến trình 3 bước khi đang xử lý */}
              {submitting && (
                <div className="p-3.5 rounded-md bg-[#f0f6ff] border border-[#206bc4]/30 space-y-2">
                  {[
                    { idx: 1, text: "Bước 1: Đang kiểm tra trạng thái xác minh tài khoản và số dư..." },
                    { idx: 2, text: "Bước 2: Đang xử lý thanh toán và ghi nhận quyền sở hữu cổ phần..." },
                    { idx: 3, text: "Bước 3: Đang cập nhật danh mục và gửi biên lai qua Email..." },
                  ].map((item) => {
                    const done = step > item.idx;
                    const active = step === item.idx;
                    return (
                      <div
                        key={item.idx}
                        className={`flex items-center gap-2 text-[11.5px] ${
                          done
                            ? "text-[#1E6B52] font-semibold"
                            : active
                            ? "text-[#206bc4] font-bold"
                            : "text-[#9aa7b8]"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#2fb344]" />
                        ) : active ? (
                          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-[#206bc4]" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-current inline-block shrink-0" />
                        )}
                        <span>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Thông báo lỗi chi tiết */}
              {errorMsg && (
                <div className="p-3 rounded-md bg-[#d63939]/10 border border-[#d63939]/30 text-xs text-[#b02a37] flex items-start gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#d63939] mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#eef0f3]">
                <span className="inline-flex items-center gap-1 text-[11px] text-[#141413/60]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#206bc4]" />
                  <span>Anvil :8545 · Server-side Signer</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={onClose}
                    className="px-4 py-2 rounded border border-[#dce1e7] text-xs font-semibold text-[#141413/60] hover:text-[#182433] disabled:opacity-40"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 ${
                      isPrimary
                        ? "bg-[#1B2A24] hover:bg-[#14201B]"
                        : "bg-[#1E6B52] hover:bg-[#175540]"
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Coins className="w-3.5 h-3.5" />
                    )}
                    <span>{submitting ? "Đang xử lý..." : "Xác Nhận Thanh Toán"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
