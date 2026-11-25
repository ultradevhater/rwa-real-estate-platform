"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyAddress } from "@/components/ui/CopyAddress";
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function KYCPage() {
  const { account, currentUser, isKYCVerified, apiFetch, refreshBalances } = useWeb3();
  const role = currentUser?.role_label || "investor";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("investor@rwa-lab.vn");
  const [phone, setPhone] = useState("0901234567");
  const [idNumber, setIdNumber] = useState("");
  const [docType, setDocType] = useState("National ID");
  const [notes, setNotes] = useState("");

  // 2-Sided ID Card (CCCD) States
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [frontCid, setFrontCid] = useState<string>("");
  const [frontDocName, setFrontDocName] = useState<string>("");

  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [backCid, setBackCid] = useState<string>("");
  const [backDocName, setBackDocName] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>("none");
  const [txHash, setTxHash] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [rejectionNotes, setRejectionNotes] = useState<string>("");
  const [revocationReason, setRevocationReason] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activePreviewSide, setActivePreviewSide] = useState<"front" | "back" | null>(null);
  const [forceEditMode, setForceEditMode] = useState<boolean>(false);

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const frontCameraRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const backCameraRef = useRef<HTMLInputElement | null>(null);

  const fetchKycStatus = async () => {
    if (!account) return;
    setFeedback(null);
    try {
      const data = await apiFetch("/kyc/my");
      if (data && data.id) {
        setKycStatus(data.status || "none");
        const payload = data.payload_json || {};
        setFullName(payload.full_name || currentUser?.display_name || "");
        setEmail(payload.email || "investor@rwa-lab.vn");
        setPhone(payload.phone || "0901234567");
        setIdNumber(payload.id_number || "");
        setDocType(payload.document_type || "National ID");
        setNotes(payload.notes || "");
        setTxHash(data.tx_hash || "");
        setRejectionReason(payload.rejection_reason || "");
        setRejectionNotes(payload.rejection_notes || "");
        setRevocationReason(payload.revocation_reason || "");

        // Set 2-sided CCCD data if available
        setFrontCid(payload.front_image_cid || payload.doc_cid || "");
        setBackCid(payload.back_image_cid || "");
        setFrontDocName(payload.front_doc_name || payload.doc_name || "cccd_mat_truoc.png");
        setBackDocName(payload.back_doc_name || "cccd_mat_sau.png");

        if (payload.front_preview_data_url) {
          setFrontPreview(payload.front_preview_data_url);
        }
        if (payload.back_preview_data_url) {
          setBackPreview(payload.back_preview_data_url);
        }
      } else {
        setKycStatus(isKYCVerified ? "approved" : "none");
        setFullName(currentUser?.display_name || "");
        setIdNumber("");
        setFrontCid("");
        setBackCid("");
        setFrontPreview(null);
        setBackPreview(null);
        setTxHash("");
        setRejectionReason("");
        setRejectionNotes("");
        setRevocationReason("");
      }
    } catch (e) {
      console.error("Error fetching KYC status:", e);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, [account, currentUser?.address, isKYCVerified]);

  const handleFileChange = (file: File | null, side: "front" | "back") => {
    if (!file) return;
    const allowedExts = ["png", "jpg", "jpeg", "webp", "pdf"];
    const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : "";
    if (ext && !allowedExts.includes(ext)) {
      setFeedback({
        type: "err",
        text: `Định dạng tệp '.${ext}' không hợp lệ! Chỉ chấp nhận ảnh PNG, JPG, JPEG, WEBP hoặc PDF.`,
      });
      return;
    }
    if (file.size === 0) {
      setFeedback({ type: "err", text: "Tệp ảnh bị rỗng (0 byte). Vui lòng chọn tệp hợp lệ!" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: "err", text: "Dung lượng tệp vượt quá 10 MB! Vui lòng chọn ảnh nhẹ hơn." });
      return;
    }
    setFeedback(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (side === "front") {
        setFrontFile(file);
        setFrontDocName(file.name);
        setFrontPreview(result);
      } else {
        setBackFile(file);
        setBackDocName(file.name);
        setBackPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Tạo ảnh mẫu CCCD Việt Nam mô phỏng nhanh để phục vụ kiểm thử
  const generateMockCccd = (side: "front" | "back") => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (side === "front") {
      // Mặt trước CCCD
      const grad = ctx.createLinearGradient(0, 0, 640, 400);
      grad.addColorStop(0, "#e8f4fd");
      grad.addColorStop(1, "#cde4fa");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 400);

      // Viền thẻ
      ctx.strokeStyle = "#206bc4";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 624, 384);

      // Quốc huy giả lập & Tiêu đề
      ctx.fillStyle = "#d63939";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 320, 36);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#182433";
      ctx.fillText("Độc lập - Tự do - Hạnh phúc", 320, 56);

      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#206bc4";
      ctx.fillText("CĂN CƯỚC CÔNG DÂN", 320, 92);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#141413/60";
      ctx.fillText("IDENTITY CARD", 320, 108);

      // Ảnh chân dung mô phỏng
      ctx.fillStyle = "#b9d5f3";
      ctx.fillRect(40, 130, 140, 180);
      ctx.fillStyle = "#206bc4";
      ctx.beginPath();
      ctx.arc(110, 190, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(110, 280, 55, Math.PI, 0, true);
      ctx.fill();
      ctx.fillStyle = "#182433";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("ẢNH CHÂN DUNG", 110, 325);

      // Thông tin cá nhân
      ctx.textAlign = "left";
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#d63939";
      ctx.fillText(`Số / No: ${idNumber || "079099005678"}`, 210, 150);

      ctx.fillStyle = "#141413/60";
      ctx.font = "12px sans-serif";
      ctx.fillText("Họ và tên / Full name:", 210, 180);
      ctx.fillStyle = "#182433";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText((fullName || currentUser?.display_name || "NGUYỄN VĂN AN").toUpperCase(), 210, 202);

      ctx.fillStyle = "#141413/60";
      ctx.font = "12px sans-serif";
      ctx.fillText("Ngày sinh / Date of birth:", 210, 230);
      ctx.fillStyle = "#182433";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("01/01/1990 | Giới tính / Sex: Nam", 210, 248);

      ctx.fillStyle = "#141413/60";
      ctx.font = "12px sans-serif";
      ctx.fillText("Quốc tịch / Nationality:", 210, 274);
      ctx.fillStyle = "#182433";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Việt Nam", 210, 292);

      ctx.fillStyle = "#141413/60";
      ctx.font = "12px sans-serif";
      ctx.fillText("Quê quán / Place of origin:", 210, 318);
      ctx.fillStyle = "#182433";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("TP. Hồ Chí Minh", 210, 336);

      // Watermark góc
      ctx.fillStyle = "#206bc4";
      ctx.font = "bold 11px monospace";
      ctx.fillText("[MẶT TRƯỚC - FRONT SIDE]", 40, 375);
    } else {
      // Mặt sau CCCD
      const grad = ctx.createLinearGradient(0, 0, 640, 400);
      grad.addColorStop(0, "#f4f9fe");
      grad.addColorStop(1, "#d9eafc");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 400);

      ctx.strokeStyle = "#4263eb";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 624, 384);

      // Chip điện tử mô phỏng
      ctx.fillStyle = "#ffd43b";
      ctx.fillRect(40, 40, 90, 70);
      ctx.strokeStyle = "#f59f00";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 90, 70);
      ctx.strokeRect(55, 52, 60, 46);
      ctx.fillStyle = "#e67700";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("E-CHIP", 85, 78);

      // Đặc điểm nhận dạng & Vân tay
      ctx.textAlign = "left";
      ctx.fillStyle = "#182433";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Đặc điểm nhận dạng / Personal identification:", 150, 55);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#495057";
      ctx.fillText("Nốt ruồi cách 1cm dưới sau đuôi mắt trái", 150, 78);

      ctx.fillStyle = "#182433";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Ngày cấp / Date of issue: 15/06/2022", 150, 105);

      // 2 ô vân tay
      ctx.strokeStyle = "#adb5bd";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 140, 100, 110);
      ctx.strokeRect(160, 140, 100, 110);
      ctx.fillStyle = "#868e96";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Ngón trỏ trái", 90, 240);
      ctx.fillText("Ngón trỏ phải", 210, 240);

      // MRZ Machine Readable Zone
      ctx.fillStyle = "#182433";
      ctx.fillRect(30, 275, 580, 95);
      ctx.fillStyle = "#74c0fc";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("IDVNM0790990056788<<<<<<<<<<<<<<<", 45, 305);
      ctx.fillText("9001015M3001012VNM<<<<<<<<<<<<<<8", 45, 330);
      ctx.fillText("NGUYEN<<VAN<AN<<<<<<<<<<<<<<<<<<", 45, 355);

      ctx.fillStyle = "#4263eb";
      ctx.font = "bold 11px monospace";
      ctx.fillText("[MẶT SAU - BACK SIDE]", 440, 255);
    }

    const dataUrl = canvas.toDataURL("image/png");
    if (side === "front") {
      setFrontPreview(dataUrl);
      setFrontDocName(`cccd_mat_truoc_${idNumber || "sample"}.png`);
      setFrontCid(`QmFrontMockCCCD${Date.now().toString().slice(-6)}`);
    } else {
      setBackPreview(dataUrl);
      setBackDocName(`cccd_mat_sau_${idNumber || "sample"}.png`);
      setBackCid(`QmBackMockCCCD${Date.now().toString().slice(-6)}`);
    }
  };

  const handleUseMockBothSides = () => {
    if (!idNumber) setIdNumber("079099005678");
    if (!fullName) setFullName(currentUser?.display_name || "Trần Thị Bình");
    generateMockCccd("front");
    generateMockCccd("back");
    setFeedback({
      type: "ok",
      text: "Đã tạo 2 mặt ảnh CCCD mô phỏng (Mặt trước + Mặt sau có Chip & Mã vạch MRZ) sẵn sàng nộp!",
    });
  };

  if (!currentUser) {
    return (
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-8 max-w-2xl mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-xl bg-[#F8EFE2] text-[#B8844A] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <StatusBadge variant="warning">401 · YÊU CẦU ĐĂNG NHẬP</StatusBadge>
        <h1 className="text-lg font-semibold text-[#141413]">
          Vui lòng đăng nhập để nộp hồ sơ Xác minh Danh tính (KYC)
        </h1>
        <p className="text-[13px] text-[#141413]/55">
          Chức năng nộp hồ sơ KYC 2 mặt CCCD yêu cầu bạn đăng nhập hoặc đăng ký tài khoản Nhà đầu tư trước.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white text-xs font-medium shadow-xs transition-colors"
          >
            Đi tới trang Đăng nhập / Đăng ký →
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "investor") {
    return (
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-8 max-w-2xl mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-xl bg-[#EEF2F0] text-[#1B2A24] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <StatusBadge variant="info">ROLE NOTICE · {role.toUpperCase()}</StatusBadge>
        <h1 className="text-lg font-semibold text-[#141413]">
          Trang Nộp Hồ sơ KYC Cá nhân chỉ dành cho Nhà đầu tư
        </h1>
        <p className="text-[13px] text-[#141413]/55">
          Bạn đang đăng nhập với vai trò <strong className="font-medium text-[#141413]">{currentUser?.display_name}</strong>.
        </p>
        <div className="pt-2">
          <Link
            href={
              role === "compliance"
                ? "/admin?tab=compliance-dashboard"
                : role === "issuer"
                ? "/admin?tab=issuer-dashboard"
                : "/admin?tab=dashboard"
            }
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white text-xs font-medium shadow-xs transition-colors"
          >
            Đi tới Bảng điều khiển {role.toUpperCase()} →
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = isKYCVerified || kycStatus === "approved";
  const isPendingReview = kycStatus === "pending" || kycStatus === "under_review";
  const isFormLocked = isApproved || isPendingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || isFormLocked) return;

    if (fullName.trim().length < 2) {
      setFeedback({ type: "err", text: "Vui lòng nhập đầy đủ Họ và tên hợp lệ (tối thiểu 2 ký tự)!" });
      return;
    }
    if (idNumber.trim().length < 6) {
      setFeedback({ type: "err", text: "Số CCCD / Hộ chiếu phải có ít nhất 6 ký tự!" });
      return;
    }
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setFeedback({ type: "err", text: "Địa chỉ Email không đúng định dạng!" });
      return;
    }
    if (!frontFile && !frontPreview && !frontCid) {
      setFeedback({ type: "err", text: "Vui lòng chụp hoặc tải lên Ảnh Mặt Trước của Căn cước công dân (CCCD)!" });
      return;
    }
    if (!backFile && !backPreview && !backCid) {
      setFeedback({ type: "err", text: "Vui lòng chụp hoặc tải lên Ảnh Mặt Sau của Căn cước công dân (CCCD)!" });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      let finalFrontCid = frontCid;
      let finalBackCid = backCid;

      // 1. Tải mặt trước lên kho lưu trữ bảo mật nếu có tệp mới
      if (frontFile) {
        const formDataFront = new FormData();
        formDataFront.append("file", frontFile);
        const upFront = await apiFetch("/kyc/upload-document", {
          method: "POST",
          body: formDataFront,
        });
        finalFrontCid = upFront.doc_cid || upFront.cid || `QmFront${Date.now()}`;
        setFrontCid(finalFrontCid);
      } else if (!finalFrontCid) {
        finalFrontCid = `QmFront${Date.now()}`;
        setFrontCid(finalFrontCid);
      }

      // 2. Tải mặt sau lên kho lưu trữ bảo mật nếu có tệp mới
      if (backFile) {
        const formDataBack = new FormData();
        formDataBack.append("file", backFile);
        const upBack = await apiFetch("/kyc/upload-document", {
          method: "POST",
          body: formDataBack,
        });
        finalBackCid = upBack.doc_cid || upBack.cid || `QmBack${Date.now()}`;
        setBackCid(finalBackCid);
      } else if (!finalBackCid) {
        finalBackCid = `QmBack${Date.now()}`;
        setBackCid(finalBackCid);
      }

      // 3. Nộp toàn bộ hồ sơ 2 mặt lên backend
      await apiFetch("/kyc/submit", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          id_number: idNumber,
          email,
          phone,
          document_type: docType,
          subject_type: "Investor",
          doc_cid: finalFrontCid,
          doc_name: frontDocName || frontFile?.name || "cccd_mat_truoc.png",
          front_image_cid: finalFrontCid,
          back_image_cid: finalBackCid,
          front_doc_name: frontDocName || frontFile?.name || "cccd_mat_truoc.png",
          back_doc_name: backDocName || backFile?.name || "cccd_mat_sau.png",
          front_preview_data_url: frontPreview,
          back_preview_data_url: backPreview,
          notes: `[${docType}] Hồ sơ xác minh 2 mặt CCCD. ${notes}`,
        }),
      });

      setKycStatus("pending");
      await fetchKycStatus();
      await refreshBalances();
      setFeedback({
        type: "ok",
        text: "[Hoàn tất] Hồ sơ KYC cá nhân với đầy đủ 2 mặt CCCD đã được mã hóa AES-256-GCM và lưu trữ bảo mật! Đang chờ Cán bộ Tuân thủ xét duyệt.",
      });
    } catch (err: any) {
      setFeedback({ type: "err", text: err.message || "Có lỗi xảy ra khi nộp hồ sơ KYC!" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#141413]">
          Hồ sơ Xác minh Danh tính Cá nhân (KYC)
        </h1>
        <p className="text-[13px] text-[#141413]/55 mt-0.5">
          Định danh điện tử 2 mặt Căn cước công dân (CCCD) mã hóa AES-256-GCM để cấp quyền Whitelist giao dịch On-chain.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium flex items-center justify-between ${
            feedback.type === "ok"
              ? "border-[#1E6B52]/22 bg-[#E9F4EF] text-[#1E6B52]"
              : "border-[#A63A3A]/22 bg-[#FBF0F0] text-[#A63A3A]"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-4 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Modal phóng to xem trước ảnh */}
      {activePreviewSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#1B2A24]" strokeWidth={1.75} />
                <h3 className="text-base font-semibold text-[#141413]">
                  Xem trước {activePreviewSide === "front" ? "Ảnh Mặt Trước CCCD" : "Ảnh Mặt Sau CCCD"}
                </h3>
              </div>
              <button
                onClick={() => setActivePreviewSide(null)}
                className="p-1.5 rounded-lg text-[#141413]/45 hover:text-[#141413] hover:bg-[#EAE5DA]"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center p-3 bg-[#F4F1EA]/70 rounded-xl border border-[#1B2A24]/12">
              {activePreviewSide === "front" && frontPreview ? (
                <img
                  src={frontPreview}
                  alt="Ảnh mặt trước CCCD"
                  className="max-h-[380px] max-w-full rounded-lg object-contain border border-[#1B2A24]/14"
                />
              ) : activePreviewSide === "back" && backPreview ? (
                <img
                  src={backPreview}
                  alt="Ảnh mặt sau CCCD"
                  className="max-h-[380px] max-w-full rounded-lg object-contain border border-[#1B2A24]/14"
                />
              ) : (
                <p className="text-xs text-[#141413]/55">Chưa có hình ảnh xem trước</p>
              )}
            </div>
            <div className="flex justify-between items-center pt-1 text-xs text-[#141413]/55">
              <span className="font-mono">
                {activePreviewSide === "front" ? frontDocName : backDocName}
              </span>
              <button
                onClick={() => setActivePreviewSide(null)}
                className="px-4 py-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] text-white text-xs font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-[#1B2A24]/12 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
          <div>
            <StatusBadge variant="info" className="mb-1.5">
              INVESTOR KYC SUBMISSION
            </StatusBadge>
            <h2 className="text-base font-semibold text-[#141413]">
              Hồ sơ Xác minh Danh tính Cá nhân (KYC) — {currentUser?.display_name}
            </h2>
            <p className="text-[13px] text-[#141413]/55 mt-0.5 max-w-3xl">
              Dữ liệu định danh gồm thông tin cá nhân và hình ảnh 2 mặt Căn cước công dân (CCCD) được mã hóa AES-256-GCM
              lưu trữ bảo mật; khi được Cán bộ Tuân thủ phê duyệt, địa chỉ ví sẽ được ghi vào hợp đồng{" "}
              <code className="font-mono text-xs text-[#141413]/80">IdentityRegistry</code> On-chain.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <StatusBadge variant="success" dot>
                Đã duyệt KYC On-chain
              </StatusBadge>
            ) : kycStatus === "pending" ? (
              <StatusBadge variant="warning" dot>
                Đang chờ Cán bộ Tuân thủ xét duyệt
              </StatusBadge>
            ) : kycStatus === "rejected" ? (
              <StatusBadge variant="danger" dot>
                Bị từ chối (Có thể nộp lại)
              </StatusBadge>
            ) : kycStatus === "revoked" ? (
              <StatusBadge variant="danger" dot>
                Đã thu hồi Whitelist (Có thể nộp lại)
              </StatusBadge>
            ) : (
              <StatusBadge variant="neutral">Chưa nộp hồ sơ KYC</StatusBadge>
            )}
          </div>
        </div>

        {/* Rejection / Revocation Banners */}
        {kycStatus === "rejected" && (
          <div className="mx-6 mt-5 p-4 rounded-xl bg-[#FBF0F0] border border-[#A63A3A]/22 text-xs text-[#A63A3A] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-[#A63A3A] shrink-0" strokeWidth={1.75} />
              <span>Hồ sơ KYC của bạn đã bị từ chối bởi Cán bộ Tuân thủ</span>
            </div>
            {rejectionReason && (
              <p className="text-xs">
                <strong>Lý do từ chối:</strong> {rejectionReason}
              </p>
            )}
            {rejectionNotes && (
              <p className="text-xs bg-white/80 p-2.5 rounded-lg border border-[#A63A3A]/22">
                <strong>Ghi chú hướng dẫn:</strong> {rejectionNotes}
              </p>
            )}
            <p className="text-xs text-rose-700/80">
              Vui lòng kiểm tra lại thông tin, cập nhật ảnh 2 mặt CCCD rõ nét và nhấn nút &ldquo;Nộp lại Hồ sơ KYC&rdquo; bên dưới để được thẩm định lại.
            </p>
          </div>
        )}

        {kycStatus === "revoked" && (
          <div className="mx-6 mt-5 p-4 rounded-xl bg-[#FBF0F0] border border-[#A63A3A]/22 text-xs text-[#A63A3A] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-[#A63A3A] shrink-0" strokeWidth={1.75} />
              <span>Quyền Whitelist của tài khoản đã bị thu hồi bởi Cán bộ Tuân thủ</span>
            </div>
            {revocationReason && (
              <p className="text-xs">
                <strong>Lý do thu hồi:</strong> {revocationReason}
              </p>
            )}
            <p className="text-xs text-rose-700/80">
              Bạn có thể cập nhật lại thông tin định danh mới và nộp lại hồ sơ để xem xét khôi phục quyền Whitelist.
            </p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Nhóm 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B2A24]/8 pb-2.5">
              <h3 className="font-semibold text-sm text-[#141413]">1. Thông tin Định danh Cá nhân</h3>
              <button
                type="button"
                onClick={() => {
                  setForceEditMode(true);
                  handleUseMockBothSides();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 hover:bg-[#EAE5DA]/80 font-medium text-xs transition-colors"
                title="Điền tự động thông tin & tạo 2 mặt ảnh CCCD mẫu để kiểm thử nhanh"
              >
                <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                <span>Điền nhanh CCCD mẫu</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-[#141413]/80 mb-1.5">
                  Họ và tên Nhà đầu tư (*):
                </label>
                <input
                  type="text"
                  required
                  disabled={isFormLocked}
                  placeholder="Trần Thị Bình"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#B8844A] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-[#141413]/80 mb-1.5">
                  Loại giấy tờ định danh:
                </label>
                <select
                  value={docType}
                  disabled={isFormLocked}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#B8844A] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="National ID">Căn cước công dân (CCCD / CMND gắn chip)</option>
                  <option value="Passport">Hộ chiếu</option>
                  <option value="Driving Licence">Giấy phép lái xe (GPLX)</option>
                  <option value="Tax Certificate">Mã số thuế cá nhân</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#141413]/80 mb-1.5">
                  Số CCCD / Hộ chiếu (*):
                </label>
                <input
                  type="text"
                  required
                  disabled={isFormLocked}
                  placeholder="079099005678"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 font-mono text-sm text-[#141413] tabular-nums focus:border-[#B8844A] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#141413]/80 mb-1.5">Địa chỉ Email:</label>
                <input
                  type="email"
                  required
                  disabled={isFormLocked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#B8844A] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block font-medium text-[#141413]/80 mb-1.5">Số điện thoại:</label>
                <input
                  type="text"
                  disabled={isFormLocked}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 text-sm text-[#141413] tabular-nums focus:border-[#B8844A] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Chụp & Tải lên 2 mặt CCCD */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B2A24]/8 pb-2.5">
              <div>
                <h3 className="font-semibold text-sm text-[#141413]">
                  2. Chụp &amp; Đính kèm 2 Mặt Căn cước công dân (CCCD) (*)
                </h3>
                <p className="text-xs text-[#141413]/55 mt-0.5">
                  Vui lòng chụp rõ nét cả mặt trước (thông tin chân dung) và mặt sau (chip điện tử &amp; mã MRZ). Tệp ảnh được mã hóa AES-256-GCM.
                </p>
              </div>
              <StatusBadge variant="info">Chuẩn định danh eKYC 2 Mặt</StatusBadge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VÙNG 1: MẶT TRƯỚC CCCD */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-[#F4F1EA]/65 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1B2A24] text-white font-semibold flex items-center justify-center text-xs">
                      1
                    </span>
                    <span className="font-semibold text-[#141413] text-sm">Ảnh Mặt Trước CCCD (*)</span>
                  </div>
                  {frontPreview && (
                    <StatusBadge variant="success" dot>
                      Đã có ảnh
                    </StatusBadge>
                  )}
                </div>

                {frontPreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#1B2A24]/14 bg-white flex flex-col items-center justify-center h-48">
                    <img
                      src={frontPreview}
                      alt="Ảnh mặt trước CCCD"
                      className="max-h-full max-w-full object-contain p-1.5"
                    />
                    <div className="absolute inset-0 bg-[#141413]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePreviewSide("front")}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#141413] text-xs font-medium flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-4 h-4" strokeWidth={1.75} />
                        Phóng to
                      </button>
                      {!isFormLocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setFrontFile(null);
                            setFrontPreview(null);
                            setFrontCid("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 text-xs font-medium flex items-center gap-1.5 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          Xóa &amp; chụp lại
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded-xl border border-dashed border-[#1B2A24]/20 bg-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <ImageIcon className="w-10 h-10 text-[#141413]/45" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-[#141413] text-sm">Chưa có ảnh mặt trước</p>
                      <p className="text-xs text-[#141413]/55">Mặt trước có ảnh chân dung và số CCCD</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div className="text-xs text-[#141413]/55 truncate font-mono">
                    {frontDocName ? `Tệp: ${frontDocName}` : "Chưa chọn tệp"}
                    {frontCid && <span className="block text-[#1B2A24]">Vault CID: {frontCid}</span>}
                  </div>

                  {!isFormLocked && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => frontCameraRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#1B2A24]/14 text-[#141413]/80 hover:bg-[#F4F1EA] font-medium shadow-xs transition-colors"
                      >
                        <Camera className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />
                        <span>Chụp ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B2A24] text-white hover:bg-[#14201B] font-medium shadow-xs transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" strokeWidth={1.75} />
                        <span>Tải ảnh lên</span>
                      </button>

                      <input
                        ref={frontCameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0], "front");
                          }
                        }}
                      />
                      <input
                        ref={frontInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0], "front");
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* VÙNG 2: MẶT SAU CCCD */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-[#F4F1EA]/65 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1B2A24] text-white font-semibold flex items-center justify-center text-xs">
                      2
                    </span>
                    <span className="font-semibold text-[#141413] text-sm">Ảnh Mặt Sau CCCD (*)</span>
                  </div>
                  {backPreview && (
                    <StatusBadge variant="success" dot>
                      Đã có ảnh
                    </StatusBadge>
                  )}
                </div>

                {backPreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#1B2A24]/14 bg-white flex flex-col items-center justify-center h-48">
                    <img
                      src={backPreview}
                      alt="Ảnh mặt sau CCCD"
                      className="max-h-full max-w-full object-contain p-1.5"
                    />
                    <div className="absolute inset-0 bg-[#141413]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePreviewSide("back")}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#141413] text-xs font-medium flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-4 h-4" strokeWidth={1.75} />
                        Phóng to
                      </button>
                      {!isFormLocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setBackFile(null);
                            setBackPreview(null);
                            setBackCid("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 text-xs font-medium flex items-center gap-1.5 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          Xóa &amp; chụp lại
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded-xl border border-dashed border-[#1B2A24]/20 bg-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <ImageIcon className="w-10 h-10 text-[#141413]/45" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-[#141413] text-sm">Chưa có ảnh mặt sau</p>
                      <p className="text-xs text-[#141413]/55">Mặt sau có chip điện tử, vân tay và dải mã vạch MRZ</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div className="text-xs text-[#141413]/55 truncate font-mono">
                    {backDocName ? `Tệp: ${backDocName}` : "Chưa chọn tệp"}
                    {backCid && <span className="block text-[#B8844A]">Vault CID: {backCid}</span>}
                  </div>

                  {!isFormLocked && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => backCameraRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#1B2A24]/14 text-[#141413]/80 hover:bg-[#F4F1EA] font-medium shadow-xs transition-colors"
                      >
                        <Camera className="w-4 h-4 text-[#B8844A]" strokeWidth={1.75} />
                        <span>Chụp ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => backInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B2A24] text-white hover:bg-[#14201B] font-medium shadow-xs transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" strokeWidth={1.75} />
                        <span>Tải ảnh lên</span>
                      </button>

                      <input
                        ref={backCameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0], "back");
                          }
                        }}
                      />
                      <input
                        ref={backInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0], "back");
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú thêm */}
          <div>
            <label className="block font-medium text-[#141413]/80 mb-1.5">
              Ghi chú bổ sung (tuỳ chọn):
            </label>
            <input
              type="text"
              disabled={isFormLocked}
              placeholder="VD: Cập nhật CCCD gắn chip mới nhất cấp tháng 6/2022..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[#1B2A24]/14 bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#B8844A] focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {isApproved && (
            <div className="p-4 bg-[#E9F4EF] border border-[#1E6B52]/22 rounded-xl flex items-start gap-3 text-xs text-[#1E6B52]">
              <CheckCircle2 className="w-5 h-5 text-[#1E6B52] shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="space-y-1.5">
                <p className="font-semibold text-sm text-[#1B2A24]">
                  Tài khoản {account} đã được phê duyệt KYC 2 mặt và nằm trong Whitelist của IdentityRegistry!
                </p>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  Theo quy tắc nghiệp vụ <strong>quy định KYC</strong>, tài khoản đã ở trạng thái{" "}
                  <code className="font-mono">Approved</code> không cần và không được phép nộp lại hồ sơ KYC trừ khi bị Cán bộ Tuân thủ thu
                  hồi trước.
                </p>
                {txHash && (
                  <div className="flex items-center gap-1.5 text-xs pt-0.5">
                    <span className="font-medium">TxHash Whitelist On-chain:</span>
                    <CopyAddress value={txHash} prefixLen={12} suffixLen={8} textClassName="text-xs text-[#1E6B52]" />
                  </div>
                )}
                {!forceEditMode && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForceEditMode(true);
                        if (!frontPreview) handleUseMockBothSides();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#1E6B52] border border-[#1E6B52]/22 font-medium text-xs hover:bg-emerald-100/60 transition-colors shadow-xs"
                    >
                      <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                      <span>Mở lại biểu mẫu để cập nhật hoặc chụp lại ảnh CCCD 2 mặt</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(!isApproved || forceEditMode) && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A24] hover:bg-[#14201B] px-5 py-2.5 font-medium text-white shadow-xs transition-colors disabled:opacity-50 text-sm"
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                <span>
                  {isSubmitting
                    ? "Đang mã hóa & gửi hồ sơ..."
                    : forceEditMode
                    ? "Cập nhật nộp lại CCCD 2 mặt (Mô phỏng Lab)"
                    : kycStatus === "pending"
                    ? "Cập nhật lại Hồ sơ KYC 2 mặt"
                    : "Nộp Hồ sơ Xác minh KYC 2 Mặt"}
                </span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
