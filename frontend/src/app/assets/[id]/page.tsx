"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Context";
import { formatEventTypeLabel, formatPropertyKindLabel } from "@/i18n/labels";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { Skeleton, TableRowsSkeleton } from "@/components/ui/Skeleton";
import {
  PaymentOtpModal,
  PaymentOtpPayload,
  PaymentOtpSuccessResult,
} from "@/components/PaymentOtpModal";
import { IpfsWordViewerModal } from "@/components/IpfsWordViewerModal";
import {
  Globe,
  RefreshCw,
  ShoppingBag,
  FileCheck2,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Download,
  Eye,
  AlertTriangle,
  MapPin,
  X,
  LogIn,
} from "lucide-react";

function getEventBadgeVariant(eventType?: string): "success" | "info" | "purple" | "neutral" {
  if (eventType === "PRIMARY_BUY") return "success";
  if (eventType === "MINT") return "info";
  if (eventType === "FORCED_TRANSFER") return "purple";
  return "info";
}

export default function AssetDetailPage() {
  const params = useParams();
  const estateId = params?.id as string;

  const {
    currentUser,
    isAuthenticated,
    usdcBalance,
    apiFetch,
    refreshBalances,
    getContract,
    apiUrl,
  } = useWeb3();

  const role = currentUser?.role_label || "investor";
  const backendBaseUrl = (apiUrl || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

  const [estate, setEstate] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "ok" | "err";
    text: string;
    txHash?: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // State cho Investor Mua sơ cấp (UC-09)
  const [buyAmount, setBuyAmount] = useState<string>("50");

  // State cho Issuer Mở bán sơ cấp (Phần 5.4 — UC-06)
  const [openSalePrice, setOpenSalePrice] = useState<string>("100");
  const [openSaleAmount, setOpenSaleAmount] = useState<string>("5000");
  const [openSaleStartDate, setOpenSaleStartDate] = useState<string>("2026-11-18");
  const [openSaleEndDate, setOpenSaleEndDate] = useState<string>("2026-12-31");
  const [openSaleNotes] = useState<string>(
    "Đợt chào bán cổ phần sơ cấp cố định đơn giá qua hợp đồng PrimarySale"
  );

  // State cho Issuer Cập nhật Định giá (Phần 5.5 — UC-07)
  const [newValuation, setNewValuation] = useState<string>("");
  const [valuationBasis, setValuationBasis] = useState<string>(
    "Chứng thư thẩm định giá độc lập SAVILLS / CBRE 2026"
  );
  const [valuationNotes, setValuationNotes] = useState<string>(
    "Điều chỉnh định giá theo biến động giá thị trường khu vực và tiến độ hạ tầng"
  );

  // State kiểm chứng IPFS & số dư On-chain
  const [onchainDocHash, setOnchainDocHash] = useState<string | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<number>(0);
  const [ipfsVerifyResult, setIpfsVerifyResult] = useState<any | null>(null);
  const [verifyingIpfs, setVerifyingIpfs] = useState<boolean>(false);
  const [wordViewerOpen, setWordViewerOpen] = useState<boolean>(false);

  // Modal xác nhận giao dịch Blockchain (Phần X) & Modal chi tiết giao dịch (Phần 5.7)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: "tokenize" | "open_sale" | "close_sale" | "update_valuation";
    title: string;
    description: string;
  } | null>(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState<any | null>(null);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/assets/${estateId}`);
      setEstate(data);
      setNewValuation(String(data.valuation || 1000000));
      if (data.primary_sale?.price_per_share) {
        setOpenSalePrice(String(data.primary_sale.price_per_share));
      }
      if (data.primary_sale?.total_amount && data.primary_sale.total_amount > 0) {
        setOpenSaleAmount(String(data.primary_sale.total_amount));
      } else if (data.total_shares) {
        setOpenSaleAmount(String(Math.min(5000, Number(data.total_shares))));
      }

      if (data.token_address && currentUser?.address) {
        try {
          const tok = getContract("AssetToken", data.token_address);
          const [hashChain, rawBal] = await Promise.all([
            tok.docHash(),
            tok.balanceOf(currentUser.address),
          ]);
          setOnchainDocHash(hashChain);
          setUserTokenBalance(Number(rawBal) / 1e18);
        } catch {
          const own = await apiFetch(`/ownership/${currentUser.address}`);
          const found = own.holdings?.find(
            (h: any) => h.token_address?.toLowerCase() === data.token_address?.toLowerCase()
          );
          if (found) setUserTokenBalance(found.shares_balance);
          setOnchainDocHash(data.onchain_doc_hash || data.doc_hash);
        }
      } else {
        setOnchainDocHash(data.doc_hash);
        setUserTokenBalance(0);
      }
    } catch (err: any) {
      setStatusMsg({ type: "err", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estateId) loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estateId, currentUser?.address]);

  // Kiểm chứng lại tính toàn vẹn tài liệu IPFS (Phần 5.6)
  const handleReverifyIpfs = async () => {
    if (!estate) return;
    setVerifyingIpfs(true);
    try {
      const res = await apiFetch(`/assets/${estate.id}/verify-ipfs`);
      setIpfsVerifyResult(res);
      setOnchainDocHash(res.onchain_doc_hash);
      setStatusMsg({
        type: res.integrity_verified ? "ok" : "err",
        text: res.integrity_verified
          ? `[IPFS Integrity Verified] Mã băm Keccak-256 của tệp pháp lý (${res.recomputed_file_hash.slice(
              0,
              18
            )}...) khớp 100% với bản ghi trên Smart Contract AssetToken!`
          : `[CẢNH BÁO HASH MISMATCH] Phát hiện sai lệch mã băm tài liệu pháp lý giữa tệp IPFS và Smart Contract!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "err", text: err.message });
    } finally {
      setVerifyingIpfs(false);
    }
  };

  const [paymentOtpPayload, setPaymentOtpPayload] = useState<PaymentOtpPayload | null>(null);

  // Investor mua sơ cấp (UC-09) — mở Modal xác thực OTP qua Gmail trước khi ký giao dịch on-chain
  const handleBuyPrimary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estate) return;
    const qty = Number(buyAmount);
    if (!Number.isFinite(qty) || qty <= 0) {
      setStatusMsg({ type: "err", text: "Vui lòng nhập số lượng phần sở hữu hợp lệ (> 0)!" });
      return;
    }
    setStatusMsg(null);
    setPaymentOtpPayload({
      txType: "PRIMARY_BUY",
      targetId: estate.id,
      estateName: estate.name,
      symbol: estate.symbol,
      tokenAddress: estate.token_address || "",
      amount: qty,
      pricePerShare: Number(estate.primary_sale?.price_per_share || 0),
    });
  };

  const handlePrimaryPaymentSuccess = async (res: PaymentOtpSuccessResult) => {
    await refreshBalances();
    await loadDetail();
    setStatusMsg({
      type: "ok",
      text:
        `[Mua sơ cấp thành công · OTP Verified] Đã nhận +${res.shares_bought} ${estate?.symbol} ` +
        `(Thanh toán $${Number(res.usdc_paid).toLocaleString("en-US")} mUSDC · Tỷ lệ sở hữu mới: ${Number(
          res.ownership_percent
        ).toFixed(4)}%)` +
        (res.receipt_email_queued && res.recipient_email
          ? ` — Biên lai xác nhận đã được gửi về Gmail (${res.recipient_email})!`
          : "!"),
      txHash: res.tx_hash,
    });
  };

  // Thực thi thao tác của Issuer sau khi đã xác nhận trên Modal (Phần 5.4 & 5.5)
  const executeConfirmedIssuerAction = async () => {
    if (!confirmModal || !estate) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      if (confirmModal.action === "tokenize") {
        const res = await apiFetch(`/assets/${estate.id}/tokenize`, { method: "POST" });
        setConfirmModal(null);
        await loadDetail();
        setStatusMsg({
          type: "ok",
          text: `[Token hóa thành công] Đã triển khai hợp đồng AssetToken (${res.symbol}) tại địa chỉ ${res.token_address}!`,
          txHash: res.tx_hash,
        });
      } else if (confirmModal.action === "open_sale") {
        const res = await apiFetch("/sales/primary/open", {
          method: "POST",
          body: JSON.stringify({
            real_estate_id: estate.id,
            token_address: estate.token_address,
            price_per_share: Number(openSalePrice),
            amount: Number(openSaleAmount),
            start_date: openSaleStartDate,
            end_date: openSaleEndDate,
            notes: openSaleNotes,
          }),
        });
        setConfirmModal(null);
        await loadDetail();
        setStatusMsg({
          type: "ok",
          text: `[Mở bán sơ cấp] Đã mở bán ${Number(openSaleAmount).toLocaleString("en-US")} ${
            estate.symbol
          } với đơn giá $${Number(openSalePrice).toLocaleString("en-US")} mUSDC/cp!`,
          txHash: res.tx_hash,
        });
      } else if (confirmModal.action === "close_sale") {
        const res = await apiFetch(`/sales/primary/close?real_estate_id=${estate.id}`, {
          method: "POST",
        });
        setConfirmModal(null);
        await loadDetail();
        setStatusMsg({
          type: "ok",
          text: `Đã đóng đợt mở bán sơ cấp thành công.`,
          txHash: res.tx_hash,
        });
      } else if (confirmModal.action === "update_valuation") {
        const res = await apiFetch(`/assets/${estate.id}/valuation`, {
          method: "POST",
          body: JSON.stringify({
            new_valuation: Number(newValuation),
            basis: valuationBasis,
            notes: valuationNotes,
          }),
        });
        setConfirmModal(null);
        await loadDetail();
        setStatusMsg({
          type: "ok",
          text: `[Cập nhật Định giá] Đã ghi nhận định giá mới $${Number(
            newValuation
          ).toLocaleString("en-US")} mUSDC lên hợp đồng AssetToken!`,
          txHash: res.tx_hash,
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "2026-11-18 09:00";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.replace("T", " ").slice(0, 19);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  if (loading && !estate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
          <div className="bg-[#1B2A24] p-6 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full bg-[#141413]" />
              <Skeleton className="h-5 w-28 rounded-full bg-[#141413]" />
            </div>
            <Skeleton className="h-7 w-96 bg-[#141413]" />
            <Skeleton className="h-4 w-72 bg-[#141413]" />
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#1B2A24]/12 rounded-2xl p-5">
            <table className="w-full">
              <tbody>
                <TableRowsSkeleton rows={5} cols={6} />
              </tbody>
            </table>
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!estate) {
    return (
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-10 text-center space-y-3 shadow-xs">
        <p className="text-sm font-semibold text-[#A63A3A]">Không tìm thấy hồ sơ bất động sản</p>
        <Link
          href="/assets"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Danh mục Bất động sản</span>
        </Link>
      </div>
    );
  }

  const sale = estate.primary_sale || {};
  const totalShares = Number(estate.total_shares || 0);
  const offeredShares = Number(sale.total_amount || 0);
  const soldShares = Number(sale.sold_amount || 0);
  const remainingSaleShares = Number(sale.remaining_amount || 0);
  const raisedUsdc = Number(sale.raised_usdc || 0);
  const saleProgressPct = Number(sale.progress_percent || 0);
  const vaultShares = Number(estate.vault_balance ?? totalShares - soldShares);

  const totalCostUsdc = Number(buyAmount || 0) * Number(sale.price_per_share || 0);
  const currentWalletOwnershipPct =
    totalShares > 0 ? ((userTokenBalance / totalShares) * 100).toFixed(2) : "0.00";
  const soldRatioPct =
    totalShares > 0 ? ((soldShares / totalShares) * 100).toFixed(2) : "0.00";

  const hashMatches =
    !onchainDocHash || onchainDocHash.toLowerCase() === estate.doc_hash?.toLowerCase();

  const isSaleAmountValid =
    Number(openSaleAmount) > 0 && Number(openSaleAmount) <= totalShares;
  const isSalePriceValid = Number(openSalePrice) > 0;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/assets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#141413]/65 hover:text-[#141413] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Quay lại Danh mục Bất động sản</span>
        </Link>
        <div className="flex items-center gap-2">
          {role === "issuer" && (
            <Link
              href="/admin?tab=issuer-dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-medium text-[#141413]/80 shadow-xs transition-colors"
            >
              Về Issuer Dashboard
            </Link>
          )}
          <button
            onClick={loadDetail}
            disabled={loading || busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-medium text-[#141413]/80 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner kèm Transaction Hash */}
      {statusMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium flex items-center justify-between shadow-xs ${
            statusMsg.type === "ok"
              ? "border-[#1E6B52]/22 bg-[#E9F4EF] text-[#1E6B52]"
              : "border-[#A63A3A]/22 bg-[#FBF0F0] text-[#A63A3A]"
          }`}
        >
          <div className="space-y-0.5">
            <div>{statusMsg.text}</div>
            {statusMsg.txHash && (
              <div className="font-mono text-[11px] opacity-90">
                Transaction Hash: <strong>{statusMsg.txHash}</strong>
              </div>
            )}
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="ml-4 p-1 rounded-md hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* =====================================================================
          PHẦN 5.1 & 5.2: TỔNG QUAN TÀI SẢN + THỐNG KÊ TOKEN
         ===================================================================== */}
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
        {/* Banner Tổng quan Tài sản */}
        <div className="bg-[#1B2A24] p-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge variant="info">
                {formatPropertyKindLabel(estate.property_kind)}
              </StatusBadge>
              <StatusBadge variant="neutral" className="font-mono">
                Mã Token: {estate.symbol}
              </StatusBadge>
              {!estate.token_address ? (
                <StatusBadge variant="warning" dot>
                  Sẵn sàng phát hành
                </StatusBadge>
              ) : estate.is_paused ? (
                <StatusBadge variant="danger" dot>
                  Đang tạm dừng
                </StatusBadge>
              ) : sale.is_open ? (
                <StatusBadge variant="success" dot>
                  Đã Token hóa · Đang mở bán
                </StatusBadge>
              ) : (
                <StatusBadge variant="info" dot>
                  Đã Token hóa · Đang hoạt động
                </StatusBadge>
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">{estate.name}</h1>
            <p className="text-[13px] text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D7BC8D] shrink-0" strokeWidth={1.75} />
                {estate.address_text}
              </span>
              <span className="text-[#141413]/65">·</span>
              <span>
                Diện tích: <strong className="text-white">{Number(estate.area_m2).toLocaleString("en-US")} m²</strong>
              </span>
              <span className="text-[#141413]/65">·</span>
              <span>
                Năm xây dựng: <strong className="text-white">{estate.build_year || 2024}</strong>
              </span>
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 text-xs space-y-1.5 shrink-0 relative z-10">
            <span className="text-[#141413]/45 block text-[11px] uppercase tracking-wider font-semibold">
              Smart Contract (AssetToken ERC-20)
            </span>
            {estate.token_address ? (
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs font-medium text-emerald-400">
                  {estate.token_address}
                </code>
                <button
                  onClick={() => copyToClipboard(estate.token_address)}
                  className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Sao chép địa chỉ Smart Contract"
                >
                  {copiedText === estate.token_address ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            ) : (
              <span className="text-amber-300 font-medium block">
                Chưa triển khai lên chuỗi
              </span>
            )}
            <div className="text-xs text-[#141413]/45">
              Đơn vị phát hành: <strong className="text-slate-200">{estate.issuer_name}</strong>
            </div>
          </div>
        </div>

        {/* Mô tả chi tiết & Thống kê Token */}
        <div className="p-6 space-y-5">
          {estate.description && (
            <p className="text-[13px] text-[#141413]/65 leading-relaxed bg-[#F4F1EA]/70 p-4 rounded-xl border border-slate-200/70">
              <strong className="text-[#141413] font-semibold">Mô tả tài sản:</strong> {estate.description}
            </p>
          )}

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55 mb-3">
              Thống kê Token &amp; Cấu trúc Phân bổ Cổ phần On-chain
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3.5 bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-xl">
                <span className="text-[#141413]/55 block text-xs">Tổng cổ phần phát hành</span>
                <strong className="text-base font-bold text-[#141413] tabular-nums whitespace-nowrap block mt-1">
                  {totalShares.toLocaleString("en-US")} {estate.symbol}
                </strong>
                <span className="text-[11px] text-[#141413]/45">100% Tổng cung</span>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-xl">
                <span className="text-[#141413]/55 block text-xs">Cổ phần đã bán sơ cấp</span>
                <strong className="text-base font-bold text-[#1E6B52] tabular-nums whitespace-nowrap block mt-1">
                  {soldShares.toLocaleString("en-US")} {estate.symbol}
                </strong>
                <span className="text-[11px] text-[#141413]/45 tabular-nums">
                  Chiếm {soldRatioPct}% tổng cung
                </span>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-xl">
                <span className="text-[#141413]/55 block text-xs">Cổ phần còn lại trong kho</span>
                <strong className="text-base font-bold text-[#1B2A24] tabular-nums whitespace-nowrap block mt-1">
                  {vaultShares.toLocaleString("en-US")} {estate.symbol}
                </strong>
                <span className="text-[11px] text-[#141413]/45">Lưu ký tại PrimarySale</span>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-xl">
                <span className="text-[#141413]/55 block text-xs">Tổng định giá tài sản</span>
                <strong className="text-base font-bold text-[#141413] tabular-nums whitespace-nowrap block mt-1">
                  ${Number(estate.valuation).toLocaleString("en-US")}
                </strong>
                <span className="text-[11px] text-[#141413]/45">Đơn vị: mUSDC</span>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-xl">
                <span className="text-[#141413]/55 block text-xs">Giá trị nội tại / cổ phần</span>
                <strong className="text-base font-bold text-[#141413] tabular-nums whitespace-nowrap block mt-1">
                  ${Number(estate.intrinsic_price_per_share).toLocaleString("en-US")}
                </strong>
                <span className="text-[11px] text-[#141413]/45">Định giá ÷ Tổng cung</span>
              </div>

              <div className="p-3.5 bg-[#EEF2F0] border border-[#1B2A24]/15 rounded-xl">
                <span className="text-[#1B2A24] font-medium block text-xs">
                  Ví hiện tại nắm giữ
                </span>
                <strong className="text-base font-bold text-[#1B2A24] tabular-nums whitespace-nowrap block mt-1">
                  {userTokenBalance.toLocaleString("en-US")} {estate.symbol}
                </strong>
                <span className="text-[11px] text-[#1B2A24]/75 tabular-nums">
                  Tỷ lệ ví: {currentWalletOwnershipPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          KHU VỰC CHÍNH: CỘT TRÁI (2/3) & CỘT PHẢI (1/3)
         ===================================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tình hình mở bán sơ cấp */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B2A24]/8 pb-3.5">
              <div>
                <h2 className="text-base font-semibold text-[#141413]">
                  Tình hình Mở bán Sơ cấp &amp; Huy động Vốn
                </h2>
                <p className="text-[13px] text-[#141413]/55">
                  Tiến độ phân phối cổ phần trực tiếp từ hợp đồng PrimarySale
                </p>
              </div>
              <StatusBadge variant={sale.is_open ? "success" : "neutral"} dot>
                {sale.is_open ? "Đang mở bán" : "Đã đóng / Chưa mở"}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F4F1EA]/80 border border-slate-200/70">
                <span className="text-[#141413]/55 block">Đưa ra chào bán</span>
                <strong className="text-sm font-semibold text-[#141413] tabular-nums whitespace-nowrap mt-0.5 block">
                  {offeredShares.toLocaleString("en-US")} {estate.symbol}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F1EA]/80 border border-slate-200/70">
                <span className="text-[#141413]/55 block">Số lượng đã bán</span>
                <strong className="text-sm font-semibold text-[#1E6B52] tabular-nums whitespace-nowrap mt-0.5 block">
                  {soldShares.toLocaleString("en-US")} {estate.symbol}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F1EA]/80 border border-slate-200/70">
                <span className="text-[#141413]/55 block">Số lượng còn lại</span>
                <strong className="text-sm font-semibold text-[#1B2A24] tabular-nums whitespace-nowrap mt-0.5 block">
                  {remainingSaleShares.toLocaleString("en-US")} {estate.symbol}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#F4F1EA]/80 border border-slate-200/70">
                <span className="text-[#141413]/55 block">Giá bán / cổ phần</span>
                <strong className="text-sm font-semibold text-[#141413] tabular-nums whitespace-nowrap mt-0.5 block">
                  ${Number(sale.price_per_share || 0).toLocaleString("en-US")}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#E9F4EF] border border-emerald-200/70 sm:col-span-2 xl:col-span-1">
                <span className="text-[#1E6B52] block font-medium">Tổng vốn huy động</span>
                <strong className="text-sm font-bold text-[#1E6B52] tabular-nums whitespace-nowrap mt-0.5 block">
                  ${raisedUsdc.toLocaleString("en-US")}
                </strong>
              </div>
            </div>

            {/* Progress Bar Tiến độ bán */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#141413]/80">
                  Tiến độ phân phối đợt mở bán sơ cấp
                </span>
                <strong className="text-[#1B2A24] tabular-nums">
                  {saleProgressPct}% ({soldShares.toLocaleString("en-US")} /{" "}
                  {offeredShares.toLocaleString("en-US")} {estate.symbol})
                </strong>
              </div>
              <div className="w-full h-2.5 bg-[#EAE5DA]/85 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1B2A24] to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, saleProgressPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quản lý và Kiểm chứng Hồ sơ Pháp lý IPFS */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B2A24]/8 pb-3.5">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2F0] text-[#1B2A24] flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck2 className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#141413]">
                    Quản lý &amp; Kiểm chứng Hồ sơ Pháp lý (IPFS)
                  </h2>
                  <p className="text-[13px] text-[#141413]/55">
                    Đối chiếu chữ ký mật mã Keccak-256 giữa tệp IPFS và hợp đồng AssetToken
                  </p>
                </div>
              </div>

              <StatusBadge variant={hashMatches ? "success" : "danger"} dot>
                {hashMatches ? "Toàn vẹn dữ liệu (Khớp On-chain)" : "Cảnh báo: Hash không khớp"}
              </StatusBadge>
            </div>

            {!hashMatches && (
              <div className="p-3.5 rounded-xl border border-[#A63A3A]/22 bg-[#FBF0F0] text-[#A63A3A] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#A63A3A]" strokeWidth={1.75} />
                <span>
                  <strong>CẢNH BÁO BẢO MẬT:</strong> Mã băm tài liệu pháp lý hiện tại không khớp với
                  bản ghi bất biến docHash trên hợp đồng AssetToken!
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl">
                <span className="text-[#141413]/55 block">Tên &amp; Loại tài liệu pháp lý</span>
                <strong className="text-[#141413] font-semibold block mt-1 truncate" title={estate.doc_name}>
                  {estate.doc_name || `Ho_so_Phap_ly_${estate.symbol}.docx`}
                </strong>
                <span className="text-[11px] text-[#1B2A24] font-medium mt-0.5 block">
                  Microsoft Word (.docx) · Hồ sơ thẩm định
                </span>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl">
                <span className="text-[#141413]/55 block">Thời gian đăng ký &amp; Phiên bản</span>
                <strong className="text-[#141413] font-semibold tabular-nums block mt-1">
                  {formatDate(estate.created_at)}
                </strong>
                <span className="text-[11px] text-[#1E6B52] font-medium mt-0.5 block">
                  v1.0 (Ghi nhận bất biến On-chain)
                </span>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl">
                <span className="text-[#141413]/55 block">Dung lượng &amp; Lưu trữ</span>
                <strong className="text-[#141413] font-semibold tabular-nums block mt-1">
                  {estate.doc_size_bytes
                    ? `${(Number(estate.doc_size_bytes) / 1024).toFixed(2)} KB`
                    : "Bản ghi Genesis IPFS"}
                </strong>
                <span className="text-[11px] text-[#141413]/55 mt-0.5 block">IPFS Pinata / Local Gateway</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#141413]/55 font-medium">
                    IPFS Content Identifier (docCID)
                  </span>
                  <button
                    onClick={() => copyToClipboard(estate.doc_cid)}
                    className="inline-flex items-center gap-1 text-xs text-[#1B2A24] hover:text-[#1B2A24] font-medium transition-colors"
                  >
                    {copiedText === estate.doc_cid ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#1E6B52]" strokeWidth={2} />
                        <span className="text-[#1E6B52]">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Sao chép CID</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="font-mono text-xs text-[#1B2A24] font-medium break-all block">
                  {estate.doc_cid}
                </code>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#141413]/55 font-medium">
                    Keccak-256 Document Hash (docHash)
                  </span>
                  <button
                    onClick={() => copyToClipboard(estate.doc_hash)}
                    className="inline-flex items-center gap-1 text-xs text-[#1B2A24] hover:text-[#1B2A24] font-medium transition-colors"
                  >
                    {copiedText === estate.doc_hash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#1E6B52]" strokeWidth={2} />
                        <span className="text-[#1E6B52]">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Sao chép Hash</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="font-mono text-xs text-[#141413]/80 break-all block">
                  {estate.doc_hash}
                </code>
              </div>
            </div>

            {/* Các nút thao tác Hồ sơ IPFS */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setWordViewerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white font-medium shadow-xs transition-colors"
              >
                <Eye className="w-4 h-4" strokeWidth={1.75} />
                <span>Xem tài liệu IPFS</span>
              </button>

              <a
                href={`${backendBaseUrl}/api/assets/${estate.id}/document/download`}
                download={estate.doc_name || `Ho_so_Phap_ly_${estate.symbol}.docx`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 font-medium shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-[#141413]/55" strokeWidth={1.75} />
                <span>Tải tài liệu (.docx)</span>
              </a>

              <button
                type="button"
                onClick={handleReverifyIpfs}
                disabled={verifyingIpfs}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#1E6B52]/22 bg-[#E9F4EF] hover:bg-[#D8ECE3] text-[#1E6B52] font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingIpfs ? "animate-spin" : ""}`} strokeWidth={1.75} />
                <span>Kiểm chứng lại tính toàn vẹn On-chain</span>
              </button>
            </div>

            {ipfsVerifyResult && (
              <div className="p-3.5 rounded-xl bg-[#F4F1EA]/70 border border-[#1B2A24]/12 text-xs space-y-1 font-mono text-[#141413]/80">
                <div className="font-sans font-semibold text-[#141413] mb-1">
                  Kết quả đối chiếu mật mã Keccak-256 trực tiếp:
                </div>
                <div>• Hash lưu trong Database: {ipfsVerifyResult.db_doc_hash}</div>
                <div>• Hash đọc từ Smart Contract: {ipfsVerifyResult.onchain_doc_hash}</div>
                <div>• Hash băm lại từ tệp IPFS: {ipfsVerifyResult.recomputed_file_hash}</div>
              </div>
            )}
          </div>

          {/* Bảng Lịch sử các lần thay đổi Định giá */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1B2A24]/8 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#141413]">
                  Lịch sử Thay đổi Định giá Bất động sản
                </h2>
                <p className="text-[13px] text-[#141413]/55">
                  Nhật ký cập nhật định giá tài sản bất biến trên hợp đồng thông minh
                </p>
              </div>
              <StatusBadge variant="neutral">
                {(estate.valuation_history || []).length} lần ghi nhận
              </StatusBadge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Định giá cũ → mới</th>
                    <th className="py-3 px-4">Người thực hiện</th>
                    <th className="py-3 px-4">Căn cứ &amp; Ghi chú</th>
                    <th className="py-3 px-4 text-right">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-sm">
                  {(estate.valuation_history || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#141413]/55">
                        Chưa có lịch sử điều chỉnh định giá nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    (estate.valuation_history || []).map((v: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#F4F1EA]/75 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#141413]/55 tabular-nums">
                          {formatDate(v.signed_at)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                          {Number(v.old_valuation) === Number(v.new_valuation) ? (
                            <strong className="text-sm font-semibold text-[#141413]">
                              ${Number(v.new_valuation).toLocaleString("en-US")} mUSDC
                            </strong>
                          ) : (
                            <>
                              <span className="text-xs text-[#141413]/45 line-through mr-1.5">
                                ${Number(v.old_valuation).toLocaleString("en-US")}
                              </span>
                              <strong className="text-sm font-semibold text-[#1E6B52]">
                                → ${Number(v.new_valuation).toLocaleString("en-US")} mUSDC
                              </strong>
                            </>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-sm font-medium text-[#141413]">{v.actor_name}</div>
                          {v.actor_address && <CopyAddress address={v.actor_address} chars={4} />}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-sm font-medium text-[#141413]">{v.basis}</div>
                          <div className="text-xs text-[#141413]/55">{v.notes}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {v.tx_hash ? (
                            <CopyAddress address={v.tx_hash} chars={5} className="justify-end" />
                          ) : (
                            <span className="font-mono text-xs text-[#141413]/45">Genesis</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng Lịch sử Giao dịch */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1B2A24]/8 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#141413]">
                  Lịch sử Giao dịch Cổ phần Bất động sản
                </h2>
                <p className="text-[13px] text-[#141413]/55">
                  Nhấp vào một dòng giao dịch bất kỳ để xem chi tiết Block, Đơn giá và TxHash
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-3">Loại GD</th>
                    <th className="py-3 px-3">Người gửi</th>
                    <th className="py-3 px-3">Người nhận</th>
                    <th className="py-3 px-3">Số lượng</th>
                    <th className="py-3 px-3">Thanh toán</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-sm">
                  {(estate.transfers || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-[#141413]/55">
                        Chưa có giao dịch chuyển nhượng nào phát sinh cho tài sản này.
                      </td>
                    </tr>
                  ) : (
                    (estate.transfers || []).map((t: any) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTxDetail(t)}
                        className="hover:bg-[#F4F1EA]/75 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#141413]/55 tabular-nums">
                          {formatDate(t.created_at)}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <StatusBadge variant={getEventBadgeVariant(t.event_type)}>
                            {formatEventTypeLabel(t.event_type)}
                          </StatusBadge>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-xs text-[#141413]/55 whitespace-nowrap">
                          {t.from_address.slice(0, 6)}...{t.from_address.slice(-4)}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-xs text-[#141413] whitespace-nowrap">
                          {t.to_address.slice(0, 6)}...{t.to_address.slice(-4)}
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#141413] tabular-nums whitespace-nowrap">
                          {Number(t.amount).toLocaleString("en-US")} {estate.symbol}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#1E6B52] tabular-nums whitespace-nowrap">
                          {t.usdc_paid
                            ? `$${Number(t.usdc_paid).toLocaleString("en-US")} mUSDC`
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <StatusBadge variant="success" dot>
                            Đã xác nhận
                          </StatusBadge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-[#1B2A24]/8 flex items-center gap-1.5 text-xs text-[#141413]/55 bg-slate-50/40">
              <Globe className="w-3.5 h-3.5 text-[#141413]/45" strokeWidth={1.75} />
              <span>
                Tổng cộng <strong className="text-[#141413]/80 tabular-nums">{estate.transfers?.length || 0}</strong> sự kiện giao dịch đã xác
                nhận từ Blockchain Event Indexer
              </span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3): PHÂN QUYỀN HIỂN THỊ CÔNG CỤ THEO VAI TRÒ */}
        <div className="space-y-6">
          {/* 1. INVESTOR: HỘP ĐẶT MUA SƠ CẤP */}
          {role === "investor" && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="border-b border-[#1B2A24]/8 pb-3.5 space-y-1">
                <StatusBadge variant="success" dot>
                  Mua sơ cấp
                </StatusBadge>
                <h2 className="text-base font-semibold text-[#141413] pt-1">
                  Đặt mua Cổ phần Sơ cấp
                </h2>
              </div>

              {sale.is_open ? (
                <form onSubmit={handleBuyPrimary} className="space-y-3.5 text-xs">
                  <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#141413]/55">Đơn giá chào bán:</span>
                      <strong className="text-[#141413] font-semibold tabular-nums">
                        ${Number(sale.price_per_share).toLocaleString("en-US")} mUSDC
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#141413]/55">Cổ phần còn lại:</span>
                      <strong className="text-[#1B2A24] font-semibold tabular-nums">
                        {remainingSaleShares.toLocaleString("en-US")} /{" "}
                        {offeredShares.toLocaleString("en-US")}
                      </strong>
                    </div>
                    {isAuthenticated && (
                      <div className="flex justify-between">
                        <span className="text-[#141413]/55">Số dư ví của bạn:</span>
                        <strong className="text-[#1E6B52] font-semibold tabular-nums">
                          ${Number(usdcBalance).toLocaleString("en-US")} mUSDC
                        </strong>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-[#141413]/80 mb-1.5">
                      Số lượng cổ phần đặt mua:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={remainingSaleShares}
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 text-sm font-medium text-[#141413] tabular-nums focus:border-[#B8844A] focus:ring-2 focus:ring-[#B8844A]/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#EEF2F0] rounded-xl border border-[#1B2A24]/15">
                    <span className="text-[#141413]/80 font-medium">Tổng thanh toán:</span>
                    <strong className="text-sm font-bold text-[#1B2A24] tabular-nums">
                      ${totalCostUsdc.toLocaleString("en-US")} mUSDC
                    </strong>
                  </div>

                  {isAuthenticated ? (
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
                      <span>{busy ? "Đang ký giao dịch..." : "Mua cổ phần sơ cấp"}</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors"
                    >
                      <LogIn className="w-4 h-4" strokeWidth={1.75} />
                      <span>Đăng nhập để mua cổ phần</span>
                    </Link>
                  )}
                </form>
              ) : (
                <div className="p-4 bg-[#F4F1EA]/70 border border-slate-200/70 rounded-xl text-xs text-[#141413]/55 leading-relaxed">
                  Bất động sản này hiện chưa mở bán sơ cấp hoặc đợt mở bán đã đóng.
                </div>
              )}
            </div>
          )}

          {/* 2. ISSUER: CÔNG CỤ TOKEN HÓA / MỞ BÁN / ĐỊNH GIÁ */}
          {role === "issuer" && (
            <div className="space-y-6">
              {!estate.token_address ? (
                <div className="bg-white border border-[#B8844A]/30 rounded-xl shadow-xs p-5 space-y-4 text-xs">
                  <div className="border-b border-[#1B2A24]/8 pb-3.5 space-y-1">
                    <StatusBadge variant="warning" dot>
                      Sẵn sàng phát hành
                    </StatusBadge>
                    <h2 className="text-base font-semibold text-[#141413] pt-1">
                      Phát hành Hợp đồng AssetToken lên Blockchain
                    </h2>
                  </div>
                  <p className="text-[#141413]/65 leading-relaxed">
                    Hồ sơ bất động sản đã được đăng ký. Nhấn nút bên dưới để gọi{" "}
                    hệ thống phát hành cổ phần và phân bổ{" "}
                    <strong className="tabular-nums">{totalShares.toLocaleString("en-US")}</strong> cổ phần {estate.symbol}.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        action: "tokenize",
                        title: `Xác nhận Token hóa ${estate.name} (${estate.symbol})`,
                        description: `Hợp đồng AssetFactory sẽ triển khai một Smart Contract ERC-20 mới và đúc ${totalShares.toLocaleString(
                          "en-US"
                        )} ${estate.symbol} với mã băm pháp lý docHash = ${estate.doc_hash.slice(
                          0,
                          18
                        )}...`,
                      })
                    }
                    disabled={busy}
                    className="w-full rounded-lg bg-[#1B2A24] hover:bg-[#14201B] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    Xác nhận Token hóa (AssetFactory)
                  </button>
                </div>
              ) : (
                <>
                  {/* Quản lý đợt mở bán sơ cấp */}
                  <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4 text-xs">
                    <div className="border-b border-[#1B2A24]/8 pb-3.5 space-y-1">
                      <StatusBadge variant="success" dot>
                        Quản lý mở bán sơ cấp
                      </StatusBadge>
                      <h2 className="text-base font-semibold text-[#141413] pt-1">
                        Quản lý Đợt Mở bán Sơ cấp
                      </h2>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F4F1EA]/80 border border-slate-200/70 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#141413]/55">Trạng thái hiện tại:</span>
                        <StatusBadge variant={sale.is_open ? "success" : "danger"} dot>
                          {sale.is_open ? "Đang mở bán" : "Đã đóng bán"}
                        </StatusBadge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#141413]/55">Đang phân phối:</span>
                        <strong className="text-[#141413] tabular-nums">{offeredShares.toLocaleString("en-US")} cp</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#141413]/55">Đã bán / Còn lại:</span>
                        <strong className="text-[#141413] tabular-nums">
                          {soldShares.toLocaleString("en-US")} /{" "}
                          {remainingSaleShares.toLocaleString("en-US")} cp
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="font-medium text-[#141413]/80 block mb-1">
                            Giá bán / cp (mUSDC *):
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={openSalePrice}
                            onChange={(e) => setOpenSalePrice(e.target.value)}
                            className="w-full rounded-lg border border-[#1B2A24]/14 px-2.5 py-2 font-medium text-[#141413] tabular-nums focus:border-[#B8844A] focus:ring-2 focus:ring-[#B8844A]/20 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-[#141413]/80 block mb-1">
                            Số lượng mở bán (*):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={totalShares}
                            value={openSaleAmount}
                            onChange={(e) => setOpenSaleAmount(e.target.value)}
                            className="w-full rounded-lg border border-[#1B2A24]/14 px-2.5 py-2 font-medium text-[#141413] tabular-nums focus:border-[#B8844A] focus:ring-2 focus:ring-[#B8844A]/20 focus:outline-none"
                          />
                        </div>
                      </div>

                      {!isSaleAmountValid && (
                        <p className="text-xs text-[#A63A3A] font-medium">
                          Số lượng mở bán phải lớn hơn 0 và không vượt quá tổng cung (
                          {totalShares.toLocaleString("en-US")} cp)!
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[#141413]/55 block mb-1">Ngày bắt đầu:</label>
                          <input
                            type="date"
                            value={openSaleStartDate}
                            onChange={(e) => setOpenSaleStartDate(e.target.value)}
                            className="w-full rounded-lg border border-[#1B2A24]/14 px-2.5 py-2 text-[#141413] tabular-nums focus:border-[#B8844A] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[#141413]/55 block mb-1">Ngày kết thúc dự kiến:</label>
                          <input
                            type="date"
                            value={openSaleEndDate}
                            onChange={(e) => setOpenSaleEndDate(e.target.value)}
                            className="w-full rounded-lg border border-[#1B2A24]/14 px-2.5 py-2 text-[#141413] tabular-nums focus:border-[#B8844A] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              action: "open_sale",
                              title: `Xác nhận Mở bán Sơ cấp (${estate.symbol})`,
                              description: `Mở đợt chào bán sơ cấp cho tài sản (${
                                estate.token_address
                              }) với số lượng ${Number(openSaleAmount).toLocaleString(
                                "en-US"
                              )} cp @ đơn giá $${Number(openSalePrice).toLocaleString(
                                "en-US"
                              )} mUSDC/cp.`,
                            })
                          }
                          disabled={busy || !isSaleAmountValid || !isSalePriceValid}
                          className="flex-1 rounded-lg bg-[#1E6B52] hover:bg-[#175540] disabled:opacity-50 px-3 py-2.5 font-medium text-white shadow-xs transition-colors"
                        >
                          Mở bán sơ cấp
                        </button>

                        {sale.is_open && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                action: "close_sale",
                                title: `Xác nhận Đóng Đợt Bán Sơ cấp (${estate.symbol})`,
                                description: `Gọi PrimarySale.closeSale(${estate.token_address}). Nhà đầu tư sẽ không thể đặt mua sơ cấp thêm cho đến khi mở lại.`,
                              })
                            }
                            disabled={busy}
                            className="rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] px-3 py-2.5 font-medium transition-colors"
                          >
                            Đóng đợt bán
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cập nhật Định giá */}
                  <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4 text-xs">
                    <div className="border-b border-[#1B2A24]/8 pb-3.5 space-y-1">
                      <StatusBadge variant="info">
                        Cập nhật định giá
                      </StatusBadge>
                      <h2 className="text-base font-semibold text-[#141413] pt-1">
                        Cập nhật Định giá Tài sản
                      </h2>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between p-3 rounded-xl bg-[#F4F1EA]/80 border border-slate-200/70">
                        <span className="text-[#141413]/55">Định giá hiện tại trên chuỗi:</span>
                        <strong className="text-[#1E6B52] font-semibold tabular-nums">
                          ${Number(estate.valuation).toLocaleString("en-US")} mUSDC
                        </strong>
                      </div>

                      <div>
                        <label className="font-medium text-[#141413]/80 block mb-1">
                          Giá trị Định giá mới (mUSDC *):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newValuation}
                          onChange={(e) => setNewValuation(e.target.value)}
                          className="w-full rounded-lg border border-[#1B2A24]/14 px-3 py-2 font-semibold text-[#141413] tabular-nums focus:border-[#B8844A] focus:ring-2 focus:ring-[#B8844A]/20 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-[#141413]/80 block mb-1">
                          Căn cứ thẩm định giá:
                        </label>
                        <input
                          type="text"
                          value={valuationBasis}
                          onChange={(e) => setValuationBasis(e.target.value)}
                          className="w-full rounded-lg border border-[#1B2A24]/14 px-3 py-2 text-[#141413] focus:border-[#B8844A] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-[#141413]/80 block mb-1">
                          Ghi chú cập nhật định giá:
                        </label>
                        <textarea
                          rows={2}
                          value={valuationNotes}
                          onChange={(e) => setValuationNotes(e.target.value)}
                          className="w-full rounded-lg border border-[#1B2A24]/14 px-3 py-2 text-[#141413] focus:border-[#B8844A] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setConfirmModal({
                            open: true,
                            action: "update_valuation",
                            title: `Xác nhận Cập nhật Định giá (${estate.symbol})`,
                            description: `Định giá của ${estate.name} sẽ thay đổi từ $${Number(
                              estate.valuation
                            ).toLocaleString("en-US")} mUSDC sang $${Number(
                              newValuation
                            ).toLocaleString("en-US")} mUSDC. Lịch sử định giá cũ vẫn được bảo toàn.`,
                          })
                        }
                        disabled={busy || Number(newValuation) <= 0}
                        className="w-full rounded-lg bg-[#1B2A24] hover:bg-[#14201B] disabled:opacity-50 px-4 py-2.5 font-medium text-white shadow-xs transition-colors"
                      >
                        Ghi Định giá Mới lên Chuỗi
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. COMPLIANCE / ADMIN */}
          {(role === "compliance" || role === "admin") && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-3.5 text-xs">
              <div className="border-b border-[#1B2A24]/8 pb-3.5 space-y-1">
                <StatusBadge variant="purple">
                  Giám sát On-chain
                </StatusBadge>
                <h2 className="text-base font-semibold text-[#141413] flex items-center gap-1.5 pt-1">
                  {role === "compliance" ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />
                      <span>Giám sát Tuân thủ</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#5C3D6E]" strokeWidth={1.75} />
                      <span>Giám sát Quản trị</span>
                    </>
                  )}
                </h2>
              </div>

              <div className="p-3.5 bg-[#F4F1EA]/80 border border-slate-200/70 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#141413]/55">Trạng thái hợp đồng:</span>
                  <StatusBadge variant={estate.is_paused ? "danger" : "success"} dot>
                    {estate.is_paused ? "Đang tạm dừng" : "Đang hoạt động"}
                  </StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#141413]/55">Đợt bán sơ cấp:</span>
                  <StatusBadge variant={sale.is_open ? "success" : "neutral"}>
                    {sale.is_open ? "Đang mở bán" : "Đã đóng"}
                  </StatusBadge>
                </div>
              </div>

              <Link
                href={role === "compliance" ? "/admin?tab=compliance" : "/admin?tab=pause"}
                className="block w-full text-center rounded-lg bg-[#1B2A24] hover:bg-[#14201B] px-4 py-2.5 font-medium text-white shadow-xs transition-colors"
              >
                {role === "compliance"
                  ? "Đi tới Hàng đợi KYC & Đóng băng tài khoản →"
                  : "Đi tới Tạm dừng khẩn cấp & Khôi phục cổ phần →"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MODAL XÁC NHẬN GIAO DỊCH CỦA ISSUER */}
      {confirmModal && confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="border-b border-[#1B2A24]/8 pb-3">
              <StatusBadge variant="info">
                Xác nhận giao dịch Blockchain
              </StatusBadge>
              <h3 className="text-base font-semibold text-[#141413] mt-1.5">{confirmModal.title}</h3>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F1EA]/70 border border-slate-200/70 text-xs space-y-2">
              <p className="text-[#141413]/80 leading-relaxed">{confirmModal.description}</p>
              <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-[11px] text-[#141413]/55">
                <span>Ví Issuer ký giao dịch:</span>
                {currentUser?.address && <CopyAddress address={currentUser.address} chars={6} />}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={busy}
                className="px-4 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-medium text-[#141413]/80 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeConfirmedIssuerAction}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-xs font-medium text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {busy ? "Đang ký & chờ Block xác nhận..." : "Xác nhận & Gửi giao dịch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT GIAO DỊCH TRÊN CHUỖI */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B2A24]/8 pb-3">
              <div>
                <StatusBadge variant="info">
                  Biên lai giao dịch #{selectedTxDetail.id}
                </StatusBadge>
                <h3 className="text-base font-semibold text-[#141413] mt-1.5">
                  Chi tiết Giao dịch: {formatEventTypeLabel(selectedTxDetail.event_type)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="p-1.5 rounded-lg border border-[#1B2A24]/14 text-[#141413]/55 hover:bg-[#F4F1EA] hover:text-[#141413] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-[#F4F1EA]/80 p-4 rounded-xl border border-slate-200/70">
              <div className="flex justify-between">
                <span className="text-[#141413]/55">Tài sản bất động sản:</span>
                <strong className="text-[#141413] font-semibold">
                  {estate.name} ({estate.symbol})
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#141413]/55">Địa chỉ Ví gửi:</span>
                <CopyAddress address={selectedTxDetail.from_address} chars={6} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#141413]/55">Địa chỉ Ví nhận:</span>
                <CopyAddress address={selectedTxDetail.to_address} chars={6} />
              </div>
              <div className="flex justify-between">
                <span className="text-[#141413]/55">Số lượng cổ phần:</span>
                <strong className="text-[#141413] font-semibold tabular-nums">
                  {Number(selectedTxDetail.amount).toLocaleString("en-US")} {estate.symbol}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#141413]/55">Đơn giá quy đổi:</span>
                <strong className="text-[#141413] font-semibold tabular-nums">
                  $
                  {selectedTxDetail.usdc_paid && selectedTxDetail.amount > 0
                    ? (
                        Number(selectedTxDetail.usdc_paid) / Number(selectedTxDetail.amount)
                      ).toLocaleString("en-US")
                    : Number(sale.price_per_share || estate.intrinsic_price_per_share).toLocaleString(
                        "en-US"
                      )}{" "}
                  mUSDC / cp
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#141413]/55">Tổng tiền thanh toán:</span>
                <strong className="text-[#1E6B52] font-semibold tabular-nums">
                  {selectedTxDetail.usdc_paid
                    ? `$${Number(selectedTxDetail.usdc_paid).toLocaleString("en-US")} mUSDC`
                    : "0 mUSDC (Mint / Chuyển nhượng không qua USDC)"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#141413]/55">Block Number:</span>
                <strong className="font-mono text-[#141413] tabular-nums">#{selectedTxDetail.block_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#141413]/55">Thời gian ghi nhận:</span>
                <span className="text-[#141413]/80 tabular-nums">{formatDate(selectedTxDetail.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#141413]/55">Trạng thái xác nhận:</span>
                <StatusBadge variant="success" dot>
                  Đã xác nhận On-chain
                </StatusBadge>
              </div>
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[#141413]/55 block mb-1">Transaction Hash:</span>
                <code className="font-mono text-[11px] text-[#1B2A24] break-all">
                  {selectedTxDetail.tx_hash}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Tài Liệu Word (.docx) Trực Tiếp Tại Web */}
      <IpfsWordViewerModal
        open={wordViewerOpen}
        estateId={estate.id}
        onClose={() => setWordViewerOpen(false)}
      />

      {/* Modal Xác Thực OTP qua Gmail & Thanh Toán mUSDC (UC-09) */}
      <PaymentOtpModal
        open={Boolean(paymentOtpPayload)}
        payload={paymentOtpPayload}
        onClose={() => setPaymentOtpPayload(null)}
        onSuccess={handlePrimaryPaymentSuccess}
      />
    </div>
  );
}
