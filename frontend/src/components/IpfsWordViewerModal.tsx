"use client";

import React, { useEffect, useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FileText,
  Download,
  X,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

interface IpfsDocPreviewData {
  estate_id: number;
  estate_name: string;
  symbol: string;
  file_name: string;
  format: string;
  mime_type: string;
  doc_cid: string;
  doc_hash: string;
  onchain_doc_hash?: string | null;
  size_bytes: number;
  paragraph_count?: number;
  table_count?: number;
  html_content: string;
  raw_url: string;
  download_url: string;
}

interface IpfsWordViewerModalProps {
  open: boolean;
  estateId: number | string | null;
  onClose: () => void;
}

export function IpfsWordViewerModal({
  open,
  estateId,
  onClose,
}: IpfsWordViewerModalProps) {
  const { apiFetch, apiUrl } = useWeb3();
  const backendBaseUrl = (apiUrl || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [docData, setDocData] = useState<IpfsDocPreviewData | null>(null);
  const [copiedCid, setCopiedCid] = useState<boolean>(false);

  useEffect(() => {
    if (!open || !estateId) return;
    let active = true;
    setLoading(true);
    setError(null);
    setDocData(null);

    apiFetch(`/assets/${estateId}/document/preview`)
      .then((res: IpfsDocPreviewData) => {
        if (active) setDocData(res);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || "Không thể tải nội dung tài liệu IPFS.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, estateId, apiFetch]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const downloadHref = docData
    ? `${backendBaseUrl}${docData.download_url}`
    : `${backendBaseUrl}/api/assets/${estateId}/document/download`;

  const formatBadge =
    docData?.format === "docx" || docData?.format === "doc"
      ? "Microsoft Word (.docx)"
      : docData?.format === "pdf"
      ? "PDF Document"
      : docData?.format === "image"
      ? "Image Document"
      : "IPFS Document";

  const handleCopyCid = () => {
    if (!docData?.doc_cid) return;
    navigator.clipboard.writeText(docData.doc_cid);
    setCopiedCid(true);
    setTimeout(() => setCopiedCid(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#1B2A24]/12 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Word Viewer Toolbar */}
        <div className="bg-[#1B2A24] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#B8844A]/20 border border-[#B8844A]/35 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold truncate text-white">
                  {docData?.file_name || "Đang mở tài liệu Word IPFS..."}
                </h3>
                <span className="inline-flex items-center whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-[#B8844A]/18 text-[#D7BC8D] ring-1 ring-inset ring-blue-400/25">
                  {formatBadge}
                </span>
                {docData?.size_bytes ? (
                  <span className="text-[11px] text-[#141413]/45 tabular-nums shrink-0">
                    {(docData.size_bytes / 1024).toFixed(2)} KB
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-[#141413]/45 truncate mt-0.5">
                {docData
                  ? `${docData.estate_name} (${docData.symbol}) · Hiển thị trực tiếp từ IPFS Gateway`
                  : "Đang giải mã & kết xuất nội dung tài liệu trực tiếp trên trình duyệt"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={downloadHref}
              download={docData?.file_name || "Ho_so_Phap_ly.docx"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E6B52] hover:bg-[#175540] text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Tải tài liệu (.docx)</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng trình xem tài liệu"
              className="p-1.5 rounded-lg hover:bg-[#14201B] text-[#141413]/45 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Document Canvas Area (A4 Paper Preview) */}
        <div className="flex-1 overflow-y-auto bg-[#EAE5DA]/85 p-4 sm:p-6">
          {loading && (
            <div className="bg-white rounded-2xl border border-[#1B2A24]/12 p-10 max-w-[820px] mx-auto space-y-4 shadow-xs">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-4 space-y-2.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-24 w-full mt-4" />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-2xl border border-[#A63A3A]/22 p-8 max-w-[720px] mx-auto text-center space-y-3 shadow-xs">
              <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" strokeWidth={1.75} />
              <p className="text-sm font-semibold text-[#A63A3A]">Không thể hiển thị tài liệu</p>
              <p className="text-xs text-[#141413]/55">{error}</p>
            </div>
          )}

          {!loading && !error && docData && (
            <>
              {docData.format === "pdf" ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#1B2A24]/12 overflow-hidden max-w-[860px] mx-auto">
                  <iframe
                    src={`${backendBaseUrl}${docData.raw_url}`}
                    title={docData.file_name}
                    className="w-full h-[68vh] border-0"
                  />
                </div>
              ) : docData.format === "image" ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#1B2A24]/12 p-4 max-w-[860px] mx-auto text-center">
                  <img
                    src={`${backendBaseUrl}${docData.raw_url}`}
                    alt={docData.file_name}
                    className="max-h-[68vh] mx-auto rounded-lg border border-[#1B2A24]/14"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-[#1B2A24]/12 max-w-[820px] mx-auto px-6 py-8 sm:px-12 sm:py-11 text-[#141413]">
                  <div
                    className="docx-web-preview"
                    dangerouslySetInnerHTML={{ __html: docData.html_content }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with IPFS CID & On-chain Keccak-256 Hash */}
        {docData && (
          <div className="bg-[#F4F1EA]/70 border-t border-[#1B2A24]/12 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#141413]/55 shrink-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <StatusBadge variant="success" dot>
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>IPFS Verified</span>
              </StatusBadge>
              <span className="font-mono text-xs text-[#141413]/80 truncate">
                CID: <strong className="text-[#1B2A24]">{docData.doc_cid}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyCid}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1B2A24] hover:text-[#1B2A24] transition-colors"
              >
                {copiedCid ? (
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
            <div className="font-mono text-[11px] text-[#141413]/55 truncate max-w-md">
              docHash: {docData.doc_hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
