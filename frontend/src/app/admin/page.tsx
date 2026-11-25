"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useWeb3 } from "@/context/Web3Context";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatEventTypeLabel,
  formatKycStatusLabel,
  formatComplianceActionLabel,
} from "@/i18n/labels";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { IpfsWordViewerModal } from "@/components/IpfsWordViewerModal";
import {
  Search,
  RefreshCw,
  Eye,
  Globe,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldAlert,
  PlusCircle,
  Lock,
  Unlock,
  ArrowUpDown,
  KeyRound,
  LayoutDashboard,
  Building2,
  Coins,
  Users,
  Activity,
  AlertTriangle,
  Repeat,
  ShieldCheck,
  FileText,
  Server,
  Database,
  HardDrive,
  Cpu,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Clock,
  Settings,
  ExternalLink,
  Info,
  Download,
  Image as ImageIcon,
  BarChart3,
  FileSpreadsheet,
  Layers,
  History,
  ListTodo,
  UserCheck,
  UserX,
  FileCheck,
} from "lucide-react";

const DOC_TYPE_PILLS: Array<{ label: string; bg: string }> = [
  { label: "National ID", bg: "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18" },
  { label: "Utility Bill", bg: "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20" },
  { label: "Tax Certificate", bg: "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20" },
  { label: "Business Licence", bg: "bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20" },
  { label: "Driving Licence", bg: "bg-[#EAE5DA]/85 text-[#141413]/80 ring-1 ring-inset ring-slate-500/20" },
];

const MONITORING_SERVICE_NAME_VI: Record<string, string> = {
  "Database Engine (Relational DB)": "Cơ sở dữ liệu (SQLite)",
  "IPFS / Pinata Document Storage": "Lưu trữ tài liệu IPFS / Pinata",
  "Smart Contracts Suite (Foundry)": "Bộ hợp đồng thông minh (Foundry)",
};

const MONITORING_DETAIL_KEY_MAP: Record<string, { vi: string; en: string }> = {
  endpoint: { vi: "RPC Endpoint", en: "RPC Endpoint" },
  chain_id: { vi: "Chain ID", en: "Chain ID" },
  block_number: { vi: "Block hiện tại", en: "Current Block" },
  gas_price_gwei: { vi: "Giá Gas (Gwei)", en: "Gas Price (Gwei)" },
  app_name: { vi: "Tên dịch vụ", en: "Service Name" },
  version: { vi: "Phiên bản", en: "Version" },
  lab_accounts_loaded: { vi: "Tài khoản Lab đã nạp", en: "Loaded Lab Accounts" },
  engine: { vi: "Hệ quản trị", en: "Engine" },
  users_count: { vi: "Tổng tài khoản", en: "Total Accounts" },
  real_estates_count: { vi: "Tổng bất động sản", en: "Total Real Estates" },
  audit_signs_count: { vi: "Bản ghi nhật ký ký số", en: "Audit Sign Records" },
  transfers_count: { vi: "Giao dịch đã đồng bộ", en: "Synced Transfers" },
  mode: { vi: "Chế độ lưu trữ", en: "Storage Mode" },
  cached_documents: { vi: "Tài liệu đã lưu đệm", en: "Cached Documents" },
  storage_dir: { vi: "Thư mục lưu trữ", en: "Storage Directory" },
  total_contracts: { vi: "Tổng số hợp đồng", en: "Total Contracts" },
  online_contracts: { vi: "Hợp đồng đang hoạt động", en: "Online Contracts" },
};

function formatMonitoringEndpoint(endpoint: string, lang: string): string {
  if (lang === "en") return endpoint;
  if (endpoint === "Local IPFS Gateway (/ipfs/*)") {
    return "Cổng IPFS cục bộ (/ipfs/*)";
  }
  return endpoint.replace(/(\d+)\s+contracts/gi, "$1 hợp đồng");
}

type AdminSubTab =
  | "compliance"
  | "compliance-dashboard"
  | "compliance-queue"
  | "compliance-history"
  | "compliance-freeze"
  | "compliance-freeze-history"
  | "compliance-audit"
  | "issuer"
  | "issuer-dashboard"
  | "issuer-register"
  | "issuer-sales"
  | "issuer-docs"
  | "issuer-reports"
  | "dashboard"
  | "pause"
  | "forced-transfer"
  | "roles"
  | "role-management"
  | "audit"
  | "monitoring"
  | "settings";

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTabParam = searchParams?.get("tab") || "";

  const {
    account,
    currentUser,
    labAccounts,
    apiFetch,
    refreshBalances,
    apiUrl,
  } = useWeb3();
  const { lang } = useLanguage();
  const [browserWallet, setBrowserWallet] = useState<string | null>(null);
  const role = currentUser?.role_label || "investor";
  const backendBaseUrl = (apiUrl || "http://127.0.0.1:8000/api").replace(/\/api\/?$/, "");

  const connectMetaMaskWallet = async () => {
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
    if (!eth) {
      showToast("err", "Trình duyệt chưa cài đặt MetaMask. Đang sử dụng cơ chế ký phiên Session Lab Anvil.");
      return;
    }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        setBrowserWallet(accounts[0]);
        showToast("ok", `Đã kết nối ví MetaMask: ${accounts[0]}`);
      }
    } catch (err: any) {
      showToast("err", err.message || "Không thể kết nối ví MetaMask");
    }
  };

  // Chuẩn hóa tab theo vai trò đang đăng nhập (Ngăn truy cập trái phép qua URL)
  const resolveTabForRole = useCallback((r: string, param: string): AdminSubTab => {
    if (r === "issuer") {
      if (
        [
          "issuer-dashboard",
          "issuer-register",
          "issuer-sales",
          "issuer-docs",
          "issuer-reports",
        ].includes(param)
      ) {
        return param as AdminSubTab;
      }
      return "issuer-dashboard";
    }
    if (r === "compliance") {
      if (
        [
          "compliance-dashboard",
          "compliance-queue",
          "compliance-history",
          "compliance-freeze",
          "compliance-freeze-history",
          "compliance-audit",
        ].includes(param)
      ) {
        return param as AdminSubTab;
      }
      return "compliance-dashboard";
    }
    if (r === "admin") {
      if (
        [
          "dashboard",
          "pause",
          "forced-transfer",
          "roles",
          "role-management",
          "audit",
          "monitoring",
          "settings",
        ].includes(param)
      ) {
        return param as AdminSubTab;
      }
      return "dashboard";
    }
    return "compliance";
  }, []);

  const [activeTab, setActiveTab] = useState<AdminSubTab>(() =>
    resolveTabForRole(role, rawTabParam)
  );

  // Dữ liệu chung
  const [kycList, setKycList] = useState<any[]>([]);
  const [estates, setEstates] = useState<any[]>([]);
  const [auditSigns, setAuditSigns] = useState<any[]>([]);
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [rolesMatrix, setRolesMatrix] = useState<{
    records: any[];
    admin_counts: Record<string, number>;
  }>({ records: [], admin_counts: {} });
  const [monitoringData, setMonitoringData] = useState<any | null>(null);

  // Trạng thái tải & thông báo Toast
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ==========================================
  // STATE DÀNH CHO COMPLIANCE & ISSUER (GIỮ NGUYÊN 100%)
  // ==========================================
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedKycModal, setSelectedKycModal] = useState<any | null>(null);
  const [showKycDetailModal, setShowKycDetailModal] = useState<boolean>(false);
  const [kycDetailHistory, setKycDetailHistory] = useState<any[]>([]);
  const [loadingKycHistory, setLoadingKycHistory] = useState<boolean>(false);
  const [previewEstateDocId, setPreviewEstateDocId] = useState<number | null>(null);
  const [userRoleDrafts, setUserRoleDrafts] = useState<Record<number, string>>({});
  const [rbacSearch, setRbacSearch] = useState<string>("");
  const [rbacRoleFilter, setRbacRoleFilter] = useState<string>("all");
  const [rbacConfirmTarget, setRbacConfirmTarget] = useState<{
    user: any;
    newRole: string;
    reason: string;
    syncOnchain: boolean;
  } | null>(null);

  const [estName, setEstName] = useState<string>("Biệt thự Vinhomes Riverside The Harmony");
  const [estTokenName, setEstTokenName] = useState<string>("Vinhomes Riverside Harmony Token");
  const [estSymbol, setEstSymbol] = useState<string>("VHRV05");
  const [estAddress, setEstAddress] = useState<string>(
    "Khu Nguyệt Quế, Vinhomes Riverside, Long Biên, Hà Nội"
  );
  const [estArea, setEstArea] = useState<string>("360");
  const [estKind, setEstKind] = useState<string>("apartment");
  const [estBuildYear, setEstBuildYear] = useState<string>("2024");
  const [estValuation, setEstValuation] = useState<string>("1800000");
  const [estShares, setEstShares] = useState<string>("18000");
  const [estDesc, setEstDesc] = useState<string>(
    "Biệt thự đơn lập góc hướng hồ trung tâm, đầy đủ hồ sơ pháp lý giả lập trên IPFS Pinata."
  );
  const [estDocCid, setEstDocCid] = useState<string>("");
  const [estDocHash, setEstDocHash] = useState<string>("");
  const [estDocFileName, setEstDocFileName] = useState<string>("");
  const [estDocFileSize, setEstDocFileSize] = useState<number>(0);
  const [estDocType, setEstDocType] = useState<string>(
    "Giấy chứng nhận QSDĐ & Hồ sơ Pháp lý (Legal Deed)"
  );
  const [estUploadStatus, setEstUploadStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle"
  );
  const [estCoverPreview, setEstCoverPreview] = useState<string>("");
  const [estGalleryPreviews, setEstGalleryPreviews] = useState<string[]>([]);
  // Mặc định tách quy trình đăng ký (UC-04) và Token hóa (UC-05) theo đúng Phần 3.2
  const [autoTokenize, setAutoTokenize] = useState<boolean>(false);
  const [issuerPreviewModalOpen, setIssuerPreviewModalOpen] = useState<boolean>(false);
  const [registeredPendingAsset, setRegisteredPendingAsset] = useState<any | null>(null);
  const [tokenizeConfirmAsset, setTokenizeConfirmAsset] = useState<any | null>(null);
  const [lastTokenizeReceipt, setLastTokenizeReceipt] = useState<any | null>(null);

  // Dữ liệu tổng hợp cho Issuer Dashboard, Quản lý Mở bán, Hồ sơ Pháp lý, Báo cáo
  const [issuerOverview, setIssuerOverview] = useState<any | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");
  const [docEstateFilter, setDocEstateFilter] = useState<string>("ALL");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("ALL");

  // ==========================================
  // STATE DÀNH CHO COMPLIANCE PORTAL (PHẦN II - IX)
  // ==========================================
  const [complianceOverview, setComplianceOverview] = useState<any | null>(null);
  const [kycSearch, setKycSearch] = useState<string>("");
  const [kycStatusFilter, setKycStatusFilter] = useState<string>("all");
  const [kycDocFilter, setKycDocFilter] = useState<string>("all");
  const [kycTimeFilter, setKycTimeFilter] = useState<string>("all");
  const [kycSortOrder, setKycSortOrder] = useState<"desc" | "asc">("desc");
  const [kycPage, setKycPage] = useState<number>(1);
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    cid: string;
    docName: string;
    previewUrl?: string;
  } | null>(null);

  // 5 Tiêu chuẩn Thẩm định (Khu C)
  const [checklist, setChecklist] = useState<{
    nameMatch: boolean;
    docValid: boolean;
    photoClear: boolean;
    walletMatch: boolean;
    notBlacklisted: boolean;
  }>({
    nameMatch: false,
    docValid: false,
    photoClear: false,
    walletMatch: false,
    notBlacklisted: false,
  });
  const [complianceReviewNotes, setComplianceReviewNotes] = useState<string>("");

  // Modals xác nhận quyết định (Khu D)
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("Ảnh giấy tờ không rõ");
  const [rejectNotes, setRejectNotes] = useState<string>("");

  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);
  const [revokeReason, setRevokeReason] = useState<string>("Thu hồi theo quyết định rà soát định kỳ bộ phận tuân thủ");
  const [revokeNotes, setRevokeNotes] = useState<string>("");

  // Freeze / Unfreeze State (Phần V & VII)
  const [freezeModalData, setFreezeModalData] = useState<{
    account: string;
    name: string;
    isFrozen: boolean;
    action: "freeze" | "unfreeze";
    kycStatus?: string;
    tokenBalance?: number;
    lastFrozenAt?: string;
    lastFreezeReason?: string;
    lastFreezeCaseCode?: string;
  } | null>(null);
  const [freezeReason, setFreezeReason] = useState<string>("Tài khoản có dấu hiệu vi phạm quy chế giao dịch");
  const [freezeCaseCode, setFreezeCaseCode] = useState<string>("");
  const [freezeNotes, setFreezeNotes] = useState<string>("");
  const [freezeAccountSearch, setFreezeAccountSearch] = useState<string>("");
  const [freezeKycFilter, setFreezeKycFilter] = useState<string>("all");
  const [freezeStatusFilter, setFreezeStatusFilter] = useState<string>("all");
  const [freezePage, setFreezePage] = useState<number>(1);

  // History & Audit State (Phần VI & VIII)
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyActionFilter, setHistoryActionFilter] = useState<string>("all");
  const [selectedKycHistoryModal, setSelectedKycHistoryModal] = useState<any | null>(null);
  const [freezeHistSearch, setFreezeHistSearch] = useState<string>("");
  const [freezeHistFilter, setFreezeHistFilter] = useState<string>("all");
  const [freezeHistTimeFilter, setFreezeHistTimeFilter] = useState<string>("all");
  const [selectedFreezeHistoryModal, setSelectedFreezeHistoryModal] = useState<any | null>(null);
  const [compAuditSearch, setCompAuditSearch] = useState<string>("");
  const [compAuditActionFilter, setCompAuditActionFilter] = useState<string>("all");
  const [compAuditResultFilter, setCompAuditResultFilter] = useState<string>("all");
  const [localComplianceLogs, setLocalComplianceLogs] = useState<any[]>([]);

  const [freezeTargetAddr, setFreezeTargetAddr] = useState<string>(
    "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
  );

  // ==========================================
  // STATE NÂNG CẤP CHO ADMIN: PAUSE, FORCED TRANSFER, ROLES, AUDIT, MONITORING
  // ==========================================
  const [selectedTokenAddr, setSelectedTokenAddr] = useState<string>("");

  // 1. Emergency Pause Modal & Result State
  const [pauseReason, setPauseReason] = useState<string>(
    "Bảo trì định kỳ hoặc xử lý cảnh báo bảo mật khẩn cấp trên hợp đồng AssetToken"
  );
  const [pauseConfirmModal, setPauseConfirmModal] = useState<{
    open: boolean;
    tokenAddress: string;
    assetName: string;
    symbol: string;
    targetPaused: boolean;
  } | null>(null);
  const [lastPauseTxResult, setLastPauseTxResult] = useState<{
    tx_hash: string;
    token: string;
    asset_name: string;
    symbol: string;
    is_paused: boolean;
    block_number: number;
    actor: string;
    timestamp: string;
  } | null>(null);

  // 2. Forced Transfer State + Live Wallet Inspector + Confirmation Modal
  const [forcedFromAddr, setForcedFromAddr] = useState<string>(
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906"
  );
  const [forcedToAddr, setForcedToAddr] = useState<string>(
    "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
  );
  const [forcedAmount, setForcedAmount] = useState<string>("10");
  const [forcedReason, setForcedReason] = useState<string>(
    "Thu hồi và khôi phục tài sản theo quyết định xử lý tranh chấp / mất khóa cá nhân của nhà đầu tư"
  );
  const [forcedCaseCode, setForcedCaseCode] = useState<string>("CASE-RWA-2026-01");
  const [fromWalletInfo, setFromWalletInfo] = useState<any | null>(null);
  const [toWalletInfo, setToWalletInfo] = useState<any | null>(null);
  const [inspectingWallets, setInspectingWallets] = useState<boolean>(false);
  const [forcedConfirmModalOpen, setForcedConfirmModalOpen] = useState<boolean>(false);
  const [lastForcedTxResult, setLastForcedTxResult] = useState<any | null>(null);

  // 3. Grant / Revoke Roles State + Search/Filter + Safety Modal
  const [roleContractName, setRoleContractName] = useState<string>("IdentityRegistry");
  const [roleName, setRoleName] = useState<string>("COMPLIANCE_ROLE");
  const [roleTargetAccount, setRoleTargetAccount] = useState<string>(
    "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"
  );
  const [roleReason, setRoleReason] = useState<string>(
    "Cập nhật phân quyền vận hành Smart Contract theo quyết định quản trị"
  );
  const [roleSearchQuery, setRoleSearchQuery] = useState<string>("");
  const [roleFilterName, setRoleFilterName] = useState<string>("ALL");
  const [roleFilterContract, setRoleFilterContract] = useState<string>("ALL");
  const [roleFilterStatus, setRoleFilterStatus] = useState<string>("ALL");
  const [roleConfirmModal, setRoleConfirmModal] = useState<{
    open: boolean;
    contractName: string;
    tokenAddress?: string;
    roleName: string;
    accountAddress: string;
    grant: boolean;
  } | null>(null);

  // 4. Audit Logs State (Search, Filters, Pagination, Detail Modal)
  const [auditSearch, setAuditSearch] = useState<string>("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("ALL");
  const [auditTimeFilter, setAuditTimeFilter] = useState<string>("ALL");
  const [auditPage, setAuditPage] = useState<number>(1);
  const AUDIT_PAGE_SIZE = 10;
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<any | null>(null);

  // Khóa chặt Tab theo đúng Role đang đăng nhập
  useEffect(() => {
    setActiveTab(resolveTabForRole(role, rawTabParam));
  }, [role, rawTabParam, resolveTabForRole]);

  const switchTab = (tab: AdminSubTab) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  const showToast = (type: "ok" | "err", text: string) => {
    setFeedback({ type, text });
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ==========================================
  // DATA LOADING (TỪ API, DATABASE & SMART CONTRACT THẬT)
  // ==========================================
  const loadAdminData = useCallback(async () => {
    if (role === "investor") return;
    setLoadingData(true);
    setApiError(null);
    try {
      const basePromises: Promise<any>[] = [
        apiFetch("/kyc"),
        apiFetch("/assets"),
        apiFetch("/audit-signs"),
      ];

      if (role === "admin") {
        basePromises.push(
          apiFetch("/admin/overview").catch(() => null),
          apiFetch(
            `/admin/roles-matrix${selectedTokenAddr ? `?token_address=${selectedTokenAddr}` : ""}`
          ).catch(() => null),
          apiFetch("/admin/system-monitoring").catch(() => null)
        );
      } else if (role === "issuer") {
        basePromises.push(apiFetch("/assets/issuer/overview").catch(() => null));
      } else if (role === "compliance") {
        basePromises.push(apiFetch("/kyc/compliance/overview").catch(() => null));
      }

      const results = await Promise.all(basePromises);
      const [kycs, ests, audits, ovwOrIssuer, rMatrix, mon] = results;

      setKycList(Array.isArray(kycs) ? kycs : []);
      setEstates(Array.isArray(ests) ? ests : []);
      setAuditSigns(Array.isArray(audits) ? audits : []);

      const firstTokenized = (ests || []).find((e: any) => e.token_address);
      if (firstTokenized && !selectedTokenAddr) {
        setSelectedTokenAddr(firstTokenized.token_address);
      }

      if (role === "admin") {
        if (ovwOrIssuer) setOverviewData(ovwOrIssuer);
        if (rMatrix && Array.isArray(rMatrix.records)) {
          setRolesMatrix(rMatrix);
        }
        if (mon) setMonitoringData(mon);
      } else if (role === "issuer" && ovwOrIssuer) {
        setIssuerOverview(ovwOrIssuer);
      } else if (role === "compliance" && ovwOrIssuer) {
        setComplianceOverview(ovwOrIssuer);
      }
    } catch (err: any) {
      console.error("Load admin data error:", err);
      setApiError(err.message || "Không thể tải dữ liệu từ Backend API");
    } finally {
      setLoadingData(false);
    }
  }, [role, apiFetch, selectedTokenAddr]);

  useEffect(() => {
    loadAdminData();
  }, [currentUser?.address, role, loadAdminData]);

  // Tự động tra cứu thông tin ví From và To khi Admin ở tab forced-transfer
  const inspectForcedTransferWallets = useCallback(async () => {
    if (role !== "admin" || !selectedTokenAddr) return;
    setInspectingWallets(true);
    try {
      const [fromInfo, toInfo] = await Promise.all([
        forcedFromAddr.trim()
          ? apiFetch(
              `/admin/wallet-inspect/${encodeURIComponent(
                forcedFromAddr.trim()
              )}?token_address=${encodeURIComponent(selectedTokenAddr)}`
            ).catch(() => ({ is_valid: false, address: forcedFromAddr }))
          : Promise.resolve(null),
        forcedToAddr.trim()
          ? apiFetch(
              `/admin/wallet-inspect/${encodeURIComponent(
                forcedToAddr.trim()
              )}?token_address=${encodeURIComponent(selectedTokenAddr)}`
            ).catch(() => ({ is_valid: false, address: forcedToAddr }))
          : Promise.resolve(null),
      ]);
      setFromWalletInfo(fromInfo);
      setToWalletInfo(toInfo);
    } finally {
      setInspectingWallets(false);
    }
  }, [role, selectedTokenAddr, forcedFromAddr, forcedToAddr, apiFetch]);

  useEffect(() => {
    if (role === "admin" && (activeTab === "forced-transfer" || activeTab === "dashboard")) {
      const timer = setTimeout(() => {
        inspectForcedTransferWallets();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [role, activeTab, selectedTokenAddr, forcedFromAddr, forcedToAddr, inspectForcedTransferWallets]);

  // =========================================================================
  // CHẶN TRUY CẬP KHI CHƯA ĐĂNG NHẬP (401 UNAUTHENTICATED)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-8 max-w-2xl mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-[#f59f00]/10 text-[#f59f00] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <span className="whitespace-nowrap inline-block bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase">
          401 · YÊU CẦU ĐĂNG NHẬP
        </span>
        <h1 className="text-lg font-bold text-[#141413]">
          Vui lòng đăng nhập để truy cập Bảng điều khiển Quản trị / Phát hành / Tuân thủ
        </h1>
        <p className="text-xs text-[#141413]/55 leading-relaxed">
          Khu vực này yêu cầu tài khoản đã đăng nhập có vai trò <code>ADMIN</code>, <code>ISSUER</code> hoặc{" "}
          <code>COMPLIANCE</code>.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="px-4 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg text-xs font-semibold transition"
          >
            Đi tới trang Đăng nhập / Đăng ký →
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHẶN TRUY CẬP ĐỐI VỚI NHÀ ĐẦU TƯ (INVESTOR KHÔNG ĐƯỢC THẤY KYC REVIEW QUEUE / ADMIN)
  // =========================================================================
  if (role === "investor") {
    return (
      <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-8 max-w-2xl mx-auto text-center space-y-4 my-8">
        <div className="w-12 h-12 rounded-full bg-[#d63939]/10 text-[#d63939] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <span className="whitespace-nowrap inline-block bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase">
          403 · ROLE-BASED ACCESS CONTROL (RBAC)
        </span>
        <h1 className="text-lg font-bold text-[#141413]">
          Tài khoản Nhà đầu tư (INVESTOR) không có quyền truy cập khu vực này
        </h1>
        <p className="text-xs text-[#141413]/55 leading-relaxed">
          Theo ma trận phân quyền hệ thống, các chức năng <strong>KYC Review Queue</strong>,{" "}
          <strong>Phát hành & Phát hành cổ phần BĐS</strong> và{" "}
          <strong>Quản trị Khẩn cấp</strong> chỉ hiển thị cho các tài khoản{" "}
          <code>COMPLIANCE_ROLE</code>, <code>ISSUER_ROLE</code> hoặc <code>DEFAULT_ADMIN_ROLE</code>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/assets"
            className="px-4 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg text-xs font-semibold transition"
          >
            Về Danh mục Bất động sản
          </Link>
          <Link
            href="/kyc"
            className="px-4 py-2 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413] text-xs font-semibold transition"
          >
            Xem Hồ sơ KYC Cá nhân
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // HANDLERS: COMPLIANCE (UC-03, UC-12)
  // ==========================================
  const handleOpenKycDetail = async (app: any, openDetailModal: boolean = true) => {
    setSelectedKycModal(app);
    setShowKycDetailModal(openDetailModal);
    const existingChecklist = app.payload_json?.checklist || {};
    setChecklist({
      nameMatch: !!existingChecklist.nameMatch,
      docValid: !!existingChecklist.docValid,
      photoClear: !!existingChecklist.photoClear,
      walletMatch: !!existingChecklist.walletMatch,
      notBlacklisted: !!existingChecklist.notBlacklisted,
    });
    setComplianceReviewNotes(
      app.payload_json?.review_notes || app.payload_json?.notes || ""
    );

    if (openDetailModal && app?.id) {
      setLoadingKycHistory(true);
      setKycDetailHistory([]);
      try {
        const detail = await apiFetch(`/kyc/${app.id}`);
        if (detail) {
          setSelectedKycModal((prev: any) =>
            prev && prev.id === app.id ? { ...prev, ...detail } : prev
          );
          setKycDetailHistory(Array.isArray(detail.history) ? detail.history : []);
        }
      } catch {
        setKycDetailHistory([]);
      } finally {
        setLoadingKycHistory(false);
      }
    }
  };

  const handleQuickUnderReview = async (app: any) => {
    if (!app || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/kyc/${app.id}/under-review`, {
        method: "POST",
        body: JSON.stringify({
          notes: app.payload_json?.review_notes || "Cán bộ Tuân thủ tiếp nhận thẩm định hồ sơ từ Hàng đợi KYC",
          checklist: app.payload_json?.checklist || checklist,
        }),
      });
      if (selectedKycModal && selectedKycModal.id === app.id) {
        setSelectedKycModal(res);
      }
      await loadAdminData();
      showToast(
        "ok",
        `[Thẩm định KYC] Hồ sơ #${app.id} (${app.payload_json?.full_name || app.investor_name}) đã chuyển sang trạng thái "Under Review"!`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAssignUserSystemRole = async (
    targetUser: any,
    newRole: string,
    customReason?: string,
    syncOnchain: boolean = true
  ) => {
    if (!targetUser || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/admin/users/assign-role", {
        method: "POST",
        body: JSON.stringify({
          user_id: targetUser.id,
          account_address: targetUser.address,
          new_role: newRole,
          sync_onchain: syncOnchain,
          reason:
            (customReason || "").trim() ||
            `Quản trị viên phân quyền tài khoản @${targetUser.username || targetUser.display_name} sang vai trò ${newRole.toUpperCase()}`,
        }),
      });
      setRbacConfirmTarget(null);
      setUserRoleDrafts((prev) => {
        const next = { ...prev };
        delete next[targetUser.id];
        return next;
      });
      await refreshBalances();
      await loadAdminData();
      const txCount = Array.isArray(res?.onchain_txs) ? res.onchain_txs.length : 0;
      const warnings = Array.isArray(res?.onchain_warnings) ? res.onchain_warnings : [];
      showToast(
        "ok",
        `[Phân quyền RBAC] Đã cập nhật vai trò của ${targetUser.display_name} (@${targetUser.username || targetUser.id}) sang ${newRole.toUpperCase()}!` +
          (txCount > 0 ? ` (Đã đồng bộ ${txCount} giao dịch quyền On-chain)` : "") +
          (warnings.length > 0 ? ` — Lưu ý đồng bộ: ${warnings.join("; ")}` : "")
      );
    } catch (err: any) {
      showToast("err", err.message || "Lỗi phân quyền tài khoản!");
    } finally {
      setBusy(false);
    }
  };

  const handleControlledDocumentAccess = async (
    kycApp: any,
    accessType: "VIEW" | "DOWNLOAD",
    docSide: "front" | "back" | "full",
    title: string,
    cid: string,
    docName: string,
    previewUrl?: string
  ) => {
    if (!kycApp || busy) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/kyc/${kycApp.id}/access-document`, {
        method: "POST",
        body: JSON.stringify({
          access_type: accessType,
          doc_side: docSide,
          purpose:
            accessType === "DOWNLOAD"
              ? `Tải xuống bản sao kiểm toán bảo mật (${docSide})`
              : `Xem trước tài liệu định danh bảo mật (${docSide})`,
        }),
      });
      // Cập nhật lịch sử truy cập tài liệu ngay trong modal đang mở
      if (selectedKycModal && selectedKycModal.id === kycApp.id && res?.access_entry) {
        const prevPayload = selectedKycModal.payload_json || {};
        const prevLogs = prevPayload.document_access_logs || [];
        setSelectedKycModal({
          ...selectedKycModal,
          payload_json: {
            ...prevPayload,
            document_access_logs: [res.access_entry, ...prevLogs],
          },
        });
      }
      await loadAdminData();

      if (accessType === "VIEW") {
        setPreviewDocModal({ title, cid, docName, previewUrl });
      } else {
        // Controlled Download (Tải xuống bản sao kiểm toán có đóng dấu bảo mật)
        const content = [
          "================================================================",
          "BẢN SAO KIỂM TOÁN TÀI LIỆU ĐỊNH DANH BẢO MẬT",
          "================================================================",
          `Mã Hồ Sơ KYC : #${kycApp.id}`,
          `Nhà Đầu Tư : ${kycApp.payload_json?.full_name || kycApp.investor_name}`,
          `Địa Chỉ Ví : ${kycApp.investor_address}`,
          `Loại Giấy Tờ : ${kycApp.payload_json?.document_type || "CCCD / National ID"}`,
          `Số Giấy Tờ (Mask) : ${maskId(kycApp.payload_json?.id_number || "079099005678")}`,
          `Phân Vùng Tài Liệu: ${docSide.toUpperCase()} (${docName})`,
          `Envelope Bảo Mật : ${res.envelope_cid_masked || "enc://protected"}`,
          `Cơ Chế Mã Hóa : ${res.encryption_mode || "AES-256-GCM"}`,
          `Người Tải Xuống : ${currentUser?.display_name} (${currentUser?.address})`,
          `Thời Gian Truy Cập: ${new Date().toISOString()}`,
          "================================================================",
          "CẢNH BÁO: TÀI LIỆU CHỈ PHỤC VỤ KIỂM TOÁN NỘI BỘ COMPLIANCE_ROLE.",
        ].join("\n");
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `KYC_${kycApp.id}_${docSide}_Controlled_Audit.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(
          "ok",
          `[Bảo mật KYC] Đã kiểm tra quyền COMPLIANCE_ROLE, ghi nhận nhật ký truy cập và tải xuống bản sao kiểm toán hồ sơ #${kycApp.id}.`
        );
      }
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedKycModal || busy) return;
    setBusy(true);
    setFeedback(null);
    const pendingId = `PENDING-APPROVE-${Date.now()}`;
    const targetName = selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name;
    const targetAddr = selectedKycModal.investor_address;
    const kycId = selectedKycModal.id;

    setLocalComplianceLogs((prev) => [
      {
        id: pendingId,
        operator_name: currentUser?.display_name || "Compliance Officer",
        signer_address: currentUser?.address || "",
        action_label: "Approve KYC",
        target_subject: `${targetName} (KYC #${kycId})`,
        target_address: targetAddr,
        reason: complianceReviewNotes || "Đạt 5/5 tiêu chuẩn thẩm định KYC",
        tx_hash: null,
        result_status: "Pending",
        signed_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiFetch(`/kyc/${kycId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          notes: complianceReviewNotes || "Đạt 5/5 tiêu chuẩn thẩm định KYC",
          checklist,
        }),
      });
      setLocalComplianceLogs((prev) => prev.filter((item) => item.id !== pendingId));
      setShowApproveModal(false);
      setShowKycDetailModal(false);
      setSelectedKycModal(null);
      await refreshBalances();
      await loadAdminData();
      showToast(
        "ok",
        `[Phê duyệt KYC] Đã duyệt hồ sơ #${kycId} và ghi địa chỉ ví ${res.investor_address} vào IdentityRegistry (TxHash: ${res.tx_hash})!`
      );
    } catch (err: any) {
      setLocalComplianceLogs((prev) =>
        prev.map((item) =>
          item.id === pendingId
            ? { ...item, result_status: "Failed", reason: `Lỗi thực thi: ${err.message}` }
            : item
        )
      );
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedKycModal || busy) return;
    setBusy(true);
    setFeedback(null);
    const pendingId = `PENDING-REJECT-${Date.now()}`;
    const targetName = selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name;
    const targetAddr = selectedKycModal.investor_address;
    const kycId = selectedKycModal.id;

    setLocalComplianceLogs((prev) => [
      {
        id: pendingId,
        operator_name: currentUser?.display_name || "Compliance Officer",
        signer_address: currentUser?.address || "",
        action_label: "Reject KYC",
        target_subject: `${targetName} (KYC #${kycId})`,
        target_address: targetAddr,
        reason: rejectReason,
        tx_hash: null,
        result_status: "Pending",
        signed_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiFetch(`/kyc/${kycId}/reject`, {
        method: "POST",
        body: JSON.stringify({
          reason: rejectReason,
          notes: rejectNotes,
          checklist,
        }),
      });
      setLocalComplianceLogs((prev) => prev.filter((item) => item.id !== pendingId));
      setShowRejectModal(false);
      setShowKycDetailModal(false);
      setSelectedKycModal(null);
      await loadAdminData();
      showToast(
        "ok",
        `[Từ chối KYC] Đã từ chối hồ sơ #${kycId} của ${res.investor_name} với lý do: "${rejectReason}".`
      );
    } catch (err: any) {
      setLocalComplianceLogs((prev) =>
        prev.map((item) =>
          item.id === pendingId
            ? { ...item, result_status: "Failed", reason: `Lỗi thực thi: ${err.message}` }
            : item
        )
      );
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!selectedKycModal || busy) return;
    setBusy(true);
    setFeedback(null);
    const pendingId = `PENDING-REVOKE-${Date.now()}`;
    const targetName = selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name;
    const targetAddr = selectedKycModal.investor_address;
    const kycId = selectedKycModal.id;

    setLocalComplianceLogs((prev) => [
      {
        id: pendingId,
        operator_name: currentUser?.display_name || "Compliance Officer",
        signer_address: currentUser?.address || "",
        action_label: "Revoke KYC",
        target_subject: `${targetName} (KYC #${kycId})`,
        target_address: targetAddr,
        reason: revokeReason,
        tx_hash: null,
        result_status: "Pending",
        signed_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiFetch(`/kyc/${kycId}/revoke`, {
        method: "POST",
        body: JSON.stringify({
          reason: revokeReason,
          notes: revokeNotes,
        }),
      });
      setLocalComplianceLogs((prev) => prev.filter((item) => item.id !== pendingId));
      setShowRevokeModal(false);
      setShowKycDetailModal(false);
      setSelectedKycModal(null);
      await refreshBalances();
      await loadAdminData();
      showToast(
        "ok",
        `[Thu hồi Whitelist] Đã thu hồi quyền KYC của ví ${res.investor_address} trên IdentityRegistry (TxHash: ${res.tx_hash})!`
      );
    } catch (err: any) {
      setLocalComplianceLogs((prev) =>
        prev.map((item) =>
          item.id === pendingId
            ? { ...item, result_status: "Failed", reason: `Lỗi thực thi: ${err.message}` }
            : item
        )
      );
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!selectedKycModal || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/kyc/${selectedKycModal.id}/under-review`, {
        method: "POST",
        body: JSON.stringify({
          notes: complianceReviewNotes,
          checklist,
        }),
      });
      setSelectedKycModal(res);
      await loadAdminData();
      showToast(
        "ok",
        `[Thẩm định KYC] Hồ sơ #${selectedKycModal.id} đã được chuyển sang trạng thái "Under Review".`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleOpenFreezeModal = (
    account: string,
    name: string,
    isFrozen: boolean,
    action: "freeze" | "unfreeze",
    extra?: {
      kycStatus?: string;
      tokenBalance?: number;
      lastFrozenAt?: string;
      lastFreezeReason?: string;
      lastFreezeCaseCode?: string;
    }
  ) => {
    const matchedAcct = (complianceOverview?.investor_accounts || []).find(
      (a: any) => (a.address || "").toLowerCase() === account.toLowerCase()
    );
    setFreezeModalData({
      account,
      name,
      isFrozen,
      action,
      kycStatus: extra?.kycStatus ?? matchedAcct?.kyc_status ?? "none",
      tokenBalance: extra?.tokenBalance ?? matchedAcct?.token_balance ?? 0,
      lastFrozenAt: extra?.lastFrozenAt ?? matchedAcct?.last_frozen_at ?? undefined,
      lastFreezeReason: extra?.lastFreezeReason ?? matchedAcct?.last_freeze_reason ?? undefined,
      lastFreezeCaseCode: extra?.lastFreezeCaseCode ?? matchedAcct?.last_freeze_case_code ?? undefined,
    });
    setFreezeReason(
      action === "freeze"
        ? "Tài khoản có dấu hiệu vi phạm quy chế giao dịch hoặc nghi vấn gian lận"
        : "Đã hoàn tất xác minh tuân thủ, mở khóa tài khoản"
    );
    setFreezeCaseCode(extra?.lastFreezeCaseCode ?? matchedAcct?.last_freeze_case_code ?? "");
    setFreezeNotes("");
  };

  const handleConfirmFreezeAction = async () => {
    if (!freezeModalData || busy) return;
    setBusy(true);
    setFeedback(null);
    const isFreezing = freezeModalData.action === "freeze";
    const pendingId = `PENDING-FREEZE-${Date.now()}`;

    setLocalComplianceLogs((prev) => [
      {
        id: pendingId,
        operator_name: currentUser?.display_name || "Compliance Officer",
        signer_address: currentUser?.address || "",
        action_label: isFreezing ? "Freeze Account" : "Unfreeze Account",
        target_subject: freezeModalData.name,
        target_address: freezeModalData.account,
        reason: freezeReason,
        tx_hash: null,
        result_status: "Pending",
        signed_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    try {
      const res = await apiFetch("/admin/freeze", {
        method: "POST",
        body: JSON.stringify({
          token_address: selectedTokenAddr || undefined,
          account_address: freezeModalData.account,
          frozen: isFreezing,
          reason: freezeReason,
          case_code: freezeCaseCode,
          notes: freezeNotes,
        }),
      });
      setLocalComplianceLogs((prev) => prev.filter((item) => item.id !== pendingId));
      setFreezeModalData(null);
      await refreshBalances();
      await loadAdminData();
      showToast(
        "ok",
        `[${isFreezing ? "Đóng băng" : "Mở khóa"} Tài khoản] Đã cập nhật trạng thái tài khoản thành công! (TxHash: ${res.tx_hash})`
      );
    } catch (err: any) {
      setLocalComplianceLogs((prev) =>
        prev.map((item) =>
          item.id === pendingId
            ? { ...item, result_status: "Failed", reason: `Lỗi thực thi: ${err.message}` }
            : item
        )
      );
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleKYCAction = async (kycId: number, action: "approve" | "reject" | "revoke") => {
    const target = kycList.find((k) => k.id === kycId);
    if (target) {
      handleOpenKycDetail(target);
      if (action === "approve") setShowApproveModal(true);
      else if (action === "reject") setShowRejectModal(true);
      else if (action === "revoke") setShowRevokeModal(true);
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/kyc/${kycId}/${action}`, { method: "POST" });
      await refreshBalances();
      await loadAdminData();
      if (selectedKycModal?.id === kycId) {
        setSelectedKycModal(res);
      }
      showToast(
        "ok",
        `[KYC ${action.toUpperCase()}] Đã cập nhật hồ sơ #${kycId} cho ví ${res.investor_address}! ` +
          (res.tx_hash ? `(TxHash on-chain: ${res.tx_hash})` : "(Cập nhật Off-chain)")
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFreezeAccount = async (frozen: boolean) => {
    const labUser = labAccounts.find((a) => a.address.toLowerCase() === freezeTargetAddr.toLowerCase());
    handleOpenFreezeModal(
      freezeTargetAddr,
      labUser?.display_name || "Nhà đầu tư",
      !!labUser?.is_frozen,
      frozen ? "freeze" : "unfreeze"
    );
  };

  // ==========================================
  // HANDLERS: ISSUER (UC-04, UC-05, PHẦN III, VI, VII, VIII)
  // ==========================================
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEstCoverPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setEstGalleryPreviews((prev) => [...prev.slice(0, 5), reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUploadEstatePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setEstUploadStatus("uploading");
    setEstDocFileName(file.name);
    setEstDocFileSize(file.size);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/assets/upload-document", {
        method: "POST",
        body: formData,
      });
      setEstDocCid(res.doc_cid || res.cid);
      setEstDocHash(res.doc_hash || res.sha256_hash);
      setEstUploadStatus("done");
      showToast(
        "ok",
        `Đã tải hồ sơ pháp lý (${res.file_name || file.name}) lên IPFS Pinata! docCID = ${res.doc_cid}, docHash = ${res.doc_hash}`
      );
    } catch (err: any) {
      setEstUploadStatus("error");
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  // Kiểm tra dữ liệu đăng ký BĐS (Phần 3.3)
  const symbolUpper = estSymbol.trim().toUpperCase();
  const duplicateEstate = symbolUpper
    ? estates.find((e) => (e.symbol || "").trim().toUpperCase() === symbolUpper)
    : undefined;
  const isDuplicateSymbol = Boolean(duplicateEstate);
  const isValidSymbolFormat = /^[A-Z0-9]{3,12}$/.test(symbolUpper);

  const suggestNextUniqueSymbol = (list: any[] = estates) => {
    const used = new Set(list.map((e) => (e.symbol || "").trim().toUpperCase()));
    let num = list.length + 1;
    while (used.has(`RWA${String(num).padStart(2, "0")}`)) {
      num += 1;
    }
    return `RWA${String(num).padStart(2, "0")}`;
  };

  const issuerFormValidation = {
    validName: estName.trim().length >= 3,
    validSymbolFormat: isValidSymbolFormat,
    notDuplicateSymbol: Boolean(symbolUpper) && !isDuplicateSymbol,
    validSymbol: isValidSymbolFormat && !isDuplicateSymbol,
    validAddress: estAddress.trim().length >= 5,
    validArea: Number(estArea) > 0,
    validBuildYear: Number(estBuildYear) >= 1900 && Number(estBuildYear) <= 2035,
    validValuation: Number(estValuation) > 0,
    validShares: Number(estShares) > 0 && Number.isInteger(Number(estShares)),
  };

  const canOpenIssuerPreview =
    issuerFormValidation.validName &&
    issuerFormValidation.validSymbol &&
    issuerFormValidation.validAddress &&
    issuerFormValidation.validArea &&
    issuerFormValidation.validBuildYear &&
    issuerFormValidation.validValuation &&
    issuerFormValidation.validShares;

  const handleOpenPreviewStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOpenIssuerPreview) {
      showToast(
        "err",
        isDuplicateSymbol
          ? `Mã Token (Symbol) '${symbolUpper}' đã được dùng bởi BĐS #${duplicateEstate?.id} (${duplicateEstate?.name})! Vui lòng chọn Symbol khác.`
          : !isValidSymbolFormat
          ? `Mã Token (Symbol) '${symbolUpper}' sai định dạng: phải gồm 3–12 ký tự chữ cái A–Z không dấu và số 0–9 (không dấu cách, không ký tự đặc biệt).`
          : "Vui lòng kiểm tra lại các trường thông tin bắt buộc trước khi xem trước."
      );
      return;
    }
    setIssuerPreviewModalOpen(true);
  };

  const handleConfirmRegisterEstate = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/assets", {
        method: "POST",
        body: JSON.stringify({
          name: estName.trim(),
          symbol: symbolUpper,
          address_text: estAddress.trim(),
          area_m2: Number(estArea),
          property_kind: estKind,
          build_year: Number(estBuildYear),
          description: estDesc.trim(),
          valuation: Number(estValuation),
          total_shares: Number(estShares),
          doc_cid: estDocCid || undefined,
          doc_hash: estDocHash || undefined,
          doc_name: estDocFileName || `Ho_so_Phap_ly_${symbolUpper}.docx`,
          doc_type: estDocType,
          doc_size_bytes: estDocFileSize || undefined,
          auto_tokenize: false,
        }),
      });
      setIssuerPreviewModalOpen(false);
      setRegisteredPendingAsset(res);
      // Tự động đổi sang mã Symbol mới chưa dùng & reset file IPFS cũ để không báo trùng ngay sau khi tạo
      setEstSymbol(suggestNextUniqueSymbol([...estates, res]));
      setEstDocCid("");
      setEstDocHash("");
      setEstDocFileName("");
      setEstDocFileSize(0);
      setEstUploadStatus("idle");
      await loadAdminData();
      showToast(
        "ok",
        `[Bước 5 Hoàn tất] Đã đăng ký hồ sơ bất động sản "${res.name} (${res.symbol})" ở trạng thái Ready! Bạn có thể bấm 'Xác nhận Token hóa' ngay bên dưới.`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleTokenizeExisting = async (id: number) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/assets/${id}/tokenize`, { method: "POST" });
      setTokenizeConfirmAsset(null);
      setRegisteredPendingAsset(null);
      setLastTokenizeReceipt({
        estate_id: res.id,
        name: res.name,
        symbol: res.symbol,
        token_address: res.token_address,
        tx_hash: res.tx_hash,
        total_shares: res.total_shares,
        valuation: res.valuation,
        timestamp: new Date().toISOString(),
      });
      await loadAdminData();
      showToast(
        "ok",
        `[Bước 7 Hoàn tất Tokenized] Hợp đồng AssetToken (${res.symbol}) đã triển khai thành công tại ${res.token_address}! (TxHash: ${res.tx_hash || "Confirmed"})`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyIssuerDocIntegrity = async (estateId: number) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/assets/${estateId}/verify-ipfs`);
      showToast(
        res.integrity_verified ? "ok" : "err",
        res.integrity_verified
          ? `[Kiểm chứng IPFS #${estateId} (${res.symbol}) Thành công] Mã băm Keccak-256 (${res.recomputed_file_hash.slice(
              0,
              18
            )}...) khớp 100% giữa tệp IPFS, Database và Smart Contract!`
          : `[CẢNH BÁO SAI LỆCH HASH] Hồ sơ pháp lý của BĐS #${estateId} không khớp với mã băm trên chuỗi!`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  // Xuất báo cáo phát hành ra file CSV thực tế (Phần VIII)
  const handleExportIssuerReportCsv = () => {
    const rows = issuerOverview?.estates || estates;
    const headers = [
      "ID",
      "Ten_Bat_Dong_San",
      "Symbol",
      "Loai_Hinh",
      "Dinh_Gia_mUSDC",
      "Tong_Co_Phan_Phat_Hanh",
      "Trang_Thai_Token",
      "Dia_Chi_Smart_Contract",
      "Trang_Thai_Mo_Ban",
      "Gia_Ban_So_Cap_mUSDC",
      "Co_Phan_Chao_Ban",
      "Co_Phan_Da_Ban",
      "Co_Phan_Con_Lai",
      "Tong_Tien_Huy_Dong_mUSDC",
      "IPFS_CID",
    ];
    const csvLines = [
      headers.join(","),
      ...rows.map((e: any) => {
        const s = e.primary_sale || {};
        return [
          e.id,
          `"${(e.name || "").replace(/"/g, '""')}"`,
          e.symbol,
          e.property_kind,
          e.valuation,
          e.total_shares,
          e.token_address ? "Tokenized" : "Ready",
          e.token_address || "Chua_Tokenize",
          s.is_open ? "Sale_Open" : "Sale_Closed",
          s.price_per_share || 0,
          s.total_amount || 0,
          s.sold_amount || 0,
          s.remaining_amount || 0,
          s.raised_usdc || 0,
          e.doc_cid || "",
        ].join(",");
      }),
    ];
    const csvContent = "\uFEFF" + csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_Cao_Phat_Hanh_RWA_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("ok", "Đã xuất file Báo cáo Phát hành (.CSV chuẩn UTF-8 Excel) thành công!");
  };

  // ==========================================
  // HANDLERS: ADMIN (UC-13 PAUSE, FORCED TRANSFER, ROLES)
  // ==========================================
  const openPauseConfirmation = (tokenAddr: string, targetPaused: boolean) => {
    const est =
      (overviewData?.assets_detail || estates).find(
        (e: any) => (e.token_address || "").toLowerCase() === tokenAddr.toLowerCase()
      ) || {};
    setPauseConfirmModal({
      open: true,
      tokenAddress: tokenAddr,
      assetName: est.name || "AssetToken RWA",
      symbol: est.symbol || "RWA",
      targetPaused,
    });
  };

  const executeConfirmedPause = async () => {
    if (!pauseConfirmModal) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/admin/pause", {
        method: "POST",
        body: JSON.stringify({
          token_address: pauseConfirmModal.tokenAddress,
          paused: pauseConfirmModal.targetPaused,
          reason: pauseReason.trim() || undefined,
        }),
      });
      setPauseConfirmModal(null);
      setLastPauseTxResult({
        tx_hash: res.tx_hash,
        token: res.token,
        asset_name: res.asset_name || pauseConfirmModal.assetName,
        symbol: res.symbol || pauseConfirmModal.symbol,
        is_paused: res.is_paused,
        block_number: res.block_number || 1,
        actor: res.actor || currentUser?.address || "",
        timestamp: new Date().toISOString(),
      });
      await loadAdminData();
      showToast(
        "ok",
        `[${res.is_paused ? "TẠM DỪNG" : "KHÔI PHỤC"} THÀNH CÔNG] Hợp đồng ${pauseConfirmModal.symbol} (${res.token}) đã chuyển sang trạng thái ${
          res.is_paused ? "Tạm dừng" : "Hoạt động"
        }! TxHash: ${res.tx_hash}`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  // Kiểm tra các điều kiện tiên quyết của Forced Transfer trước khi mở Modal xác nhận
  const forcedValidation = {
    hasToken: Boolean(selectedTokenAddr),
    validFrom: Boolean(fromWalletInfo?.is_valid),
    validTo: Boolean(toWalletInfo?.is_valid),
    notSameWallet:
      Boolean(forcedFromAddr.trim()) &&
      forcedFromAddr.trim().toLowerCase() !== forcedToAddr.trim().toLowerCase(),
    validAmount: Number(forcedAmount) > 0,
    sufficientBalance:
      fromWalletInfo?.is_valid &&
      Number(fromWalletInfo?.selected_token_balance || 0) >= Number(forcedAmount) &&
      Number(forcedAmount) > 0,
    recipientKycVerified: Boolean(toWalletInfo?.is_valid && toWalletInfo?.is_kyc_verified),
    recipientNotFrozen: Boolean(toWalletInfo?.is_valid && !toWalletInfo?.is_frozen),
    adminAuthorized: role === "admin",
    hasReason: forcedReason.trim().length >= 5,
  };

  const canProceedForcedTransfer =
    forcedValidation.hasToken &&
    forcedValidation.validFrom &&
    forcedValidation.validTo &&
    forcedValidation.notSameWallet &&
    forcedValidation.validAmount &&
    forcedValidation.sufficientBalance &&
    forcedValidation.recipientKycVerified &&
    forcedValidation.recipientNotFrozen &&
    forcedValidation.adminAuthorized &&
    forcedValidation.hasReason;

  const executeConfirmedForcedTransfer = async () => {
    if (!selectedTokenAddr) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/admin/forced-transfer", {
        method: "POST",
        body: JSON.stringify({
          token_address: selectedTokenAddr,
          from_address: forcedFromAddr.trim(),
          to_address: forcedToAddr.trim(),
          amount: Number(forcedAmount),
          reason: forcedReason.trim(),
          case_code: forcedCaseCode.trim() || undefined,
        }),
      });
      setForcedConfirmModalOpen(false);
      setLastForcedTxResult({
        ...res,
        timestamp: new Date().toISOString(),
        actor: currentUser?.address,
      });
      await refreshBalances();
      await loadAdminData();
      await inspectForcedTransferWallets();
      showToast(
        "ok",
        `[FORCED TRANSFER THÀNH CÔNG] Đã cưỡng chế chuyển nhượng ${res.amount} token từ ${res.from} sang ví đã KYC ${res.to}! (TxHash: ${res.tx_hash})`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  const openRoleConfirmModal = (
    contractName: string,
    rName: string,
    accAddr: string,
    grant: boolean,
    tokAddr?: string
  ) => {
    setRoleConfirmModal({
      open: true,
      contractName,
      tokenAddress: tokAddr || (contractName === "AssetToken" ? selectedTokenAddr : undefined),
      roleName: rName,
      accountAddress: accAddr.trim(),
      grant,
    });
  };

  const executeConfirmedRoleManage = async () => {
    if (!roleConfirmModal) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/admin/roles", {
        method: "POST",
        body: JSON.stringify({
          contract_name: roleConfirmModal.contractName,
          token_address:
            roleConfirmModal.contractName === "AssetToken"
              ? roleConfirmModal.tokenAddress || selectedTokenAddr
              : undefined,
          role_name: roleConfirmModal.roleName,
          account_address: roleConfirmModal.accountAddress,
          grant: roleConfirmModal.grant,
          reason: roleReason.trim() || undefined,
        }),
      });
      setRoleConfirmModal(null);
      await loadAdminData();
      showToast(
        "ok",
        `[PHÂN QUYỀN ON-CHAIN] Đã gọi ${roleConfirmModal.contractName}.${
          roleConfirmModal.grant ? "grantRole" : "revokeRole"
        }(${res.role}, ${res.account}) thành công! (TxHash: ${res.tx_hash})`
      );
    } catch (err: any) {
      showToast("err", err.message);
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // HELPERS FORMAT & FILTERING
  // ==========================================
  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    if (iso.startsWith("Khởi tạo")) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const sec = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
  };

  const maskId = (num?: string) => {
    if (!num) return "—";
    if (num.length <= 6) return num;
    return `${num.slice(0, 3)}*****${num.slice(-4)}`;
  };

  const shortAddr = (addr?: string) => {
    if (!addr) return "—";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Giải mã địa chỉ ví / Smart Contract thành nhãn dễ hiểu cho bảng Tổng quan Quản trị
  const resolveAddressLabel = (addr?: string | null): { label: string | null; short: string; full: string } => {
    if (!addr) return { label: null, short: "—", full: "" };
    const clean = String(addr).trim();
    const low = clean.toLowerCase();
    if (low === "0x0000000000000000000000000000000000000000") {
      return { label: "Mint", short: shortAddr(clean), full: clean };
    }
    const matchedUser = labAccounts.find((u) => (u.address || "").toLowerCase() === low);
    if (matchedUser) {
      return { label: matchedUser.display_name, short: shortAddr(clean), full: clean };
    }
    const matchedContract = (monitoringData?.contracts || []).find(
      (c: any) => (c.address || "").toLowerCase() === low
    );
    if (matchedContract) {
      const cName = String(matchedContract.name || "");
      if (cName.toLowerCase().includes("primarysale")) {
        return { label: "Kho Sơ cấp", short: shortAddr(clean), full: clean };
      }
      if (cName.toLowerCase().includes("marketplace")) {
        return { label: "Sàn Marketplace", short: shortAddr(clean), full: clean };
      }
      return { label: cName || "Smart Contract", short: shortAddr(clean), full: clean };
    }
    const matchedEstate = (overviewData?.assets_detail || estates).find(
      (e: any) => (e.token_address || "").toLowerCase() === low
    );
    if (matchedEstate) {
      return { label: matchedEstate.symbol || matchedEstate.name, short: shortAddr(clean), full: clean };
    }
    return { label: null, short: shortAddr(clean), full: clean };
  };

  // Trích xuất thông tin đối tượng dạng cấu trúc (tên + địa chỉ rút gọn + full address để copy/tooltip)
  const extractAuditTargetInfo = (
    a: any
  ): { title: string | null; address?: string; subtitle?: string } => {
    const p = a.params_json || {};
    if (p.from && p.to) {
      const fromInfo = resolveAddressLabel(p.from);
      const toInfo = resolveAddressLabel(p.to);
      return {
        title: `${fromInfo.label || fromInfo.short} → ${toInfo.label || toInfo.short}`,
        address: p.to,
        subtitle: `${Number(p.amount || 0).toLocaleString("en-US")} ${p.symbol || "RWA"}`,
      };
    }
    if (p.account && p.role) {
      const info = resolveAddressLabel(p.account);
      return {
        title: info.label || null,
        address: p.account,
        subtitle: String(p.role),
      };
    }
    if (p.account) {
      const info = resolveAddressLabel(p.account);
      return { title: info.label, address: p.account };
    }
    if (p.investor) {
      const info = resolveAddressLabel(p.investor);
      return { title: info.label, address: p.investor };
    }
    if (p.token) {
      const info = resolveAddressLabel(p.token);
      return { title: p.symbol || info.label || "AssetToken", address: p.token };
    }
    if (p.symbol && p.name) {
      return { title: `${p.symbol} — ${p.name}` };
    }
    const fallbackAddr = p.contract_address || p.recipient;
    if (typeof fallbackAddr === "string" && fallbackAddr.startsWith("0x") && fallbackAddr.length === 42) {
      const info = resolveAddressLabel(fallbackAddr);
      return { title: info.label, address: fallbackAddr };
    }
    return { title: fallbackAddr || "Smart Contract" };
  };

  // Phân loại nhãn sự kiện trong Audit Logs (Mục 6)
  const classifyAuditAction = (method: string) => {
    if (method === "AssetToken.pause") {
      return {
        code: "PAUSE",
        label: "Tạm dừng hợp đồng",
        badge: "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20",
      };
    }
    if (method === "AssetToken.unpause") {
      return {
        code: "UNPAUSE",
        label: "Mở lại hợp đồng",
        badge: "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20",
      };
    }
    if (method === "AssetToken.forcedTransfer") {
      return {
        code: "FORCED_TRANSFER",
        label: "Khôi phục cổ phần",
        badge: "bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20",
      };
    }
    if (method === "IdentityRegistry.addToWhitelist") {
      return {
        code: "KYC_APPROVE",
        label: "Cấp quyền Whitelist",
        badge: "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20",
      };
    }
    if (method === "IdentityRegistry.removeFromWhitelist") {
      return {
        code: "KYC_REVOKE",
        label: "Thu hồi Whitelist",
        badge: "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20",
      };
    }
    if (method.includes("rejectKYC")) {
      return {
        code: "KYC_REJECT",
        label: "Từ chối hồ sơ KYC",
        badge: "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20",
      };
    }
    if (method.includes("reviewKYC") || method.includes("startReview")) {
      return {
        code: "KYC_REVIEW",
        label: "Tiếp nhận thẩm định KYC",
        badge: "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18",
      };
    }
    if (method.endsWith(".grantRole")) {
      return {
        code: "GRANT_ROLE",
        label: "Cấp quyền quản trị",
        badge: "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18",
      };
    }
    if (method.endsWith(".revokeRole")) {
      return {
        code: "REVOKE_ROLE",
        label: "Thu hồi quyền quản trị",
        badge: "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20",
      };
    }
    if (method === "AssetToken.setFrozen") {
      return {
        code: "FREEZE",
        label: "Đóng băng / Mở khóa tài khoản",
        badge: "bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20",
      };
    }
    if (method === "AssetToken.updateValuation") {
      return {
        code: "VALUATION",
        label: "Cập nhật định giá",
        badge: "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18",
      };
    }
    if (method === "AssetFactory.createAsset") {
      return {
        code: "TOKENIZE",
        label: "Phát hành hợp đồng Token",
        badge: "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18",
      };
    }
    if (method === "PrimarySale.openSale") {
      return {
        code: "OPEN_SALE",
        label: "Mở bán sơ cấp",
        badge: "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20",
      };
    }
    if (method === "PrimarySale.closeSale") {
      return {
        code: "CLOSE_SALE",
        label: "Đóng đợt bán sơ cấp",
        badge: "bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20",
      };
    }
    return {
      code: "OTHER",
      label: method,
      badge: "bg-[#EAE5DA]/85 text-[#141413]/80 ring-1 ring-inset ring-slate-500/20",
    };
  };

  const extractAuditTarget = (a: any) => {
    const p = a.params_json || {};
    if (p.from && p.to) return `${p.from.slice(0, 8)}... → ${p.to.slice(0, 8)}... (${p.amount} ${p.symbol || "RWA"})`;
    if (p.account && p.role) return `${p.account} (${p.role})`;
    if (p.account) return p.account;
    if (p.investor) return p.investor;
    if (p.token) return `${p.symbol || "AssetToken"} (${p.token})`;
    if (p.symbol && p.name) return `${p.symbol} — ${p.name}`;
    return p.contract_address || p.recipient || "Smart Contract";
  };

  // Lọc danh sách KYC (Compliance)
  const filteredKycList = kycList.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const subject = (item.payload_json?.full_name || item.investor_name || "").toLowerCase();
    const addr = (item.investor_address || "").toLowerCase();
    const idNum = (item.payload_json?.id_number || "").toLowerCase();
    return subject.includes(q) || addr.includes(q) || idNum.includes(q) || String(item.id).includes(q);
  });

  // Lọc danh sách Role Matrix (Admin Mục 5)
  const filteredRolesMatrix = (rolesMatrix.records || []).filter((r) => {
    if (roleFilterName !== "ALL" && r.role_name !== roleFilterName) return false;
    if (roleFilterContract !== "ALL" && r.contract_name !== roleFilterContract) return false;
    if (roleFilterStatus !== "ALL" && r.status !== roleFilterStatus) return false;
    if (!roleSearchQuery.trim()) return true;
    const q = roleSearchQuery.toLowerCase();
    return (
      (r.account_address || "").toLowerCase().includes(q) ||
      (r.display_name || "").toLowerCase().includes(q) ||
      (r.role_name || "").toLowerCase().includes(q) ||
      (r.contract_label || "").toLowerCase().includes(q)
    );
  });

  // Lọc danh sách Audit Logs (Admin Mục 6)
  const filteredAuditLogs = auditSigns.filter((a) => {
    const actionInfo = classifyAuditAction(a.contract_method || "");
    if (auditActionFilter !== "ALL" && actionInfo.code !== auditActionFilter) return false;
    const st = (a.status || "SUCCESS").toUpperCase();
    if (auditStatusFilter !== "ALL" && st !== auditStatusFilter) return false;

    if (auditTimeFilter !== "ALL" && a.signed_at) {
      const signedTime = new Date(a.signed_at).getTime();
      const now = Date.now();
      if (auditTimeFilter === "TODAY" && now - signedTime > 24 * 3600 * 1000) return false;
      if (auditTimeFilter === "7DAYS" && now - signedTime > 7 * 24 * 3600 * 1000) return false;
      if (auditTimeFilter === "30DAYS" && now - signedTime > 30 * 24 * 3600 * 1000) return false;
    }

    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    const targetStr = extractAuditTarget(a).toLowerCase();
    return (
      (a.signer_address || "").toLowerCase().includes(q) ||
      (a.signer_name || "").toLowerCase().includes(q) ||
      (a.tx_hash || "").toLowerCase().includes(q) ||
      (a.contract_method || "").toLowerCase().includes(q) ||
      targetStr.includes(q)
    );
  });

  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE));
  const paginatedAuditLogs = filteredAuditLogs.slice(
    (auditPage - 1) * AUDIT_PAGE_SIZE,
    auditPage * AUDIT_PAGE_SIZE
  );

  const assetsListForAdmin = overviewData?.assets_detail || estates;
  const currentSelectedAsset =
    assetsListForAdmin.find(
      (a: any) => (a.token_address || "").toLowerCase() === selectedTokenAddr.toLowerCase()
    ) || assetsListForAdmin.find((a: any) => a.token_address);

  return (
    <div className="space-y-6">
      {/* Compact Active Signer & Refresh Bar (Điều hướng chính qua Sidebar bên trái) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 text-xs text-[#141413]/55">
        <span className="inline-flex items-center gap-1.5">
          <span>Người ký hiện tại:</span>
          <strong className="text-[#141413] font-semibold">{currentUser?.display_name}</strong>
          <StatusBadge variant="info">{role.toUpperCase()}</StatusBadge>
        </span>
        {activeTab !== "monitoring" && (
          <button
            onClick={loadAdminData}
            disabled={loadingData || busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 font-medium shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin text-[#1B2A24]" : "text-[#141413]/55"}`} strokeWidth={1.75} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {/* Toast Notification & Error State Banner */}
      {feedback && (
        <div
          className={`rounded-md border px-4 py-3 text-xs font-medium flex items-center justify-between shadow-xs ${
            feedback.type === "ok"
              ? "border-[#2fb344]/40 bg-[#2fb344]/10 text-[#1E6B52]"
              : "border-[#d63939]/40 bg-[#d63939]/10 text-[#b02a37]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "ok" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2fb344]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#d63939]" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold ml-4 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {apiError && (
        <div className="rounded-md border border-[#d63939]/40 bg-[#d63939]/10 px-4 py-3 text-xs text-[#b02a37] flex items-center justify-between">
          <span>
            <strong>Lỗi kết nối API / Blockchain:</strong> {apiError}
          </span>
          <button
            onClick={loadAdminData}
            className="px-3 py-1.5 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* =====================================================================
          1. CHỈ HIỂN THỊ CHO COMPLIANCE: KYC REVIEW QUEUE & FREEZE
         ===================================================================== */}
      {role === "compliance" && (
        <div className="space-y-6">
          {/* TAB 1: COMPLIANCE DASHBOARD (PHẦN II) */}
          {(activeTab === "compliance-dashboard" || activeTab === "compliance") && (
            <div className="space-y-6">
              {/* Header Dashboard */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#1B2A24]/12 p-5 rounded-xl shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      COMPLIANCE OVERVIEW DASHBOARD
                    </span>
                    <span className="text-[11px] font-mono text-[#141413]/55">
                      Kiểm soát danh tính & tài khoản
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-[#141413]">
                    Bảng Điều Khiển Giám Sát Tuân Thủ &amp; Định Danh Số
                  </h1>
                  <p className="text-xs text-[#141413]/55">
                    Theo dõi số liệu KYC/AML thực tế, tiến độ thẩm định, tỷ lệ phê duyệt và kiểm soát đóng băng tài khoản ví.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => switchTab("compliance-queue")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Hàng đợi Thẩm định ({complianceOverview?.kpis?.pending ?? kycList.filter((k: any) => k.status === "pending").length})</span>
                  </button>
                  <button
                    onClick={loadAdminData}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white hover:bg-[#F4F1EA] transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* 6 Thẻ KPI Thống Kê Thực Tế (Phần II) */}
              {(() => {
                const kpis = complianceOverview?.kpis || {
                  total_kyc: kycList.length,
                  pending: kycList.filter((k: any) => k.status === "pending").length,
                  under_review: kycList.filter((k: any) => k.status === "under_review").length,
                  approved: kycList.filter((k: any) => k.status === "approved").length,
                  rejected: kycList.filter((k: any) => k.status === "rejected").length,
                  revoked: kycList.filter((k: any) => k.status === "revoked").length,
                  frozen_wallets: labAccounts.filter((a: any) => a.is_frozen).length,
                  approval_rate: 0,
                  rejection_rate: 0,
                };

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* KPI 1 */}
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Tổng Hồ sơ KYC</span>
                        <FileCheck className="w-4 h-4 text-[#206bc4]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#141413]">
                        {Number(kpis.total_kyc).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Toàn bộ hồ sơ nộp vào hệ thống</p>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Chờ Xét Duyệt</span>
                        <Clock className="w-4 h-4 text-[#f59f00]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#f59f00]">
                        {Number(kpis.pending).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Hồ sơ mới gửi cần xử lý</p>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Đang Kiểm Tra</span>
                        <Activity className="w-4 h-4 text-[#4263eb]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#4263eb]">
                        {Number(kpis.under_review).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Đang thẩm định</p>
                    </div>

                    {/* KPI 4 */}
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-semibold uppercase tracking-wider">
                        <span>Đã phê duyệt</span>
                        <CheckCircle2 className="w-4 h-4 text-[#1E6B52]" strokeWidth={1.75} />
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[#1E6B52] tabular-nums">
                        {Number(kpis.approved).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-xs text-[#141413]/55">Ghi Whitelist on-chain</p>
                    </div>

                    {/* KPI 5 */}
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-semibold uppercase tracking-wider">
                        <span>Bị từ chối</span>
                        <XCircle className="w-4 h-4 text-[#A63A3A]" strokeWidth={1.75} />
                      </div>
                      <div className="mt-2 text-2xl font-bold text-[#A63A3A] tabular-nums">
                        {Number(kpis.rejected).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-xs text-[#141413]/55">Từ chối kèm lý do phản hồi</p>
                    </div>

                    {/* KPI 6 */}
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Ví bị đóng băng</span>
                        <Lock className="w-4 h-4 text-[#d6336c]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#d6336c]">
                        {Number(kpis.frozen_wallets).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Khóa trên AssetToken</p>
                    </div>
                  </div>
                );
              })()}

              {/* Hai Khối Phân Tích: Timeline và Tỷ Lệ Duyệt */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline Hồ sơ KYC */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#206bc4]" />
                      <h3 className="text-sm font-bold text-[#141413]">
                        Phân Bổ Số Lượng Hồ Sơ KYC Theo Thời Gian
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#141413]/55">Dữ liệu thực tế hệ thống</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {(complianceOverview?.timeline && complianceOverview.timeline.length > 0) ? (
                      complianceOverview.timeline.map((t: any, idx: number) => {
                        const total = t.total || 1;
                        const appPct = Math.round(((t.approved || 0) / total) * 100);
                        const rejPct = Math.round(((t.rejected || 0) / total) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#141413]">{t.date}</span>
                              <span className="font-mono text-[#141413]/55">
                                Tổng: <strong>{t.total}</strong> ({t.approved || 0} approved, {t.rejected || 0} rejected)
                              </span>
                            </div>
                            <div className="w-full h-3 bg-[#f1f3f5] rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${appPct}%` }}
                                className="bg-[#1E6B52] h-full"
                                title={`Approved: ${t.approved}`}
                              />
                              <div
                                style={{ width: `${rejPct}%` }}
                                className="bg-[#A63A3A] h-full"
                                title={`Rejected: ${t.rejected}`}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-xs text-[#141413]/55">
                        Chưa có dữ liệu biểu đồ thời gian.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-[#141413]/55">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1E6B52]" />
                      <span>Đã phê duyệt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A63A3A]" />
                      <span>Bị từ chối</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#f1f3f5]" />
                      <span>Chờ xét duyệt</span>
                    </div>
                  </div>
                </div>

                {/* Tỷ Lệ Approved vs Rejected */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#206bc4]" />
                      <h3 className="text-sm font-bold text-[#141413]">
                        Tỷ lệ phê duyệt và từ chối
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#141413]/55">Độ chuẩn xác hồ sơ</span>
                  </div>

                  {(() => {
                    const approved = complianceOverview?.kpis?.approved ?? kycList.filter((k: any) => k.status === "approved").length;
                    const rejected = complianceOverview?.kpis?.rejected ?? kycList.filter((k: any) => k.status === "rejected").length;
                    const totalDecided = approved + rejected;
                    const appRate = totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 100;
                    const rejRate = totalDecided > 0 ? (100 - appRate) : 0;

                    return (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-[#E9F4EF] border border-emerald-200/70 text-center">
                            <span className="text-[11px] font-semibold text-[#1E6B52] uppercase tracking-wider block">Tỷ lệ phê duyệt</span>
                            <span className="text-3xl font-bold text-[#1E6B52] tabular-nums mt-1 block">{appRate}%</span>
                            <span className="text-xs text-[#141413]/55 tabular-nums mt-1 block">{approved} hồ sơ hợp lệ</span>
                          </div>
                          <div className="p-4 rounded-xl bg-[#FBF0F0] border border-[#A63A3A]/22 text-center">
                            <span className="text-[11px] font-semibold text-[#A63A3A] uppercase tracking-wider block">Tỷ lệ từ chối</span>
                            <span className="text-3xl font-bold text-[#A63A3A] tabular-nums mt-1 block">{rejRate}%</span>
                            <span className="text-xs text-[#141413]/55 tabular-nums mt-1 block">{rejected} hồ sơ không đạt</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>Phân bổ thẩm định hoàn tất</span>
                            <span className="font-mono">{totalDecided} / {complianceOverview?.kpis?.total_kyc ?? kycList.length} hồ sơ</span>
                          </div>
                          <div className="w-full h-3 bg-[#f1f3f5] rounded-full overflow-hidden flex">
                            <div style={{ width: `${appRate}%` }} className="bg-[#1E6B52] h-full" />
                            <div style={{ width: `${rejRate}%` }} className="bg-[#A63A3A] h-full" />
                          </div>
                        </div>

                        <p className="text-[11px] text-[#141413]/55 leading-relaxed">
                          Mọi quyết định phê duyệt đều được ghi nhận tự động vào danh sách nhà đầu tư hợp lệ. Các hồ sơ bị từ chối được lưu lý do off-chain để nhà đầu tư có thể nộp lại.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Ba Bảng Danh Sách Trên Dashboard: Hồ sơ mới gửi, Hồ sơ cần xử lý & Ví đang bị đóng băng */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bảng 1: Danh sách hồ sơ mới gửi */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#206bc4]" />
                      <h3 className="text-sm font-bold text-[#141413]">
                        Danh Sách Hồ Sơ Mới Gửi
                      </h3>
                    </div>
                    <button
                      onClick={() => switchTab("compliance-queue")}
                      className="text-xs text-[#206bc4] font-semibold hover:underline"
                    >
                      Tất cả →
                    </button>
                  </div>
                  <div className="divide-y divide-[#1B2A24]/8 text-xs">
                    {(() => {
                      const newestList = complianceOverview?.newly_submitted || kycList.slice(0, 5);
                      if (newestList.length === 0) {
                        return (
                          <div className="py-8 text-center text-[#141413]/55">
                            Chưa có hồ sơ KYC nào được gửi.
                          </div>
                        );
                      }
                      return newestList.slice(0, 5).map((app: any) => (
                        <div key={app.id} className="p-3.5 flex items-center justify-between hover:bg-[#F4F1EA]/75 transition-colors">
                          <div>
                            <div className="font-medium text-[#141413] flex items-center gap-1.5">
                              <span>#{app.id} · {app.payload_json?.full_name || app.investor_name}</span>
                            </div>
                            <div className="font-mono text-[11px] text-[#141413]/55 mt-0.5 tabular-nums">
                              {shortAddr(app.investor_address)} · {formatDate(app.created_at)}
                            </div>
                          </div>
                          <StatusBadge
                            variant={
                              app.status === "approved"
                                ? "success"
                                : app.status === "rejected" || app.status === "revoked"
                                ? "danger"
                                : app.status === "under_review"
                                ? "info"
                                : "warning"
                            }
                            dot
                          >
                            {formatKycStatusLabel(app.status)}
                          </StatusBadge>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Bảng 2: Hồ sơ chờ duyệt cần xử lý ngay */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#f59f00]" />
                      <h3 className="text-sm font-bold text-[#141413]">
                        Hồ Sơ Cần Xử Lý ({complianceOverview?.kpis?.pending ?? kycList.filter((k: any) => ["pending", "under_review"].includes(k.status)).length})
                      </h3>
                    </div>
                    <button
                      onClick={() => switchTab("compliance-queue")}
                      className="text-xs text-[#206bc4] font-semibold hover:underline"
                    >
                      Xử lý ngay →
                    </button>
                  </div>

                  <div className="divide-y divide-[#1B2A24]/8 text-xs">
                    {(() => {
                      const queueList = complianceOverview?.queue || kycList.filter((k: any) => ["pending", "under_review"].includes(k.status));
                      if (queueList.length === 0) {
                        return (
                          <div className="py-8 text-center text-[#141413]/55">
                            Không có hồ sơ nào đang chờ duyệt. Tất cả đã được xử lý!
                          </div>
                        );
                      }
                      return queueList.slice(0, 5).map((app: any) => (
                        <div key={app.id} className="p-3.5 flex items-center justify-between hover:bg-[#F4F1EA]/75 transition-colors">
                          <div>
                            <div className="font-medium text-[#141413] flex items-center gap-2">
                              <span>{app.payload?.full_name || app.payload_json?.full_name || app.investor_name}</span>
                              <StatusBadge variant={app.status === "under_review" ? "info" : "warning"} dot>
                                {app.status === "under_review" ? "Đang kiểm tra" : "Chờ xét duyệt"}
                              </StatusBadge>
                            </div>
                            <div className="font-mono text-[11px] text-[#141413]/55 mt-0.5 tabular-nums">
                              Ví: {shortAddr(app.investor_address)} · Gửi: {formatDate(app.created_at)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenKycDetail(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 text-xs font-medium shadow-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#141413]/55" strokeWidth={1.75} />
                            <span>Xem hồ sơ</span>
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Bảng 3: Danh sách Ví đang bị Đóng băng */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#d6336c]" />
                      <h3 className="text-sm font-bold text-[#141413]">
                        Ví Đang Bị Đóng Băng ({labAccounts.filter((a: any) => a.is_frozen).length})
                      </h3>
                    </div>
                    <button
                      onClick={() => switchTab("compliance-freeze")}
                      className="text-xs text-[#206bc4] font-semibold hover:underline"
                    >
                      Quản lý →
                    </button>
                  </div>

                  <div className="divide-y divide-[#1B2A24]/8 text-xs">
                    {(() => {
                      const frozenAccounts = labAccounts.filter((a: any) => a.is_frozen);
                      if (frozenAccounts.length === 0) {
                        return (
                          <div className="py-8 text-center text-[#141413]/55">
                            Hiện tại không có địa chỉ ví nào đang bị đóng băng.
                          </div>
                        );
                      }
                      return frozenAccounts.map((acct: any) => (
                        <div key={acct.address} className="p-3.5 flex items-center justify-between hover:bg-[#F4F1EA]/75 transition-colors">
                          <div>
                            <div className="font-medium text-[#141413] flex items-center gap-2">
                              <span>{acct.display_name}</span>
                              <StatusBadge variant="danger" dot>
                                Đóng băng
                              </StatusBadge>
                            </div>
                            <div className="font-mono text-[11px] text-[#141413]/55 mt-0.5">
                              {shortAddr(acct.address)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenFreezeModal(acct.address, acct.display_name, true, "unfreeze")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E6B52] hover:bg-[#175540] text-white text-xs font-medium shadow-xs transition-colors"
                          >
                            <Unlock className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Mở khóa</span>
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Nhật Ký Hoạt Động Gần Đây Của Compliance */}
              <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#206bc4]" />
                    <h3 className="text-sm font-bold text-[#141413]">
                      Hoạt động tuân thủ gần đây
                    </h3>
                  </div>
                  <button
                    onClick={() => switchTab("compliance-audit")}
                    className="text-xs text-[#206bc4] font-semibold hover:underline"
                  >
                    Xem toàn bộ Audit Logs →
                  </button>
                </div>

                <div className="divide-y divide-[#1B2A24]/8 text-xs">
                  {(() => {
                    const logs = complianceOverview?.compliance_audit_logs || auditSigns.filter(
                      (a: any) =>
                        a.role_label === "compliance" ||
                        a.contract_method?.startsWith("IdentityRegistry.") ||
                        a.contract_method === "AssetToken.setFrozen"
                    );

                    if (!logs || logs.length === 0) {
                      return (
                        <div className="py-6 text-center text-[#141413]/55">
                          Chưa có hoạt động tuân thủ nào được ghi nhận.
                        </div>
                      );
                    }

                    return logs.slice(0, 5).map((l: any, i: number) => {
                      const isWhite = l.contract_method?.includes("addToWhitelist");
                      const isRev = l.contract_method?.includes("removeFromWhitelist");
                      const isRej = l.contract_method?.includes("rejectKYC");

                      const badgeClass = isWhite
                        ? "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0"
                        : isRev
                        ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0"
                        : isRej
                        ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0"
                        : "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0";

                      return (
                        <div key={l.id || i} className="py-3 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
                                {l.contract_method}
                              </span>
                              <span className="font-mono text-[#141413]">{l.operator_name || "Compliance Officer"}</span>
                            </div>
                            <div className="text-[11px] text-[#141413]/55">
                              TxHash: <code className="font-mono">{shortAddr(l.tx_hash)}</code>
                            </div>
                          </div>
                          <span className="text-[11px] text-[#141413]/55 font-mono">
                            {formatDate(l.signed_at)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KYC REVIEW QUEUE (PHẦN III & IV) */}
          {activeTab === "compliance-queue" && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
              <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      KYC VERIFICATION QUEUE
                    </span>
                    <span className="text-xs text-[#141413]/55">Hàng đợi xác minh danh tính</span>
                  </div>
                  <h2 className="text-base font-bold text-[#141413]">
                    Hàng đợi xét duyệt hồ sơ KYC
                  </h2>
                  <p className="text-xs text-[#141413]/55">
                    Không hiển thị công khai thông tin nhạy cảm trên bảng danh sách. Nhấn &ldquo;Xem hồ sơ&rdquo; để kiểm tra chi tiết.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Lọc theo trạng thái */}
                  <select
                    aria-label="Lọc theo trạng thái"
                    value={kycStatusFilter}
                    onChange={(e) => { setKycStatusFilter(e.target.value); setKycPage(1); }}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Trạng thái: Tất cả</option>
                    <option value="pending">Chờ xét duyệt</option>
                    <option value="under_review">Đang kiểm tra</option>
                    <option value="approved">Đã phê duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                    <option value="revoked">Đã thu hồi</option>
                  </select>

                  {/* Lọc theo loại giấy tờ */}
                  <select
                    aria-label="Lọc theo loại giấy tờ"
                    value={kycDocFilter}
                    onChange={(e) => { setKycDocFilter(e.target.value); setKycPage(1); }}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Giấy tờ: Tất cả</option>
                    <option value="National ID">CCCD / National ID</option>
                    <option value="Driving Licence">Giấy phép lái xe</option>
                    <option value="Passport">Hộ chiếu</option>
                    <option value="Tax Certificate">Mã số thuế</option>
                  </select>

                  {/* Lọc theo thời gian gửi */}
                  <select
                    aria-label="Lọc theo thời gian gửi"
                    value={kycTimeFilter}
                    onChange={(e) => { setKycTimeFilter(e.target.value); setKycPage(1); }}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Thời gian: Tất cả</option>
                    <option value="today">Trong hôm nay</option>
                    <option value="7d">7 ngày gần đây</option>
                    <option value="30d">30 ngày gần đây</option>
                  </select>

                  {/* Sắp xếp theo ngày gửi */}
                  <button
                    onClick={() => setKycSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white hover:bg-[#F4F1EA]"
                    title="Sắp xếp theo ngày gửi"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#206bc4]" />
                    <span>{kycSortOrder === "desc" ? "Mới nhất" : "Cũ nhất"}</span>
                  </button>

                  {/* Tìm kiếm theo tên, ví, mã hồ sơ */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm tên, địa chỉ ví, mã #ID..."
                      value={kycSearch}
                      onChange={(e) => { setKycSearch(e.target.value); setKycPage(1); }}
                      className="w-52 pl-3 pr-8 py-1.5 border border-[#1B2A24]/14 rounded text-xs text-[#141413] placeholder-[#9aa7b8] focus:outline-none focus:border-[#206bc4]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    onClick={loadAdminData}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white hover:bg-[#F4F1EA] transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                    <span>Tải lại</span>
                  </button>
                </div>
              </div>

              {/* Table Danh sách Queue (Đúng 7 cột chuẩn mục 3.1 — Mỗi nhà đầu tư chỉ hiển thị 01 bản ghi mới nhất) */}
              {(() => {
                const nowMs = Date.now();
                // Bảo vệ 2 lớp: gom đúng 1 hồ sơ mới nhất (id lớn nhất) theo user_id trước khi lọc
                const latestByUserMap = new Map<number, any>();
                for (const item of kycList) {
                  if (item.status === "none") continue;
                  const uid = Number(item.user_id);
                  const prev = latestByUserMap.get(uid);
                  if (!prev || Number(item.id) > Number(prev.id)) {
                    latestByUserMap.set(uid, item);
                  }
                }
                const deduplicatedLatestList = Array.from(latestByUserMap.values());

                const filteredAll = deduplicatedLatestList
                  .filter((app: any) => {
                    if (kycStatusFilter !== "all" && app.status !== kycStatusFilter) return false;
                    if (kycDocFilter !== "all") {
                      const docType = app.payload_json?.document_type || "";
                      if (!docType.toLowerCase().includes(kycDocFilter.toLowerCase())) return false;
                    }
                    if (kycTimeFilter !== "all" && app.created_at) {
                      const createdMs = new Date(app.created_at).getTime();
                      const diffDays = (nowMs - createdMs) / (1000 * 60 * 60 * 24);
                      if (kycTimeFilter === "today" && diffDays > 1) return false;
                      if (kycTimeFilter === "7d" && diffDays > 7) return false;
                      if (kycTimeFilter === "30d" && diffDays > 30) return false;
                    }
                    if (!kycSearch.trim()) return true;
                    const q = kycSearch.toLowerCase();
                    const name = (app.payload_json?.full_name || app.investor_name || "").toLowerCase();
                    const addr = (app.investor_address || "").toLowerCase();
                    const idStr = String(app.id);
                    return name.includes(q) || addr.includes(q) || idStr.includes(q);
                  })
                  .sort((a: any, b: any) => {
                    const tA = new Date(a.created_at || 0).getTime();
                    const tB = new Date(b.created_at || 0).getTime();
                    return kycSortOrder === "desc" ? tB - tA : tA - tB;
                  });

                const pageSize = 6;
                const totalPages = Math.max(1, Math.ceil(filteredAll.length / pageSize));
                const safePage = Math.min(kycPage, totalPages);
                const pagedItems = filteredAll.slice((safePage - 1) * pageSize, safePage * pageSize);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                            <th className="py-3 px-5 w-16 whitespace-nowrap">ID</th>
                            <th className="py-3 px-4 whitespace-nowrap">Nhà đầu tư</th>
                            <th className="py-3 px-4 whitespace-nowrap">Địa chỉ ví</th>
                            <th className="py-3 px-4 whitespace-nowrap">Loại giấy tờ</th>
                            <th className="py-3 px-4 whitespace-nowrap">Ngày gửi</th>
                            <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
                            <th className="py-3 px-5 text-right whitespace-nowrap">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B2A24]/8 text-sm text-[#141413]">
                          {pagedItems.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-xs text-[#141413]/55">
                                Không tìm thấy hồ sơ KYC nào khớp với bộ lọc.
                              </td>
                            </tr>
                          ) : (
                            pagedItems.map((app: any) => {
                              const subjectType = app.payload_json?.subject_type || "Investor";
                              const docType = app.payload_json?.document_type || "CCCD / Căn cước công dân";

                              const statusInfo: {
                                label: string;
                                variant: "success" | "info" | "warning" | "danger";
                              } =
                                app.status === "approved"
                                  ? { label: "Đã phê duyệt", variant: "success" }
                                  : app.status === "under_review"
                                  ? { label: "Đang kiểm tra", variant: "info" }
                                  : app.status === "pending"
                                  ? { label: "Chờ xét duyệt", variant: "warning" }
                                  : app.status === "rejected"
                                  ? { label: "Bị từ chối", variant: "danger" }
                                  : { label: "Đã thu hồi", variant: "danger" };

                              return (
                                <tr key={app.id} className="hover:bg-[#F4F1EA]/75 transition-colors">
                                  <td className="py-3.5 px-5 font-semibold text-[#141413] tabular-nums">
                                    #{app.id}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-medium text-[#141413]">
                                        {app.payload_json?.full_name || app.investor_name || "Nhà đầu tư"}
                                      </span>
                                      {Number(app.attempt_count || 1) > 1 && (
                                        <span
                                          title={`Nhà đầu tư này đã nộp hồ sơ KYC tổng cộng ${app.attempt_count} lần`}
                                          className="inline-flex items-center whitespace-nowrap rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 px-2 py-0.5 text-[11px] font-medium tabular-nums"
                                        >
                                          Lần nộp #{app.attempt_count}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-[#141413]/55 block mt-0.5">
                                      Loại TK: {subjectType}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <CopyAddress address={app.investor_address} />
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <StatusBadge variant="info">{docType}</StatusBadge>
                                  </td>
                                  <td className="py-3.5 px-4 text-[#141413]/55 font-mono text-xs whitespace-nowrap tabular-nums">
                                    {formatDate(app.created_at)}
                                  </td>
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <StatusBadge variant={statusInfo.variant} dot>
                                      {statusInfo.label}
                                    </StatusBadge>
                                  </td>
                                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                                      <button
                                        onClick={() => handleOpenKycDetail(app, true)}
                                        title="Xem hồ sơ chi tiết, ảnh 2 mặt CCCD và lịch sử các lần nộp trước đó"
                                        className="px-3 py-1.5 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-[#141413]/55" strokeWidth={1.75} />
                                        <span>Xem hồ sơ</span>
                                      </button>

                                      {app.status === "pending" && (
                                        <>
                                          <button
                                            onClick={() => {
                                              handleOpenKycDetail(app, false);
                                              setChecklist({
                                                nameMatch: true,
                                                docValid: true,
                                                photoClear: true,
                                                walletMatch: true,
                                                notBlacklisted: true,
                                              });
                                              setShowApproveModal(true);
                                            }}
                                            disabled={busy}
                                            title="Phê duyệt hồ sơ KYC & ghi Whitelist lên IdentityRegistry"
                                            className="px-3 py-1.5 rounded-lg bg-[#1E6B52] hover:bg-[#175540] text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap disabled:opacity-50"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            <span>Phê duyệt</span>
                                          </button>

                                          <button
                                            onClick={() => {
                                              handleOpenKycDetail(app, false);
                                              setShowRejectModal(true);
                                            }}
                                            disabled={busy}
                                            title="Từ chối hồ sơ KYC kèm lý do"
                                            className="px-3 py-1.5 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
                                          >
                                            <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            <span>Từ chối</span>
                                          </button>
                                        </>
                                      )}

                                      {app.status === "approved" && (
                                        <button
                                          onClick={() => {
                                            handleOpenKycDetail(app, false);
                                            setShowRevokeModal(true);
                                          }}
                                          disabled={busy}
                                          title="Thu hồi quyền Whitelist trên IdentityRegistry"
                                          className="px-3 py-1.5 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
                                        >
                                          <Ban className="w-3.5 h-3.5" strokeWidth={1.75} />
                                          <span>Thu hồi</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Phân trang (Pagination) */}
                    <div className="px-5 py-3.5 border-t border-[#1B2A24]/8 flex flex-wrap items-center justify-between gap-3 text-xs text-[#141413]/55">
                      <div className="tabular-nums">
                        Hiển thị <strong className="text-[#141413]">{pagedItems.length}</strong> / <strong className="text-[#141413]">{filteredAll.length}</strong> hồ sơ KYC (Trang {safePage}/{totalPages})
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setKycPage((p) => Math.max(1, p - 1))}
                          disabled={safePage <= 1}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 font-medium disabled:opacity-40 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Trước</span>
                        </button>
                        <span className="font-mono font-semibold text-[#141413] tabular-nums">
                          {safePage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setKycPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage >= totalPages}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 font-medium disabled:opacity-40 transition-colors"
                        >
                          <span>Sau</span>
                          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 3: KYC REVIEW HISTORY (PHẦN VI) */}
          {activeTab === "compliance-history" && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
              <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      KYC REVIEW AUDIT TRAIL (READ-ONLY)
                    </span>
                    <span className="text-xs text-[#141413]/55">Phần VI</span>
                  </div>
                  <h2 className="text-base font-bold text-[#141413]">
                    Lịch sử xét duyệt KYC
                  </h2>
                  <p className="text-xs text-[#141413]/55">
                    Nhật ký bất biến ghi nhận các hành động Phê duyệt, Từ chối, Thu hồi và Nộp lại. Không cho phép sửa hoặc xóa.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <ExportCsvButton
                    endpoint="/kyc/compliance/export/kyc-history"
                    filename="kyc_review_history.csv"
                    label="Xuất CSV"
                  />
                  <select
                    aria-label="Lọc theo hành động"
                    value={historyActionFilter}
                    onChange={(e) => setHistoryActionFilter(e.target.value)}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Hành động: Tất cả</option>
                    <option value="Approve">Phê duyệt</option>
                    <option value="Reject">Từ chối</option>
                    <option value="Revoke">Thu hồi</option>
                    <option value="Resubmission">Nộp lại</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm tên, ví, mã hồ sơ..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-56 pl-3 pr-8 py-1.5 border border-[#1B2A24]/14 rounded text-xs text-[#141413] placeholder-[#9aa7b8] focus:outline-none focus:border-[#206bc4]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                      <th className="py-2.5 px-5 w-20">MÃ HỒ SƠ</th>
                      <th className="py-2.5 px-4">NHÀ ĐẦU TƯ</th>
                      <th className="py-2.5 px-4">ĐỊA CHỈ VÍ</th>
                      <th className="py-2.5 px-4">HÀNH ĐỘNG</th>
                      <th className="py-2.5 px-4">TRẠNG THÁI TRƯỚC</th>
                      <th className="py-2.5 px-4">TRẠNG THÁI SAU</th>
                      <th className="py-2.5 px-4">NGƯỜI THỰC HIỆN</th>
                      <th className="py-2.5 px-4">THỜI GIAN</th>
                      <th className="py-2.5 px-5 text-right">CHI TIẾT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-[13px] text-[#141413]">
                    {(() => {
                      const histList = (complianceOverview?.review_history || []).filter((item: any) => {
                        if (historyActionFilter !== "all" && item.action !== historyActionFilter && item.status !== historyActionFilter.toLowerCase()) {
                          return false;
                        }
                        if (!historySearch.trim()) return true;
                        const q = historySearch.toLowerCase();
                        const name = (item.investor_name || "").toLowerCase();
                        const addr = (item.investor_address || "").toLowerCase();
                        const idStr = String(item.id);
                        return name.includes(q) || addr.includes(q) || idStr.includes(q);
                      });

                      if (histList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-xs text-[#141413]/55">
                              Không tìm thấy lịch sử xét duyệt nào khớp với tiêu chí.
                            </td>
                          </tr>
                        );
                      }

                      return histList.map((item: any, idx: number) => {
                        const act = item.action || (item.status === "approved" ? "Approve" : item.status === "rejected" ? "Reject" : "Revoke");
                        const badge =
                          act === "Approve"
                            ? { label: "Phê duyệt", bg: "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0" }
                            : act === "Reject"
                            ? { label: "Từ chối", bg: "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" }
                            : act === "Revoke"
                            ? { label: "Thu hồi", bg: "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" }
                            : { label: formatComplianceActionLabel(act), bg: "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0" };

                        return (
                          <tr key={item.record_id || `${item.id}-${idx}`} className="hover:bg-[#F4F1EA]/75 transition-colors">
                            <td className="py-3 px-5 font-bold text-[#141413]">#{item.id}</td>
                            <td className="py-3 px-4 font-semibold text-[#141413]">
                              {item.investor_name}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#141413]/55">
                              {shortAddr(item.investor_address)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="whitespace-nowrap px-2 py-0.5 rounded bg-[#EAE5DA]/85 text-[#141413]/80 text-[11px] font-semibold">
                                {formatKycStatusLabel(item.previous_status || "pending")}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="whitespace-nowrap px-2 py-0.5 rounded bg-[#206bc4]/10 text-[#206bc4] text-[11px] font-bold">
                                {formatKycStatusLabel(item.new_status || item.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-xs text-[#141413]">
                              {item.reviewer_name || "Compliance Officer"}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-[#141413]/55">
                              {formatDate(item.reviewed_at)}
                            </td>
                            <td className="py-3 px-5 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedKycHistoryModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#206bc4] text-[#206bc4] hover:bg-[#206bc4]/10 text-xs font-semibold transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem chi tiết</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT MANAGEMENT & FREEZE / UNFREEZE (PHẦN V) */}
          {activeTab === "compliance-freeze" && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
              <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="whitespace-nowrap bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      ACCOUNT FREEZE MANAGEMENT
                    </span>
                    <span className="text-xs text-[#141413]/55">Quản lý khóa / mở khóa tài khoản</span>
                  </div>
                  <h2 className="text-base font-bold text-[#141413]">
                    Quản lý tài khoản &amp; Đóng băng / Mở khóa
                  </h2>
                  <p className="text-xs text-[#141413]/55">
                    Phân biệt độc lập giữa trạng thái KYC (IdentityRegistry) và trạng thái Đóng băng của ví (AssetToken).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Lọc theo KYC */}
                  <select
                    aria-label="Lọc theo trạng thái KYC"
                    value={freezeKycFilter}
                    onChange={(e) => { setFreezeKycFilter(e.target.value); setFreezePage(1); }}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">KYC: Tất cả</option>
                    <option value="approved">KYC: Approved</option>
                    <option value="pending">KYC: Pending</option>
                    <option value="rejected">KYC: Rejected</option>
                    <option value="revoked">KYC: Revoked</option>
                    <option value="none">KYC: Chưa nộp</option>
                  </select>

                  {/* Lọc theo trạng thái Freeze */}
                  <select
                    aria-label="Lọc theo trạng thái đóng băng"
                    value={freezeStatusFilter}
                    onChange={(e) => { setFreezeStatusFilter(e.target.value); setFreezePage(1); }}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Freeze Status: Tất cả</option>
                    <option value="frozen">Đang bị đóng băng</option>
                    <option value="active">Hoạt động bình thường</option>
                  </select>

                  {/* Tìm kiếm theo tên hoặc địa chỉ ví */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm tên nhà đầu tư, địa chỉ ví..."
                      value={freezeAccountSearch}
                      onChange={(e) => { setFreezeAccountSearch(e.target.value); setFreezePage(1); }}
                      className="w-56 pl-3 pr-8 py-1.5 border border-[#1B2A24]/14 rounded text-xs text-[#141413] placeholder-[#9aa7b8] focus:outline-none focus:border-[#206bc4]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {(() => {
                const accountsAll = (complianceOverview?.investor_accounts || labAccounts).filter((acct: any) => {
                  const kStatus = acct.kyc_status || (acct.is_whitelisted ? "approved" : "none");
                  if (freezeKycFilter !== "all" && kStatus !== freezeKycFilter) return false;
                  if (freezeStatusFilter === "frozen" && !acct.is_frozen) return false;
                  if (freezeStatusFilter === "active" && acct.is_frozen) return false;
                  if (!freezeAccountSearch.trim()) return true;
                  const q = freezeAccountSearch.toLowerCase();
                  const name = (acct.display_name || "").toLowerCase();
                  const addr = (acct.address || "").toLowerCase();
                  return name.includes(q) || addr.includes(q);
                });

                const fPageSize = 6;
                const fTotalPages = Math.max(1, Math.ceil(accountsAll.length / fPageSize));
                const fSafePage = Math.min(freezePage, fTotalPages);
                const fPaged = accountsAll.slice((fSafePage - 1) * fPageSize, fSafePage * fPageSize);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                            <th className="py-2.5 px-5">NHÀ ĐẦU TƯ</th>
                            <th className="py-2.5 px-4">ĐỊA CHỈ VÍ</th>
                            <th className="py-2.5 px-4">KYC STATUS</th>
                            <th className="py-2.5 px-4">FREEZE STATUS</th>
                            <th className="py-2.5 px-4">ĐÓNG BĂNG GẦN NHẤT</th>
                            <th className="py-2.5 px-4">SỐ DƯ TOKEN</th>
                            <th className="py-2.5 px-5 text-right">THAO TÁC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B2A24]/8 text-[13px] text-[#141413]">
                          {fPaged.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-xs text-[#141413]/55">
                                Không tìm thấy tài khoản nào khớp với bộ lọc.
                              </td>
                            </tr>
                          ) : (
                            fPaged.map((acct: any) => {
                              const isFrz = !!acct.is_frozen;
                              const kStatus = acct.kyc_status || (acct.is_whitelisted ? "approved" : "none");
                              const kBadge =
                                kStatus === "approved"
                                  ? { label: "Đã phê duyệt", bg: "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0" }
                                  : kStatus === "pending"
                                  ? { label: "Chờ xét duyệt", bg: "rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0" }
                                  : kStatus === "under_review"
                                  ? { label: "Đang kiểm tra", bg: "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0" }
                                  : kStatus === "rejected"
                                  ? { label: "Bị từ chối", bg: "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" }
                                  : kStatus === "revoked"
                                  ? { label: "Đã thu hồi", bg: "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" }
                                  : { label: "Chưa nộp KYC", bg: "rounded-full bg-[#EAE5DA]/85 text-[#141413]/80 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap shrink-0" };

                              return (
                                <tr key={acct.address} className="hover:bg-[#F4F1EA]/75 transition-colors">
                                  <td className="py-3 px-5">
                                    <div className="font-semibold text-[#141413]">{acct.display_name}</div>
                                    <div className="text-[11px] text-[#141413]/55 uppercase">{acct.role_label}</div>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span>{shortAddr(acct.address)}</span>
                                      <button
                                        onClick={() => copyToClipboard(acct.address)}
                                        className="text-[#9aa7b8] hover:text-[#141413]"
                                        title="Copy ví"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-medium ${kBadge.bg}`}>
                                      {kBadge.label}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className={`whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                      isFrz ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" : "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                                    }`}>
                                      {isFrz ? "🔒 Đang đóng băng" : "✓ Bình thường"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-xs text-[#141413]/55 whitespace-nowrap">
                                    {acct.last_frozen_at ? formatDate(acct.last_frozen_at) : "—"}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-xs font-bold text-[#141413] whitespace-nowrap">
                                    {Number(acct.token_balance || 0).toLocaleString("en-US")} CP
                                  </td>
                                  <td className="py-3 px-5 text-right whitespace-nowrap">
                                    {isFrz ? (
                                      <button
                                        onClick={() =>
                                          handleOpenFreezeModal(acct.address, acct.display_name, true, "unfreeze", {
                                            kycStatus: kStatus,
                                            tokenBalance: acct.token_balance,
                                            lastFrozenAt: acct.last_frozen_at,
                                            lastFreezeReason: acct.last_freeze_reason,
                                            lastFreezeCaseCode: acct.last_freeze_case_code,
                                          })
                                        }
                                        disabled={busy}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#1E6B52] hover:bg-[#175540] text-white rounded-lg text-xs font-semibold shadow-xs transition"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>Mở khóa</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleOpenFreezeModal(acct.address, acct.display_name, false, "freeze", {
                                            kycStatus: kStatus,
                                            tokenBalance: acct.token_balance,
                                            lastFrozenAt: acct.last_frozen_at,
                                            lastFreezeReason: acct.last_freeze_reason,
                                            lastFreezeCaseCode: acct.last_freeze_case_code,
                                          })
                                        }
                                        disabled={busy}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] rounded-lg text-xs font-semibold shadow-xs transition whitespace-nowrap"
                                      >
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Đóng băng</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Phân trang Account Management */}
                    <div className="px-5 py-3.5 border-t border-[#1B2A24]/12 flex items-center justify-between text-xs text-[#141413]/55">
                      <div>
                        Hiển thị <strong>{fPaged.length}</strong> / <strong>{accountsAll.length}</strong> tài khoản
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFreezePage((p) => Math.max(1, p - 1))}
                          disabled={fSafePage <= 1}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#1B2A24]/14 bg-white text-[#141413] font-semibold disabled:opacity-40"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Trước</span>
                        </button>
                        <span className="font-mono font-bold text-[#141413]">
                          {fSafePage} / {fTotalPages}
                        </span>
                        <button
                          onClick={() => setFreezePage((p) => Math.min(fTotalPages, p + 1))}
                          disabled={fSafePage >= fTotalPages}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#1B2A24]/14 bg-white text-[#141413] font-semibold disabled:opacity-40"
                        >
                          <span>Sau</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 5: FREEZE HISTORY (PHẦN VII) */}
          {activeTab === "compliance-freeze-history" && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
              <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="whitespace-nowrap bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      FREEZE AUDIT TRAIL (IMMUTABLE)
                    </span>
                    <span className="text-xs text-[#141413]/55">Phần VII</span>
                  </div>
                  <h2 className="text-base font-bold text-[#141413]">
                    Lịch sử đóng băng tài khoản
                  </h2>
                  <p className="text-xs text-[#141413]/55">
                    Lưu trữ độc lập từng lần Đóng băng và Mở khóa trên Blockchain, không ghi đè lịch sử cũ khi tài khoản được mở khóa.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Lọc theo hành động"
                    value={freezeHistFilter}
                    onChange={(e) => setFreezeHistFilter(e.target.value)}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Hành động: Tất cả</option>
                    <option value="freeze">Chỉ Freeze</option>
                    <option value="unfreeze">Chỉ Unfreeze</option>
                  </select>

                  <select
                    aria-label="Lọc theo thời gian"
                    value={freezeHistTimeFilter}
                    onChange={(e) => setFreezeHistTimeFilter(e.target.value)}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Thời gian: Tất cả</option>
                    <option value="today">Hôm nay</option>
                    <option value="7d">7 ngày qua</option>
                    <option value="30d">30 ngày qua</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm theo địa chỉ ví, tên..."
                      value={freezeHistSearch}
                      onChange={(e) => setFreezeHistSearch(e.target.value)}
                      className="w-56 pl-3 pr-8 py-1.5 border border-[#1B2A24]/14 rounded text-xs text-[#141413] placeholder-[#9aa7b8] focus:outline-none focus:border-[#206bc4]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                      <th className="py-2.5 px-5">NHÀ ĐẦU TƯ</th>
                      <th className="py-2.5 px-4">ĐỊA CHỈ VÍ</th>
                      <th className="py-2.5 px-4">HÀNH ĐỘNG</th>
                      <th className="py-2.5 px-4">LÝ DO</th>
                      <th className="py-2.5 px-4">NGƯỜI THỰC HIỆN</th>
                      <th className="py-2.5 px-4">THỜI GIAN</th>
                      <th className="py-2.5 px-4">TRANSACTION HASH</th>
                      <th className="py-2.5 px-4">TRẠNG THÁI GD</th>
                      <th className="py-2.5 px-5 text-right">CHI TIẾT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-[13px] text-[#141413]">
                    {(() => {
                      const nowMs = Date.now();
                      const freezeItems = (complianceOverview?.freeze_history || []).filter((item: any) => {
                        if (freezeHistFilter === "freeze" && !item.frozen) return false;
                        if (freezeHistFilter === "unfreeze" && item.frozen) return false;
                        if (freezeHistTimeFilter !== "all" && item.signed_at) {
                          const sMs = new Date(item.signed_at).getTime();
                          const diffDays = (nowMs - sMs) / (1000 * 60 * 60 * 24);
                          if (freezeHistTimeFilter === "today" && diffDays > 1) return false;
                          if (freezeHistTimeFilter === "7d" && diffDays > 7) return false;
                          if (freezeHistTimeFilter === "30d" && diffDays > 30) return false;
                        }
                        if (!freezeHistSearch.trim()) return true;
                        const q = freezeHistSearch.toLowerCase();
                        const name = (item.investor_name || "").toLowerCase();
                        const addr = (item.account_address || "").toLowerCase();
                        const cCode = (item.case_code || "").toLowerCase();
                        return name.includes(q) || addr.includes(q) || cCode.includes(q);
                      });

                      if (freezeItems.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-xs text-[#141413]/55">
                              Chưa có bản ghi lịch sử đóng băng nào khớp với tiêu chí.
                            </td>
                          </tr>
                        );
                      }

                      return freezeItems.map((item: any, idx: number) => {
                        const isFrz = !!item.frozen;
                        return (
                          <tr key={item.id || idx} className="hover:bg-[#F4F1EA]/75 transition-colors">
                            <td className="py-3 px-5 font-semibold text-[#141413]">
                              {item.investor_name}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#141413]/55">
                              {shortAddr(item.account_address)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                isFrz ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" : "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0"
                              }`}>
                                {isFrz ? "Đóng băng" : "Mở khóa"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#141413] max-w-xs">
                              <div className="font-semibold truncate" title={item.reason}>{item.reason}</div>
                              {item.case_code && (
                                <span className="text-[10px] font-mono text-[#206bc4] block">Mã: {item.case_code}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#141413] whitespace-nowrap">
                              {item.operator_name || "Compliance Officer"}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#141413]/55 whitespace-nowrap">
                              {formatDate(item.signed_at)}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[#206bc4] font-semibold">
                                <span>{shortAddr(item.tx_hash)}</span>
                                <button
                                  onClick={() => copyToClipboard(item.tx_hash)}
                                  className="text-[#9aa7b8] hover:text-[#141413]"
                                  title="Copy TxHash"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="whitespace-nowrap bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {item.tx_status || "Confirmed"}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedFreezeHistoryModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#206bc4] text-[#206bc4] hover:bg-[#206bc4]/10 text-xs font-semibold transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chi tiết</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: NHẬT KÝ KIỂM TOÁN KIỂM DUYỆT */}
          {activeTab === "compliance-audit" && (
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
              <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      NHẬT KÝ KIỂM TOÁN KIỂM DUYỆT
                    </span>
                    <span className="text-xs text-[#141413]/55">Phân biệt Đang xử lý · Thành công · Thất bại</span>
                  </div>
                  <h2 className="text-base font-bold text-[#141413]">
                    Nhật ký kiểm toán hoạt động tuân thủ
                  </h2>
                  <p className="text-xs text-[#141413]/55">
                    Tổng hợp Phê duyệt KYC, Từ chối KYC, Thu hồi KYC, Đóng băng / Mở khóa tài khoản và Truy cập tài liệu KYC bảo mật. Chỉ ghi nhận Thành công sau khi xác nhận hoàn tất.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ExportCsvButton
                    endpoint="/kyc/compliance/export/audit-logs"
                    filename="compliance_audit_logs.csv"
                    label="Xuất CSV"
                  />
                  {/* Lọc theo Hành động */}
                  <select
                    aria-label="Lọc theo hành động tuân thủ"
                    value={compAuditActionFilter}
                    onChange={(e) => setCompAuditActionFilter(e.target.value)}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Hành động: Tất cả</option>
                    <option value="Approve KYC">Approve KYC</option>
                    <option value="Reject KYC">Reject KYC</option>
                    <option value="Revoke KYC">Revoke KYC</option>
                    <option value="Freeze Account">Freeze Account</option>
                    <option value="Unfreeze Account">Unfreeze Account</option>
                    <option value="Under Review KYC">Under Review KYC</option>
                    <option value="View KYC Document">View KYC Document</option>
                    <option value="Download KYC Document">Download KYC Document</option>
                  </select>

                  {/* Lọc theo Kết quả (Pending / Success / Failed) */}
                  <select
                    aria-label="Lọc theo kết quả giao dịch"
                    value={compAuditResultFilter}
                    onChange={(e) => setCompAuditResultFilter(e.target.value)}
                    className="px-3 py-1.5 border border-[#1B2A24]/14 rounded text-xs font-semibold text-[#141413] bg-white cursor-pointer"
                  >
                    <option value="all">Kết quả: Tất cả</option>
                    <option value="Pending">Đang xử lý</option>
                    <option value="Success">Thành công</option>
                    <option value="Failed">Thất bại</option>
                  </select>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm người thực hiện, đối tượng, txhash..."
                      value={compAuditSearch}
                      onChange={(e) => setCompAuditSearch(e.target.value)}
                      className="w-60 pl-3 pr-8 py-1.5 border border-[#1B2A24]/14 rounded text-xs text-[#141413] placeholder-[#9aa7b8] focus:outline-none focus:border-[#206bc4]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                      <th className="py-2.5 px-5">NGƯỜI THỰC HIỆN</th>
                      <th className="py-2.5 px-4">ĐỊA CHỈ VÍ</th>
                      <th className="py-2.5 px-4">HÀNH ĐỘNG</th>
                      <th className="py-2.5 px-4">ĐỐI TƯỢNG</th>
                      <th className="py-2.5 px-4">LÝ DO</th>
                      <th className="py-2.5 px-4">THỜI GIAN</th>
                      <th className="py-2.5 px-4">TRANSACTION HASH</th>
                      <th className="py-2.5 px-5 text-right">KẾT QUẢ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-[13px] text-[#141413]">
                    {(() => {
                      const serverLogs = complianceOverview?.compliance_audit_logs || auditSigns
                        .filter(
                          (a: any) =>
                            a.role_label === "compliance" ||
                            a.contract_method?.startsWith("IdentityRegistry.") ||
                            a.contract_method === "AssetToken.setFrozen" ||
                            a.contract_method?.startsWith("KYCDocumentVault.")
                        )
                        .map((s: any) => {
                          const p = s.params_json || s.params || {};
                          const m = s.contract_method || "";
                          const act =
                            s.action_label ||
                            (m === "IdentityRegistry.addToWhitelist"
                              ? "Approve KYC"
                              : m === "IdentityRegistry.rejectKYC"
                              ? "Reject KYC"
                              : m === "IdentityRegistry.removeFromWhitelist"
                              ? "Revoke KYC"
                              : m === "AssetToken.setFrozen"
                              ? p.frozen
                                ? "Freeze Account"
                                : "Unfreeze Account"
                              : p.action || m);
                          const isOnchain = Boolean(s.tx_hash && String(s.tx_hash).startsWith("0x"));
                          return {
                            id: s.id,
                            operator_name: s.operator_name || "Compliance Officer",
                            signer_address: s.signer_address,
                            action_label: act,
                            target_subject: s.target_subject || p.investor_name || shortAddr(p.investor || p.account),
                            target_address: s.target_address || p.investor || p.account || "",
                            reason: s.reason || p.reason || p.notes || "Thực thi nghiệp vụ tuân thủ",
                            tx_hash: isOnchain ? s.tx_hash : null,
                            result_status: s.result_status || "Success",
                            signed_at: s.signed_at,
                          };
                        });

                      const combinedLogs = [...localComplianceLogs, ...serverLogs].filter((l: any) => {
                        if (compAuditActionFilter !== "all" && l.action_label !== compAuditActionFilter) return false;
                        const resSt = l.result_status || "Success";
                        if (compAuditResultFilter !== "all" && resSt.toLowerCase() !== compAuditResultFilter.toLowerCase()) {
                          return false;
                        }
                        if (!compAuditSearch.trim()) return true;
                        const q = compAuditSearch.toLowerCase();
                        const op = (l.operator_name || "").toLowerCase();
                        const act = (l.action_label || "").toLowerCase();
                        const subj = (l.target_subject || "").toLowerCase();
                        const rsn = (l.reason || "").toLowerCase();
                        const tx = (l.tx_hash || "").toLowerCase();
                        const signer = (l.signer_address || "").toLowerCase();
                        return (
                          op.includes(q) ||
                          act.includes(q) ||
                          subj.includes(q) ||
                          rsn.includes(q) ||
                          tx.includes(q) ||
                          signer.includes(q)
                        );
                      });

                      if (combinedLogs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-xs text-[#141413]/55">
                              Không tìm thấy bản ghi nhật ký kiểm toán tuân thủ nào khớp với bộ lọc.
                            </td>
                          </tr>
                        );
                      }

                      return combinedLogs.map((log: any, idx: number) => {
                        const resSt = log.result_status || "Success";
                        const resBadge =
                          resSt === "Pending"
                            ? { label: "Đang xử lý", bg: "rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0" }
                            : resSt === "Failed"
                            ? { label: "Thất bại", bg: "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0" }
                            : { label: "Thành công", bg: "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0" };

                        const actColor =
                          log.action_label === "Approve KYC" || log.action_label === "Unfreeze Account"
                            ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                            : log.action_label === "Reject KYC"
                            ? "bg-[#d63939]/10 text-[#b02a37] border border-[#d63939]/30"
                            : log.action_label === "Revoke KYC" || log.action_label === "Freeze Account"
                            ? "bg-[#d6336c]/10 text-[#a61e4d] border border-[#d6336c]/30"
                            : "bg-[#206bc4]/10 text-[#206bc4] border border-[#206bc4]/30";

                        return (
                          <tr key={log.id || idx} className="hover:bg-[#F4F1EA]/75 transition-colors">
                            <td className="py-3 px-5 font-semibold text-xs text-[#141413] whitespace-nowrap">
                              {log.operator_name || "Compliance Officer"}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#141413]/55 whitespace-nowrap">
                              {shortAddr(log.signer_address)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold ${actColor}`}>
                                {formatComplianceActionLabel(log.action_label)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <div className="font-semibold text-[#141413]">{log.target_subject || "—"}</div>
                              {log.target_address && (
                                <div className="font-mono text-[10px] text-[#141413]/55">{shortAddr(log.target_address)}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#141413] max-w-xs truncate" title={log.reason}>
                              {log.reason || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-[#141413]/55 whitespace-nowrap">
                              {formatDate(log.signed_at)}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                              {log.tx_hash ? (
                                <span className="inline-flex items-center gap-1 text-[#206bc4] font-semibold">
                                  <span>{shortAddr(log.tx_hash)}</span>
                                  <button
                                    onClick={() => copyToClipboard(log.tx_hash)}
                                    className="text-[#9aa7b8] hover:text-[#141413]"
                                    title="Copy TxHash"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : (
                                <span className="text-[#9aa7b8] italic text-[11px]">Off-chain / Không tạo Tx</span>
                              )}
                            </td>
                            <td className="py-3 px-5 text-right whitespace-nowrap">
                              <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${resBadge.bg}`}>
                                {resBadge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================================
              CÁC MODAL COMPLIANCE NÂNG CAO (PHẦN III, V, VI, VII, IX)
             ===================================================================== */}

          {/* 1. MODAL CHI TIẾT THẨM ĐỊNH KYC 4 PHÂN KHU (A, B, C, D — MỤC 3.2 & PHẦN IX) */}
          {selectedKycModal && showKycDetailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-3xl w-full my-8 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95">
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase">
                        MÃ HỒ SƠ KYC #{selectedKycModal.id} · HỒ SƠ MỚI NHẤT
                      </span>
                      <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedKycModal.status === "approved"
                          ? "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0"
                          : selectedKycModal.status === "rejected"
                          ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0"
                          : selectedKycModal.status === "revoked"
                          ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0"
                          : selectedKycModal.status === "under_review"
                          ? "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0"
                          : "rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0"
                      }`}>
                        {selectedKycModal.status.toUpperCase()}
                      </span>
                      {Number(selectedKycModal.attempt_count || 1) > 1 && (
                        <span className="whitespace-nowrap px-2 py-0.5 rounded bg-[#EFE0C8] text-[#8F622C] border border-[#B8844A]/40 text-[10px] font-bold">
                          Lần nộp #{selectedKycModal.attempt_count}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#141413]">
                      {selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowKycDetailModal(false);
                      setSelectedKycModal(null);
                    }}
                    className="p-1.5 rounded text-[#141413]/55 hover:text-[#141413] hover:bg-[#EAE5DA]"
                  >
                    ✕
                  </button>
                </div>

                {/* KHU A: THÔNG TIN NHÀ ĐẦU TƯ */}
                <div className="bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-md p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#206bc4]">
                    <Users className="w-4 h-4" />
                    <span>A. Thông Tin Nhà Đầu Tư</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#141413]/55 block">Họ tên:</span>
                      <strong className="text-[#141413]">{selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Địa chỉ ví:</span>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#141413]">
                        <span>{shortAddr(selectedKycModal.investor_address)}</span>
                        <button
                          onClick={() => copyToClipboard(selectedKycModal.investor_address)}
                          className="text-[#9aa7b8] hover:text-[#141413]"
                          title="Copy ví"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Loại tài khoản:</span>
                      <span className="font-semibold text-[#206bc4]">{selectedKycModal.payload_json?.subject_type || "Nhà đầu tư cá nhân"}</span>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Mã hồ sơ:</span>
                      <strong className="font-mono text-[#141413]">KYC-#{selectedKycModal.id}</strong>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Ngày gửi:</span>
                      <span className="font-mono text-[#141413]">{formatDate(selectedKycModal.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Trạng thái hiện tại:</span>
                      <strong className="uppercase text-[#141413]">{selectedKycModal.status}</strong>
                    </div>
                  </div>
                </div>

                {/* KHU B: THÔNG TIN GIẤY TỜ & BẢO MẬT KYC (PHẦN IX) */}
                <div className="bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-md p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#4263eb]">
                      <FileText className="w-4 h-4" />
                      <span>B. Thông Tin Giấy Tờ &amp; Kho Lưu Trữ Mã Hóa (AES-256-GCM Vault)</span>
                    </div>
                    <span className="whitespace-nowrap text-[10px] bg-[#EFE0C8] text-[#8F622C] px-2 py-0.5 rounded font-semibold">
                      Số giấy tờ ẩn bảo mật: {maskId(selectedKycModal.payload_json?.id_number || "079099005678")} · Không công khai URL IPFS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#141413]/55 block">Loại giấy tờ:</span>
                      <strong className="text-[#141413]">
                        {selectedKycModal.payload_json?.document_type || "CCCD / Căn cước công dân"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Ngày tải lên:</span>
                      <span className="font-mono text-[#141413]">
                        {formatDate(selectedKycModal.payload_json?.uploaded_at || selectedKycModal.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Tài liệu liên quan:</span>
                      <span className="text-[#141413] truncate block font-semibold" title={selectedKycModal.payload_json?.doc_name}>
                        {selectedKycModal.payload_json?.doc_name || "cccd_ho_chieu_gia_lap.pdf"}
                      </span>
                    </div>
                  </div>

                  {/* Khung hiển thị Ảnh mặt trước & Ảnh mặt sau với Kiểm soát Quyền Xem & Tải xuống */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white rounded border border-[#1B2A24]/14 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-5 h-5 text-[#206bc4] shrink-0" />
                        <div className="text-xs">
                          <div className="font-bold text-[#141413]">Ảnh mặt trước</div>
                          <div className="font-mono text-[10px] text-[#141413]/55">
                            Vault: enc://{(selectedKycModal.payload_json?.front_image_cid || selectedKycModal.payload_json?.doc_cid || "QmKYCFront2026").slice(0, 10)}...
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleControlledDocumentAccess(
                              selectedKycModal,
                              "VIEW",
                              "front",
                              `Ảnh Mặt Trước Giấy Tờ — Hồ sơ #${selectedKycModal.id}`,
                              selectedKycModal.payload_json?.front_image_cid || selectedKycModal.payload_json?.doc_cid || "QmKYCDefaultMockDocument2026",
                              `Mat_Truoc_${selectedKycModal.payload_json?.doc_name || "CCCD.png"}`,
                              selectedKycModal.payload_json?.front_preview_data_url
                            )
                          }
                          disabled={busy}
                          className="px-2 py-1 rounded bg-[#206bc4]/10 text-[#206bc4] hover:bg-[#206bc4]/20 text-[11px] font-semibold"
                        >
                          Xem trước
                        </button>
                        <button
                          onClick={() =>
                            handleControlledDocumentAccess(
                              selectedKycModal,
                              "DOWNLOAD",
                              "front",
                              `Tải Bản Sao Kiểm Toán Mặt Trước #${selectedKycModal.id}`,
                              selectedKycModal.payload_json?.front_image_cid || selectedKycModal.payload_json?.doc_cid || "QmKYCDefaultMockDocument2026",
                              `Mat_Truoc_${selectedKycModal.payload_json?.doc_name || "CCCD.png"}`
                            )
                          }
                          disabled={busy}
                          title="Tải xuống có kiểm soát & ghi Audit Log"
                          className="p-1 rounded border border-[#1B2A24]/14 text-[#141413]/55 hover:text-[#141413]"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded border border-[#1B2A24]/14 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-5 h-5 text-[#4263eb] shrink-0" />
                        <div className="text-xs">
                          <div className="font-bold text-[#141413]">Ảnh mặt sau</div>
                          <div className="font-mono text-[10px] text-[#141413]/55">
                            Vault: enc://{(selectedKycModal.payload_json?.back_image_cid || `${selectedKycModal.payload_json?.doc_cid || "QmKYC"}_back`).slice(0, 10)}...
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            handleControlledDocumentAccess(
                              selectedKycModal,
                              "VIEW",
                              "back",
                              `Ảnh Mặt Sau Giấy Tờ — Hồ sơ #${selectedKycModal.id}`,
                              selectedKycModal.payload_json?.back_image_cid || `${selectedKycModal.payload_json?.doc_cid || "QmKYCDefaultMockDocument2026"}_back`,
                              `Mat_Sau_${selectedKycModal.payload_json?.doc_name || "CCCD.png"}`,
                              selectedKycModal.payload_json?.back_preview_data_url
                            )
                          }
                          disabled={busy}
                          className="px-2 py-1 rounded bg-[#4263eb]/10 text-[#4263eb] hover:bg-[#4263eb]/20 text-[11px] font-semibold"
                        >
                          Xem trước
                        </button>
                        <button
                          onClick={() =>
                            handleControlledDocumentAccess(
                              selectedKycModal,
                              "DOWNLOAD",
                              "back",
                              `Tải Bản Sao Kiểm Toán Mặt Sau #${selectedKycModal.id}`,
                              selectedKycModal.payload_json?.back_image_cid || `${selectedKycModal.payload_json?.doc_cid || "QmKYCDefaultMockDocument2026"}_back`,
                              `Mat_Sau_${selectedKycModal.payload_json?.doc_name || "CCCD.png"}`
                            )
                          }
                          disabled={busy}
                          title="Tải xuống có kiểm soát & ghi Audit Log"
                          className="p-1 rounded border border-[#1B2A24]/14 text-[#141413]/55 hover:text-[#141413]"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lịch sử truy cập tài liệu bảo mật (Phần IX) */}
                  {Array.isArray(selectedKycModal.payload_json?.document_access_logs) &&
                    selectedKycModal.payload_json.document_access_logs.length > 0 && (
                      <div className="pt-2 border-t border-[#1B2A24]/12 text-[11px] space-y-1">
                        <span className="font-bold text-[#141413]/55 uppercase block">
                          Lịch sử truy cập tài liệu bảo mật gần nhất:
                        </span>
                        {selectedKycModal.payload_json.document_access_logs.slice(0, 2).map((acc: any, i: number) => (
                          <div key={acc.id || i} className="flex items-center justify-between text-[#141413] font-mono bg-white px-2.5 py-1 rounded border border-[#1B2A24]/8">
                            <span>
                              [{acc.access_type} · {acc.doc_side}] bởi {acc.operator_name}
                            </span>
                            <span className="text-[#141413]/55">{formatDate(acc.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* KHU C: KHU VỰC KIỂM TRA (CHECKLIST 5 CÂU HỎI CHUẨN MỤC 3.2.C) */}
                <div className="bg-[#fff9db]/50 border border-[#B8844A]/40 rounded-md p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#734E22]">
                      <ShieldCheck className="w-4 h-4 text-[#B8844A]" />
                      <span>C. Khu Vực Kiểm Tra Tính Hợp Lệ (Bắt buộc trước khi Phê duyệt)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#8F622C]">
                        Đã xác nhận: {Object.values(checklist).filter(Boolean).length}/5
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setChecklist({
                            docValid: true,
                            photoClear: true,
                            notBlacklisted: true,
                            nameMatch: true,
                            walletMatch: true,
                          })
                        }
                        className="px-2 py-0.5 rounded bg-[#B8844A] hover:bg-[#9C6D39] text-white text-[10px] font-bold transition"
                      >
                        ✓ Đánh dấu đạt 5/5
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#141413]">
                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-[#B8844A]/30 cursor-pointer hover:bg-amber-50/50">
                      <input
                        type="checkbox"
                        checked={checklist.docValid}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, docValid: e.target.checked }))}
                        className="mt-0.5 rounded text-[#206bc4] focus:ring-0"
                      />
                      <span>1. Tài liệu có đầy đủ không? (Đủ mặt trước, mặt sau và hồ sơ)</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-[#B8844A]/30 cursor-pointer hover:bg-amber-50/50">
                      <input
                        type="checkbox"
                        checked={checklist.photoClear}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, photoClear: e.target.checked }))}
                        className="mt-0.5 rounded text-[#206bc4] focus:ring-0"
                      />
                      <span>2. Ảnh có rõ ràng không? (Không bị mờ, lóa sáng hoặc mất góc)</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-[#B8844A]/30 cursor-pointer hover:bg-amber-50/50">
                      <input
                        type="checkbox"
                        checked={checklist.notBlacklisted}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, notBlacklisted: e.target.checked }))}
                        className="mt-0.5 rounded text-[#206bc4] focus:ring-0"
                      />
                      <span>3. Thông tin giấy tờ có hợp lệ không? (Còn hạn, đúng chuẩn pháp lý)</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-[#B8844A]/30 cursor-pointer hover:bg-amber-50/50">
                      <input
                        type="checkbox"
                        checked={checklist.nameMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, nameMatch: e.target.checked }))}
                        className="mt-0.5 rounded text-[#206bc4] focus:ring-0"
                      />
                      <span>4. Thông tin có trùng khớp với hồ sơ không? (Khớp tên &amp; địa chỉ ví)</span>
                    </label>

                    <label className="flex items-start gap-2 p-2 bg-white rounded border border-[#B8844A]/30 cursor-pointer hover:bg-amber-50/50 col-span-1 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={checklist.walletMatch}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, walletMatch: e.target.checked }))}
                        className="mt-0.5 rounded text-[#206bc4] focus:ring-0"
                      />
                      <span>5. Hồ sơ có dấu hiệu bất thường không? (Xác nhận hồ sơ minh bạch, KHÔNG có dấu hiệu bất thường / giả mạo)</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ghi chú kiểm tra của Cán bộ Tuân thủ..."
                      value={complianceReviewNotes}
                      disabled={selectedKycModal.status !== "pending"}
                      onChange={(e) => setComplianceReviewNotes(e.target.value)}
                      className="flex-1 rounded border border-[#1B2A24]/14 bg-white px-3 py-1.5 text-xs text-[#141413] disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* SECTION LỊCH SỬ XÉT DUYỆT TRƯỚC ĐÓ (READ-ONLY) */}
                <div className="bg-[#F4F1EA]/80 border border-[#1B2A24]/12 rounded-md p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#141413]">
                      <Activity className="w-4 h-4 text-[#206bc4]" />
                      <span>Lịch sử xét duyệt trước đó (Chỉ đọc)</span>
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EAE5DA] text-[#141413]/65">
                      {loadingKycHistory
                        ? "Đang tải..."
                        : `${kycDetailHistory.length} lần nộp trước`}
                    </span>
                  </div>

                  {loadingKycHistory ? (
                    <div className="py-3 text-center text-xs text-[#141413]/55">
                      Đang tải lịch sử các lần nộp hồ sơ KYC trước đó...
                    </div>
                  ) : kycDetailHistory.length === 0 ? (
                    <div className="py-2.5 px-3 bg-white rounded border border-[#1B2A24]/8 text-xs text-[#141413]/55">
                      Đây là lần nộp hồ sơ KYC đầu tiên của nhà đầu tư này (chưa có lịch sử nộp trước đó).
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded border border-[#1B2A24]/14">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 font-semibold uppercase text-[#141413]/55">
                            <th className="py-2 px-3 whitespace-nowrap">Mã HS</th>
                            <th className="py-2 px-3 whitespace-nowrap">Trạng thái</th>
                            <th className="py-2 px-3 whitespace-nowrap">Giấy tờ</th>
                            <th className="py-2 px-3 whitespace-nowrap">Ngày nộp / Duyệt</th>
                            <th className="py-2 px-3">Người duyệt &amp; Lý do</th>
                            <th className="py-2 px-3 text-right whitespace-nowrap">TxHash</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1B2A24]/8 text-[#141413]">
                          {kycDetailHistory.map((h: any) => {
                            const hBadge =
                              h.status === "approved"
                                ? "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0"
                                : h.status === "rejected"
                                ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0"
                                : h.status === "revoked"
                                ? "rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 whitespace-nowrap shrink-0"
                                : "rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0";
                            return (
                              <tr key={h.id} className="hover:bg-[#F4F1EA]/75">
                                <td className="py-2 px-3 font-mono font-bold whitespace-nowrap">
                                  #{h.id}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold ${hBadge}`}>
                                    {formatKycStatusLabel(h.status)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap text-[#141413]/65">
                                  {h.document_type}
                                </td>
                                <td className="py-2 px-3 font-mono text-[10px] text-[#141413]/55 whitespace-nowrap">
                                  <div>Nộp: {formatDate(h.submitted_at)}</div>
                                  {h.reviewed_at && <div>Duyệt: {formatDate(h.reviewed_at)}</div>}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-[#141413]">
                                    {h.reviewer_name || (h.reviewed_by ? `Compliance #${h.reviewed_by}` : "—")}
                                  </div>
                                  {h.reject_reason && (
                                    <div className="text-[10px] text-[#b02a37] mt-0.5">
                                      Lý do: {h.reject_reason}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-[10px] whitespace-nowrap">
                                  {h.tx_hash ? (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(h.tx_hash)}
                                      className="text-[#206bc4] hover:underline"
                                      title="Sao chép TxHash"
                                    >
                                      {shortAddr(h.tx_hash)}
                                    </button>
                                  ) : (
                                    <span className="text-[#9aa7b8]">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* KHU D: KHU VỰC QUYẾT ĐỊNH (MỤC 3.2.D — TUÂN THỦ CHẶT STATE MACHINE) */}
                {(() => {
                  const allChecked = Object.values(checklist).every(Boolean);
                  const currentSt = selectedKycModal.status;
                  return (
                    <div className="border-t border-[#1B2A24]/12 pt-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase text-[#141413]">
                          D. Khu vực quyết định
                        </span>
                        {!allChecked && currentSt === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              setChecklist({
                                nameMatch: true,
                                docValid: true,
                                photoClear: true,
                                walletMatch: true,
                                notBlacklisted: true,
                              })
                            }
                            className="px-2.5 py-1 rounded bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 hover:bg-[#2fb344]/20 text-[11px] font-semibold transition"
                          >
                            ✓ Tích chọn nhanh cả 5/5 tiêu chuẩn
                          </button>
                        )}
                      </div>

                      {(currentSt === "rejected" || currentSt === "revoked") && (
                        <div className="p-3.5 rounded-xl border border-[#A63A3A]/22 bg-[#FBF0F0] text-xs text-[#A63A3A] space-y-1">
                          <div className="font-semibold text-[#7A2727]">
                            Chế độ chỉ đọc — Hồ sơ đang ở trạng thái {formatKycStatusLabel(currentSt)}
                          </div>
                          {(selectedKycModal.payload_json?.rejection_reason ||
                            selectedKycModal.payload_json?.revocation_reason) && (
                            <div className="text-xs text-[#A63A3A]">
                              <strong>Lý do ghi nhận:</strong>{" "}
                              {selectedKycModal.payload_json?.rejection_reason ||
                                selectedKycModal.payload_json?.revocation_reason}
                            </div>
                          )}
                          <div className="text-[11px] text-rose-700/80">
                            Nhà đầu tư cần tự nộp lại hồ sơ mới thì mới được xét duyệt lại.
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-[#141413]/55">
                          TxHash On-chain:{" "}
                          <code className="font-mono text-[#141413]">
                            {selectedKycModal.tx_hash ? shortAddr(selectedKycModal.tx_hash) : "Chưa ghi chuỗi"}
                          </code>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentSt === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  if (!allChecked) {
                                    setChecklist({
                                      nameMatch: true,
                                      docValid: true,
                                      photoClear: true,
                                      walletMatch: true,
                                      notBlacklisted: true,
                                    });
                                  }
                                  setShowApproveModal(true);
                                }}
                                disabled={busy}
                                title="Duyệt hồ sơ KYC & ghi Whitelist lên IdentityRegistry"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E6B52] hover:bg-[#175540] disabled:opacity-40 text-white text-xs font-medium shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                                <span>Phê duyệt KYC</span>
                              </button>

                              <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] text-xs font-medium transition-colors"
                              >
                                <XCircle className="w-4 h-4" strokeWidth={1.75} />
                                <span>Từ chối hồ sơ</span>
                              </button>
                            </>
                          )}

                          {currentSt === "approved" && (
                            <button
                              onClick={() => setShowRevokeModal(true)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] text-xs font-medium transition-colors"
                            >
                              <Ban className="w-4 h-4" strokeWidth={1.75} />
                              <span>Thu hồi KYC</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowKycDetailModal(false);
                              setSelectedKycModal(null);
                            }}
                            className="px-4 py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 text-xs font-medium transition-colors"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 2. MODAL XEM TRƯỚC TÀI LIỆU BẢO MẬT IPFS */}
          {previewDocModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                  <div>
                    <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      SECURE KYC DOCUMENT PREVIEW
                    </span>
                    <h3 className="text-base font-bold text-[#141413] mt-1">{previewDocModal.title}</h3>
                  </div>
                  <button
                    onClick={() => setPreviewDocModal(null)}
                    className="p-1 rounded text-[#141413]/55 hover:text-[#141413]"
                  >
                    ✕
                  </button>
                </div>

                <div className="relative border-2 border-dashed border-[#1B2A24]/14 rounded-lg p-6 bg-[#F4F1EA]/80 text-center space-y-3 min-h-[220px] flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-[-15deg] z-20">
                    <span className="text-4xl font-extrabold uppercase text-[#141413] tracking-widest">
                      CONFIDENTIAL · COMPLIANCE REVIEW ONLY
                    </span>
                  </div>

                  {previewDocModal.previewUrl ? (
                    <div className="relative z-10 w-full flex flex-col items-center space-y-2">
                      <img
                        src={previewDocModal.previewUrl}
                        alt={previewDocModal.docName}
                        className="max-h-[320px] max-w-full rounded-md border border-[#1B2A24]/14 shadow-sm object-contain bg-white"
                      />
                      <p className="font-bold text-sm text-[#141413]">{previewDocModal.docName}</p>
                      <p className="font-mono text-xs text-[#206bc4]">Vault CID: {previewDocModal.cid}</p>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-12 h-12 text-[#206bc4] mx-auto" />
                      <div className="space-y-1 relative z-10">
                        <p className="font-bold text-sm text-[#141413]">{previewDocModal.docName}</p>
                        <p className="font-mono text-xs text-[#206bc4]">IPFS CID: {previewDocModal.cid}</p>
                        <p className="text-[11px] text-[#141413]/55">
                          Tài liệu bảo mật chỉ dành cho cán bộ có quyền <code>COMPLIANCE_ROLE</code> xem xét.
                        </p>
                      </div>
                    </>
                  )}
                  <div className="pt-2 relative z-10">
                    <span className="bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 px-3 py-1 rounded text-xs font-semibold">
                      ✓ Đã xác thực toàn vẹn dữ liệu Off-chain & Mã hóa AES-256-GCM
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setPreviewDocModal(null)}
                    className="px-4 py-2 rounded bg-[#182433] text-white text-xs font-semibold"
                  >
                    Đóng Xem Trước
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. MODAL XÁC NHẬN DUYỆT KYC (MỤC 3.3) */}
          {showApproveModal && selectedKycModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2fb344]/10 text-[#2fb344] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#141413]">Xác Nhận Phê Duyệt Hồ Sơ KYC</h3>
                    <p className="text-xs text-[#141413]/55">Kiểm tra thông tin trước khi thực thi giao dịch On-chain</p>
                  </div>
                </div>

                <div className="bg-[#F4F1EA]/80 p-3.5 rounded border border-[#1B2A24]/12 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Tên nhà đầu tư:</span>
                    <strong className="text-[#141413]">{selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Địa chỉ ví:</span>
                    <code className="font-mono text-[#141413]">{shortAddr(selectedKycModal.investor_address)}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Mã hồ sơ:</span>
                    <span className="font-bold text-[#206bc4]">#{selectedKycModal.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Hành động chuẩn bị thực hiện:</span>
                    <code className="text-[#2fb344] font-bold">Phê duyệt KYC &amp; Ghi Whitelist</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Quyền kiểm tra:</span>
                    <span className="font-mono font-semibold text-[#141413]">COMPLIANCE_ROLE</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 text-xs font-semibold text-[#141413]/55 hover:text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmApprove}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-[#1E6B52] hover:bg-[#175540] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {busy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Xác Nhận Thực Thi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. MODAL NHẬP LÝ DO TỪ CHỐI KYC (MỤC 3.4) */}
          {showRejectModal && selectedKycModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d63939]/10 text-[#d63939] flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#141413]">Từ Chối Hồ Sơ KYC #{selectedKycModal.id}</h3>
                    <p className="text-xs text-[#141413]/55">Lưu lý do từ chối để nhà đầu tư xem và bổ sung hồ sơ</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Chọn lý do từ chối (*):
                    </label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    >
                      <option value="Ảnh giấy tờ không rõ">Ảnh giấy tờ không rõ</option>
                      <option value="Thông tin không trùng khớp">Thông tin không trùng khớp</option>
                      <option value="Giấy tờ không hợp lệ">Giấy tờ không hợp lệ</option>
                      <option value="Thiếu tài liệu">Thiếu tài liệu</option>
                      <option value="Hồ sơ có dấu hiệu bất thường">Hồ sơ có dấu hiệu bất thường</option>
                      <option value="Lý do khác">Lý do khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Ghi chú chi tiết hướng dẫn nhà đầu tư:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nhập hướng dẫn cụ thể để nhà đầu tư biết cách bổ sung và gửi lại hồ sơ..."
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white p-3 text-[#141413]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 text-xs font-semibold text-[#141413]/55 hover:text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {busy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Xác nhận từ chối</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. MODAL CẢNH BÁO THU HỒI TRẠNG THÁI KYC (MỤC 3.5) */}
          {showRevokeModal && selectedKycModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d6336c]/10 text-[#d6336c] flex items-center justify-center shrink-0">
                    <Ban className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#141413]">Thu hồi trạng thái KYC</h3>
                    <p className="text-xs text-[#141413]/55">Thu hồi tư cách nhà đầu tư đã xác minh</p>
                  </div>
                </div>

                <div className="bg-[#F4F1EA]/80 p-3.5 rounded border border-[#1B2A24]/12 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Thông tin nhà đầu tư:</span>
                    <strong className="text-[#141413]">{selectedKycModal.payload_json?.full_name || selectedKycModal.investor_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Địa chỉ ví:</span>
                    <code className="font-mono text-[#141413]">{shortAddr(selectedKycModal.investor_address)}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Trạng thái KYC hiện tại:</span>
                    <span className="whitespace-nowrap bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                      {formatKycStatusLabel(selectedKycModal.status)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#FBF0F0] border border-[#A63A3A]/22 rounded-md text-xs text-[#A63A3A] space-y-1">
                  <p className="font-bold">Cảnh báo nghiệp vụ:</p>
                  <p>
                    Thu hồi trạng thái KYC sẽ xóa địa chỉ ví khỏi Whitelist trên <code>IdentityRegistry</code>. Lưu ý: Thao tác này <strong>không tự động đóng băng ví</strong> trên <code>AssetToken</code>.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Nhập lý do thu hồi (*):
                    </label>
                    <input
                      type="text"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">Ghi chú bổ sung:</label>
                    <input
                      type="text"
                      placeholder="Căn cứ quyết định rà soát định kỳ..."
                      value={revokeNotes}
                      onChange={(e) => setRevokeNotes(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowRevokeModal(false)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 text-xs font-semibold text-[#141413]/55 hover:text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmRevoke}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {busy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Xác Nhận Thu Hồi KYC</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. MODAL ĐÓNG BĂNG / MỞ KHÓA TÀI KHOẢN (MỤC 5.2 & 5.3) */}
          {freezeModalData && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    freezeModalData.action === "freeze"
                      ? "bg-[#d6336c]/10 text-[#d6336c]"
                      : "bg-[#2fb344]/10 text-[#2fb344]"
                  }`}>
                    {freezeModalData.action === "freeze" ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#141413]">
                      {freezeModalData.action === "freeze" ? "Đóng băng tài khoản" : "Mở khóa tài khoản"}
                    </h3>
                    <p className="text-xs text-[#141413]/55">Tạm khóa hoặc khôi phục quyền giao dịch của tài khoản</p>
                  </div>
                </div>

                {/* Thông tin tự động hiển thị theo Mục 5.2 & 5.3 */}
                <div className="bg-[#F4F1EA]/80 p-3.5 rounded border border-[#1B2A24]/12 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Tên nhà đầu tư:</span>
                    <strong className="text-[#141413]">{freezeModalData.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Địa chỉ ví:</span>
                    <code className="font-mono text-[#141413]">{shortAddr(freezeModalData.account)}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Trạng thái KYC:</span>
                    <span className="font-bold text-[#206bc4]">{formatKycStatusLabel(freezeModalData.kycStatus || "approved")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Trạng thái đóng băng hiện tại:</span>
                    <span className={`font-bold ${freezeModalData.isFrozen ? "text-[#d6336c]" : "text-[#2fb344]"}`}>
                      {freezeModalData.isFrozen ? "Đang bị đóng băng" : "Đang hoạt động"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Số dư Token hiện tại:</span>
                    <strong className="font-mono text-[#141413]">
                      {Number(freezeModalData.tokenBalance || 0).toLocaleString("en-US")} CP
                    </strong>
                  </div>

                  {/* Khi Unfreeze: Hiển thị thêm lý do đã đóng băng & thời điểm đóng băng (Mục 5.3) */}
                  {freezeModalData.action === "unfreeze" && (
                    <div className="pt-2 border-t border-[#1B2A24]/12 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#141413]/55">Thời điểm đóng băng:</span>
                        <span className="font-mono text-[#141413]">
                          {freezeModalData.lastFrozenAt ? formatDate(freezeModalData.lastFrozenAt) : "Ghi nhận trước đó"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#141413]/55 block">Lý do đã đóng băng:</span>
                        <span className="font-semibold text-[#d6336c]">
                          {freezeModalData.lastFreezeReason || "Khóa theo quyết định kiểm soát tuân thủ"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {freezeModalData.action === "unfreeze" && (
                  <div className="p-2.5 rounded bg-[#F8EFE2] border border-[#B8844A]/30 text-[11px] text-[#734E22]">
                    <strong>Lưu ý nghiệp vụ:</strong> Mở khóa đóng băng ví không đồng nghĩa với việc tự động phê duyệt KYC trên <code>IdentityRegistry</code>.
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      {freezeModalData.action === "freeze" ? "Lý do đóng băng (*):" : "Lý do mở khóa (*):"}
                    </label>
                    <select
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    >
                      {freezeModalData.action === "freeze" ? (
                        <>
                          <option value="Nghi vấn vi phạm quy chế giao dịch hoặc rửa tiền">Nghi vấn vi phạm quy chế giao dịch hoặc rửa tiền</option>
                          <option value="Yêu cầu phong tỏa khẩn cấp từ cơ quan quản lý">Yêu cầu phong tỏa khẩn cấp từ cơ quan quản lý</option>
                          <option value="Phát hiện truy cập bất thường / Nghi vấn lộ khóa riêng">Phát hiện truy cập bất thường / Nghi vấn lộ khóa riêng</option>
                          <option value="Tranh chấp quyền sở hữu tài sản đang điều tra">Tranh chấp quyền sở hữu tài sản đang điều tra</option>
                          <option value="Khác">Khác (Ghi rõ trong phần ghi chú)</option>
                        </>
                      ) : (
                        <>
                          <option value="Đã hoàn tất thẩm định tuân thủ, xác minh an toàn">Đã hoàn tất thẩm định tuân thủ, xác minh an toàn</option>
                          <option value="Có văn bản giải tỏa phong tỏa từ cơ quan có thẩm quyền">Có văn bản giải tỏa phong tỏa từ cơ quan có thẩm quyền</option>
                          <option value="Đã xử lý xong tranh chấp tài khoản">Đã xử lý xong tranh chấp tài khoản</option>
                          <option value="Khác">Khác</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Mã hồ sơ vi phạm (nếu có):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: CASE-AML-2026-08"
                      value={freezeCaseCode}
                      onChange={(e) => setFreezeCaseCode(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-mono text-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">Ghi chú xử lý:</label>
                    <input
                      type="text"
                      placeholder="Ghi chú chi tiết lưu vào Audit Log..."
                      value={freezeNotes}
                      onChange={(e) => setFreezeNotes(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setFreezeModalData(null)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 text-xs font-semibold text-[#141413]/55 hover:text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmFreezeAction}
                    disabled={busy}
                    className={`px-4 py-2 rounded text-white text-xs font-semibold inline-flex items-center gap-1.5 ${
                      freezeModalData.action === "freeze"
                        ? "bg-[#A63A3A] hover:bg-[#8A2E2E]"
                        : "bg-[#1E6B52] hover:bg-[#175540]"
                    }`}
                  >
                    {busy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{freezeModalData.action === "freeze" ? "Xác nhận đóng băng" : "Xác nhận mở khóa"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7. MODAL XEM CHI TIẾT LỊCH SỬ XÉT DUYỆT KYC (PHẦN VI — READ-ONLY) */}
          {selectedKycHistoryModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                  <div>
                    <span className="whitespace-nowrap bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      CHI TIẾT LỊCH SỬ XÉT DUYỆT KYC (CHỈ ĐỌC)
                    </span>
                    <h3 className="text-base font-bold text-[#141413] mt-1">
                      Hồ sơ #{selectedKycHistoryModal.id} — {selectedKycHistoryModal.investor_name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedKycHistoryModal(null)}
                    className="p-1 rounded text-[#141413]/55 hover:text-[#141413]"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Hành động thực hiện:</span>
                    <strong className="text-[#206bc4] uppercase">{selectedKycHistoryModal.action}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Chuyển đổi trạng thái:</span>
                    <span className="font-mono font-bold text-[#141413]">
                      {selectedKycHistoryModal.previous_status} → {selectedKycHistoryModal.new_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Địa chỉ ví nhà đầu tư:</span>
                    <code className="font-mono text-[#141413]">{selectedKycHistoryModal.investor_address}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Người thực hiện:</span>
                    <strong className="text-[#141413]">{selectedKycHistoryModal.reviewer_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Thời gian thực hiện:</span>
                    <span className="font-mono text-[#141413]">{formatDate(selectedKycHistoryModal.reviewed_at)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block mb-0.5">Lý do xử lý:</span>
                    <p className="font-semibold text-[#141413]">{selectedKycHistoryModal.reason || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block mb-0.5">Ghi chú:</span>
                    <p className="text-[#141413] italic">{selectedKycHistoryModal.notes || "Không có ghi chú bổ sung"}</p>
                  </div>
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block mb-0.5">Transaction Hash / Mã tham chiếu:</span>
                    <code className="font-mono text-[11px] text-[#206bc4] break-all">
                      {selectedKycHistoryModal.tx_hash || "Off-chain Record"}
                    </code>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-[#141413]/55">
                  <span>🔒 Bản ghi lịch sử kiểm toán bất biến (Không thể sửa/xóa)</span>
                  <button
                    onClick={() => setSelectedKycHistoryModal(null)}
                    className="px-4 py-1.5 rounded bg-[#182433] text-white text-xs font-semibold"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. MODAL XEM CHI TIẾT LỊCH SỬ FREEZE / UNFREEZE (PHẦN VII — READ-ONLY) */}
          {selectedFreezeHistoryModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                  <div>
                    <span className="whitespace-nowrap bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      CHI TIẾT LỊCH SỬ FREEZE / UNFREEZE
                    </span>
                    <h3 className="text-base font-bold text-[#141413] mt-1">
                      {selectedFreezeHistoryModal.investor_name} ({shortAddr(selectedFreezeHistoryModal.account_address)})
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedFreezeHistoryModal(null)}
                    className="p-1 rounded text-[#141413]/55 hover:text-[#141413]"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Hành động:</span>
                    <span className={`font-bold uppercase ${selectedFreezeHistoryModal.frozen ? "text-[#d6336c]" : "text-[#2fb344]"}`}>
                      {selectedFreezeHistoryModal.frozen ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Địa chỉ ví mục tiêu:</span>
                    <code className="font-mono text-[#141413]">{selectedFreezeHistoryModal.account_address}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Hợp đồng Token:</span>
                    <code className="font-mono text-[#141413]">{shortAddr(selectedFreezeHistoryModal.token_address)}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Mã hồ sơ vụ việc:</span>
                    <strong className="font-mono text-[#206bc4]">{selectedFreezeHistoryModal.case_code || "—"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Người thực hiện:</span>
                    <strong className="text-[#141413]">{selectedFreezeHistoryModal.operator_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Thời gian thực hiện:</span>
                    <span className="font-mono text-[#141413]">{formatDate(selectedFreezeHistoryModal.signed_at)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block mb-0.5">Lý do thực hiện:</span>
                    <p className="font-semibold text-[#141413]">{selectedFreezeHistoryModal.reason}</p>
                  </div>
                  {selectedFreezeHistoryModal.notes && (
                    <div>
                      <span className="text-[#141413]/55 block mb-0.5">Ghi chú bổ sung:</span>
                      <p className="text-[#141413] italic">{selectedFreezeHistoryModal.notes}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block mb-0.5">Transaction Hash On-chain:</span>
                    <code className="font-mono text-[11px] text-[#206bc4] break-all">
                      {selectedFreezeHistoryModal.tx_hash}
                    </code>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-[11px] text-[#141413]/55">
                  <span>✓ Trạng thái giao dịch: Confirmed On-chain</span>
                  <button
                    onClick={() => setSelectedFreezeHistoryModal(null)}
                    className="px-4 py-1.5 rounded bg-[#182433] text-white text-xs font-semibold"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          2. ISSUER PORTAL: 5 PHÂN HỆ CHUYÊN SÂU CHO ĐƠN VỊ PHÁT HÀNH (PHẦN II..VIII)
         ===================================================================== */}
      {role === "issuer" &&
        (activeTab === "issuer-dashboard" || activeTab === "issuer") && (
          <div className="space-y-6">
            {/* 6 Thẻ thống kê thực tế (Phần II) */}
            {(() => {
              const issuerEsts = issuerOverview?.estates || estates;
              const kpis = issuerOverview?.kpis || {
                total_registered_assets: issuerEsts.length,
                total_tokenized_assets: issuerEsts.filter((e: any) => e.token_address).length,
                open_sale_assets: issuerEsts.filter((e: any) => e.primary_sale?.is_open).length,
                total_shares_issued: issuerEsts
                  .filter((e: any) => e.token_address)
                  .reduce((s: number, e: any) => s + Number(e.total_shares || 0), 0),
                total_shares_sold: issuerEsts.reduce(
                  (s: number, e: any) => s + Number(e.primary_sale?.sold_amount || 0),
                  0
                ),
                total_usdc_raised: issuerEsts.reduce(
                  (s: number, e: any) => s + Number(e.primary_sale?.raised_usdc || 0),
                  0
                ),
              };

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>BĐS Đã Đăng ký</span>
                        <Building2 className="w-4 h-4 text-[#206bc4]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#141413]">
                        {Number(kpis.total_registered_assets).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Hồ sơ BĐS thuộc Issuer</p>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>BĐS Đã Token hóa</span>
                        <Layers className="w-4 h-4 text-[#206bc4]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#206bc4]">
                        {Number(kpis.total_tokenized_assets).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Đã triển khai hợp đồng AssetToken</p>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Đang Mở bán</span>
                        <Activity className="w-4 h-4 text-[#2fb344]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#2fb344]">
                        {Number(kpis.open_sale_assets).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Đợt bán sơ cấp qua PrimarySale</p>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Tổng CP Phát hành</span>
                        <Coins className="w-4 h-4 text-[#f59f00]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#141413]">
                        {Number(kpis.total_shares_issued).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Tổng cung ERC-20 đã đúc</p>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Tổng CP Đã bán</span>
                        <CheckCircle2 className="w-4 h-4 text-[#2fb344]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#141413]">
                        {Number(kpis.total_shares_sold).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Đã phân phối cho Nhà đầu tư</p>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
                      <div className="flex items-center justify-between text-[#141413]/55 text-[11px] font-bold uppercase">
                        <span>Tổng Tiền Huy động</span>
                        <BarChart3 className="w-4 h-4 text-[#2fb344]" />
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#2fb344]">
                        ${Number(kpis.total_usdc_raised).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1 text-[11px] text-[#141413]/55">Đơn vị thanh toán: mUSDC</p>
                    </div>
                  </div>

                  {/* Hàng 2: Biểu đồ doanh số bán & tiến độ huy động + Trạng thái kết nối Blockchain */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#206bc4]" />
                          <h2 className="text-sm font-bold text-[#141413]">
                            Biểu đồ Doanh số & Tiến độ Mở bán Sơ cấp theo Tài sản
                          </h2>
                        </div>
                        <button
                          onClick={() => switchTab("issuer-sales")}
                          className="text-xs font-semibold text-[#206bc4] hover:underline"
                        >
                          Quản lý mở bán →
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        {issuerEsts.map((e: any) => {
                          const s = e.primary_sale || {};
                          const pct = Number(s.progress_percent || 0);
                          return (
                            <div key={e.id} className="space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-[#141413]">
                                  {e.name} ({e.symbol})
                                </span>
                                <span className="text-[#141413]/55">
                                  Đã bán:{" "}
                                  <strong className="text-[#141413]">
                                    {Number(s.sold_amount || 0).toLocaleString("en-US")}
                                  </strong>{" "}
                                  / {Number(s.total_amount || e.total_shares || 0).toLocaleString("en-US")} cp · Huy động:{" "}
                                  <strong className="text-[#2fb344]">
                                    ${Number(s.raised_usdc || 0).toLocaleString("en-US")} mUSDC
                                  </strong>{" "}
                                  ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-[#eef0f3] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#206bc4] to-[#2fb344]"
                                  style={{ width: `${Math.max(pct > 0 ? 4 : 0, Math.min(100, pct))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-[#206bc4]" />
                          <h2 className="text-sm font-bold text-[#141413]">
                            Trạng thái Kết nối Blockchain
                          </h2>
                        </div>
                        <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                          Đã kết nối
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-[#1B2A24]/8">
                          <span className="text-[#141413]/55">RPC Endpoint:</span>
                          <code className="font-mono font-semibold text-[#141413]">
                            {issuerOverview?.blockchain_status?.rpc_url || "http://127.0.0.1:8545"}
                          </code>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-[#1B2A24]/8">
                          <span className="text-[#141413]/55">Chain ID:</span>
                          <strong className="font-mono">
                            {issuerOverview?.blockchain_status?.chain_id || 31337} (Anvil)
                          </strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-[#1B2A24]/8">
                          <span className="text-[#141413]/55">Block hiện tại:</span>
                          <strong className="font-mono text-[#1B2A24] tabular-nums">
                            #{issuerOverview?.blockchain_status?.block_number ?? "Live"}
                          </strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-[#1B2A24]/8">
                          <span className="text-[#141413]/55">Giá Gas:</span>
                          <span className="font-mono text-[#141413] tabular-nums">
                            {issuerOverview?.blockchain_status?.gas_price_gwei ?? 1.0} Gwei
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-[#1B2A24]/8">
                          <span className="text-[#141413]/55">Ví Issuer đang kết nối:</span>
                          <code className="font-mono text-[11px] text-[#141413]">
                            {currentUser?.address.slice(0, 10)}...
                          </code>
                        </div>
                        <div className="pt-1 flex gap-2">
                          <button
                            onClick={() => switchTab("issuer-register")}
                            className="w-full py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg font-semibold transition"
                          >
                            + Đăng ký BĐS mới
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hàng 3: Danh sách BĐS mới đăng ký & Tài sản đang mở bán */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
                      <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#141413]">
                          Danh sách Bất động sản Mới Đăng ký
                        </h3>
                        <Link
                          href="/assets"
                          className="text-xs font-semibold text-[#206bc4] hover:underline"
                        >
                          Xem tất cả →
                        </Link>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                              <th className="py-2.5 px-4">BẤT ĐỘNG SẢN</th>
                              <th className="py-2.5 px-3">ĐỊNH GIÁ</th>
                              <th className="py-2.5 px-3">TRẠNG THÁI</th>
                              <th className="py-2.5 px-4 text-right">THAO TÁC</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                            {issuerEsts.slice(0, 5).map((e: any) => (
                              <tr key={e.id} className="hover:bg-[#F4F1EA]/75">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-[#141413]">
                                    {e.name} ({e.symbol})
                                  </div>
                                  <div className="text-[11px] text-[#141413]/55 truncate max-w-xs">
                                    {e.address_text}
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-semibold">
                                  ${Number(e.valuation).toLocaleString("en-US")}
                                </td>
                                <td className="py-3 px-3">
                                  {e.token_address ? (
                                    <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 text-[10px] font-medium">
                                      Đã Token hóa
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 text-[10px] font-medium">
                                      Sẵn sàng phát hành
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Link
                                    href={`/assets/${e.id}`}
                                    className="text-[#206bc4] font-semibold hover:underline"
                                  >
                                    Chi tiết →
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
                      <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#141413]">
                          Giao dịch Gần đây & Hoạt động Phát hành
                        </h3>
                        <button
                          onClick={() => switchTab("issuer-reports")}
                          className="text-xs font-semibold text-[#206bc4] hover:underline"
                        >
                          Xem báo cáo →
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                              <th className="py-2.5 px-4">THỜI GIAN</th>
                              <th className="py-2.5 px-3">HÀNH ĐỘNG / SỰ KIỆN</th>
                              <th className="py-2.5 px-3">TÀI SẢN</th>
                              <th className="py-2.5 px-4 text-right">TX HASH</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                            {(issuerOverview?.issuer_activities || []).slice(0, 6).map((act: any) => (
                              <tr key={act.id} className="hover:bg-[#F4F1EA]/75">
                                <td className="py-3 px-4 text-[#141413]/55">
                                  {formatDate(act.signed_at)}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="whitespace-nowrap px-2 py-0.5 rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 text-[10px] font-mono font-medium">
                                    {act.contract_method}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-semibold text-[#141413]">
                                  {act.params_json?.symbol || "RWA"}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-[11px] text-[#206bc4]">
                                  {act.tx_hash?.slice(0, 12)}...
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      {/* =====================================================================
          2B. ISSUER TAB 2: ĐĂNG KÝ BĐS & TOKEN HÓA (PHẦN III — 4 NHÓM & 7 BƯỚC)
         ===================================================================== */}
      {role === "issuer" && activeTab === "issuer-register" && (
        <div className="space-y-6">
          {/* Thanh Quy trình 7 Bước (Phần 3.2) */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-[#206bc4] mb-2">
              QUY TRÌNH CHUẨN ĐĂNG KÝ HỒ SƠ VÀ TOKEN HÓA TÁCH BIỆT
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
              {[
                "1. Nhập thông tin BĐS",
                "2. Kiểm tra dữ liệu & IPFS",
                "3. Xem trước",
                "4. Xác nhận đăng ký",
                "5. Lưu hồ sơ",
                "6. Chủ động Tokenize",
                "7. Nhận TxHash On-chain",
              ].map((stepLabel, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border border-[#1B2A24]/14 bg-[#F4F1EA]/80 font-semibold text-[#141413] text-center"
                >
                  {stepLabel}
                </div>
              ))}
            </div>
          </div>

          {/* Thông báo kết quả Bước 5 (Hồ sơ vừa đăng ký chờ Token hóa) hoặc Bước 7 (Biên lai Token hóa) */}
          {registeredPendingAsset && !registeredPendingAsset.token_address && (
            <div className="bg-[#f0f6ff] border border-[#206bc4] rounded-md p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="whitespace-nowrap inline-block px-2 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                  BƯỚC 5 HOÀN TẤT · HỒ SƠ ĐÃ LƯU Ở TRẠNG THÁI READY
                </span>
                <h3 className="text-sm font-bold text-[#141413]">
                  Bất động sản #{registeredPendingAsset.id}: {registeredPendingAsset.name} (
                  {registeredPendingAsset.symbol})
                </h3>
                <p className="text-[#141413]/65">
                  CID: <code>{registeredPendingAsset.doc_cid}</code> · Keccak-256 Hash:{" "}
                  <code>{registeredPendingAsset.doc_hash?.slice(0, 22)}...</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTokenizeConfirmAsset(registeredPendingAsset)}
                disabled={busy}
                className="px-4 py-2.5 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg font-bold shadow-xs transition"
              >
                Bước 6: Xác nhận phát hành cổ phần bất động sản →
              </button>
            </div>
          )}

          {lastTokenizeReceipt && (
            <div className="bg-[#2fb344]/10 border border-[#2fb344] rounded-md p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                  BƯỚC 7 HOÀN TẤT · TOKEN HÓA BLOCKCHAIN THÀNH CÔNG
                </span>
                <Link
                  href={`/assets/${lastTokenizeReceipt.estate_id}`}
                  className="font-bold text-[#206bc4] hover:underline"
                >
                  Mở trang Chi tiết & Mở bán Sơ cấp →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[#141413]/55 block">Tên Tài sản & Symbol:</span>
                  <strong className="text-[#141413]">
                    {lastTokenizeReceipt.name} ({lastTokenizeReceipt.symbol})
                  </strong>
                </div>
                <div>
                  <span className="text-[#141413]/55 block">Địa chỉ Hợp đồng AssetToken:</span>
                  <code className="font-mono font-bold text-[#206bc4]">
                    {lastTokenizeReceipt.token_address}
                  </code>
                </div>
                <div>
                  <span className="text-[#141413]/55 block">Transaction Hash:</span>
                  <code className="font-mono text-[#141413] break-all">
                    {lastTokenizeReceipt.tx_hash}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Cột trái (2/3): Biểu mẫu chia làm 4 nhóm chuẩn Phần 3.1 */}
            <form
              onSubmit={handleOpenPreviewStep}
              className="lg:col-span-2 bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-6 text-xs"
            >
              <div className="border-b border-[#1B2A24]/12 pb-3.5">
                <span className="whitespace-nowrap inline-block bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  ASSET REGISTRATION & TOKENIZATION
                </span>
                <h2 className="text-base font-bold text-[#141413]">
                  Biểu mẫu Đăng ký Hồ sơ Bất động sản & Thông số Token hóa
                </h2>
              </div>

              {/* NHÓM 1: THÔNG TIN BẤT ĐỘNG SẢN */}
              <div className="p-4 rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 space-y-4">
                <h3 className="font-bold text-sm text-[#141413] border-b border-[#1B2A24]/12 pb-2">
                  Nhóm 1: Thông tin Bất động sản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-[#141413] mb-1">
                      Tên dự án / Bất động sản (*):
                    </label>
                    <input
                      type="text"
                      required
                      value={estName}
                      onChange={(e) => setEstName(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Loại hình bất động sản (*):
                    </label>
                    <select
                      value={estKind}
                      onChange={(e) => setEstKind(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    >
                      <option value="apartment">Căn hộ</option>
                      <option value="land">Đất nền</option>
                      <option value="building">Tòa nhà thương mại</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-[#141413] mb-1">
                      Địa chỉ chi tiết (*):
                    </label>
                    <input
                      type="text"
                      required
                      value={estAddress}
                      onChange={(e) => setEstAddress(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-[#141413] mb-1">
                        Diện tích (m² *):
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={estArea}
                        onChange={(e) => setEstArea(e.target.value)}
                        className="w-full rounded border border-[#1B2A24]/14 bg-white px-2.5 py-2 text-[#141413]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#141413] mb-1">Năm XD (*):</label>
                      <input
                        type="number"
                        min="1900"
                        max="2035"
                        required
                        value={estBuildYear}
                        onChange={(e) => setEstBuildYear(e.target.value)}
                        className="w-full rounded border border-[#1B2A24]/14 bg-white px-2.5 py-2 text-[#141413]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#141413] mb-1">
                    Mô tả chi tiết bất động sản:
                  </label>
                  <textarea
                    rows={2}
                    value={estDesc}
                    onChange={(e) => setEstDesc(e.target.value)}
                    className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                  />
                </div>
              </div>

              {/* NHÓM 2: THÔNG TIN TOKEN HÓA */}
              <div className="p-4 rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 space-y-4">
                <h3 className="font-bold text-sm text-[#141413] border-b border-[#1B2A24]/12 pb-2">
                  Nhóm 2: Thông tin Token hóa (ERC-20 RWA Parameters)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Tên Token ERC-20:
                    </label>
                    <input
                      type="text"
                      value={estTokenName}
                      onChange={(e) => setEstTokenName(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-[#141413]">
                        Mã Token (Symbol — 3–12 ký tự A–Z, 0–9 *):
                      </label>
                      <button
                        type="button"
                        onClick={() => setEstSymbol(suggestNextUniqueSymbol())}
                        className="text-[11px] font-semibold text-[#206bc4] hover:underline"
                      >
                        Gợi ý mã mới
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      placeholder="VD: RWA09, VINH02..."
                      value={estSymbol}
                      onChange={(e) =>
                        setEstSymbol(e.target.value.toUpperCase().replace(/\s+/g, ""))
                      }
                      className={`w-full rounded border px-3 py-2 font-mono font-bold ${
                        isDuplicateSymbol || (symbolUpper.length > 0 && !isValidSymbolFormat)
                          ? "border-[#d63939] bg-[#d63939]/5 text-[#d63939]"
                          : "border-[#1B2A24]/14 bg-white text-[#141413]"
                      }`}
                    />
                    {isDuplicateSymbol ? (
                      <span className="text-[11px] text-[#d63939] font-semibold block mt-0.5">
                        ⚠ Mã Symbol `{symbolUpper}` đã được dùng bởi BĐS #{duplicateEstate?.id} (
                        {duplicateEstate?.name}). Hãy nhập mã khác hoặc bấm &quot;Gợi ý mã mới&quot;.
                      </span>
                    ) : symbolUpper.length > 0 && !isValidSymbolFormat ? (
                      <span className="text-[11px] text-[#d63939] font-semibold block mt-0.5">
                        ⚠ Sai định dạng: Mã Token phải từ 3–12 ký tự, chỉ gồm chữ cái A–Z không dấu và
                        số 0–9 (không khoảng trắng, không dấu gạch).
                      </span>
                    ) : symbolUpper.length > 0 ? (
                      <span className="text-[11px] text-[#2fb344] font-semibold block mt-0.5">
                        ✓ Mã Token `{symbolUpper}` hợp lệ và chưa từng sử dụng.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Tổng định giá ban đầu (mUSDC *):
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={estValuation}
                      onChange={(e) => setEstValuation(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-bold text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Tổng số cổ phần phát hành (*):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={estShares}
                      onChange={(e) => setEstShares(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-bold text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#141413]/55 mb-1">
                      Giá trị quy đổi / cổ phần:
                    </label>
                    <div className="w-full rounded border border-[#1B2A24]/14 bg-[#f0f6ff] px-3 py-2 font-bold text-[#206bc4]">
                      $
                      {Number(estShares) > 0
                        ? (Number(estValuation) / Number(estShares)).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : "0"}{" "}
                      mUSDC / cp
                    </div>
                  </div>
                </div>
              </div>

              {/* NHÓM 3: HÌNH ẢNH BẤT ĐỘNG SẢN */}
              <div className="p-4 rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 space-y-3">
                <h3 className="font-bold text-sm text-[#141413] border-b border-[#1B2A24]/12 pb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#206bc4]" />
                  <span>Nhóm 3: Hình ảnh Bất động sản (Ảnh đại diện & Ảnh mô tả)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Tải lên ảnh đại diện:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-1.5"
                    />
                    {estCoverPreview && (
                      <img
                        src={estCoverPreview}
                        alt="Cover Preview"
                        className="mt-2 h-24 w-full object-cover rounded border border-[#1B2A24]/14"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Tải lên nhiều ảnh mô tả:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesChange}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-1.5"
                    />
                    {estGalleryPreviews.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {estGalleryPreviews.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`Gallery ${i}`}
                            className="h-16 w-20 object-cover rounded border border-[#1B2A24]/14 shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NHÓM 4: HỒ SƠ PHÁP LÝ IPFS */}
              <div className="p-4 rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 space-y-3">
                <h3 className="font-bold text-sm text-[#141413] border-b border-[#1B2A24]/12 pb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#206bc4]" />
                  <span>Nhóm 4: Hồ sơ Pháp lý IPFS (docCID & docHash Keccak-256)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Loại tài liệu pháp lý:
                    </label>
                    <select
                      value={estDocType}
                      onChange={(e) => setEstDocType(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                    >
                      <option value="Giấy chứng nhận QSDĐ & Hồ sơ Pháp lý (Legal Deed)">
                        Giấy chứng nhận QSDĐ & Hồ sơ pháp lý
                      </option>
                      <option value="Chứng thư Thẩm định giá Độc lập (Valuation Report)">
                        Chứng thư thẩm định giá độc lập
                      </option>
                      <option value="Giấy phép Xây dựng & Quy hoạch 1/500">
                        Giấy phép Xây dựng & Quy hoạch 1/500
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Upload tệp tài liệu Word lên IPFS Pinata (.DOCX, .DOC, .PDF, .PNG, .JPG):
                    </label>
                    <input
                      type="file"
                      accept=".docx,.doc,.pdf,.png,.jpg,.jpeg"
                      onChange={handleUploadEstatePdf}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-1.5"
                    />
                  </div>
                </div>

                {/* Chi tiết file sau khi upload */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded border border-[#1B2A24]/12">
                  <div>
                    <span className="text-[#141413]/55 block">Tên file & Dung lượng:</span>
                    <strong className="text-[#141413]">
                      {estDocFileName || `Ho_so_Phap_ly_${symbolUpper}.docx`}
                    </strong>
                    <span className="block text-[11px] text-[#141413]/55">
                      {estDocFileSize
                        ? `${(estDocFileSize / 1024).toFixed(2)} KB`
                        : "Tự động tạo tệp Word (.docx) & CID nếu chưa chọn file"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">Trạng thái Upload IPFS:</span>
                    <span
                      className={`whitespace-nowrap inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        estUploadStatus === "done"
                          ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                          : estUploadStatus === "uploading"
                          ? "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18"
                          : estUploadStatus === "error"
                          ? "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20"
                          : "bg-[#EAE5DA]/85 text-[#141413]/80 ring-1 ring-inset ring-slate-500/20"
                      }`}
                    >
                      {estUploadStatus === "done"
                        ? "Đã tải lên IPFS"
                        : estUploadStatus === "uploading"
                        ? "Đang tải lên..."
                        : estUploadStatus === "error"
                        ? "Lỗi tải tệp"
                        : "Sẵn sàng"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">IPFS CID & Keccak-256 Hash:</span>
                    <code className="font-mono text-[11px] text-[#206bc4] block truncate">
                      CID: {estDocCid || `QmRWALab${symbolUpper}LegalDeed2026`}
                    </code>
                    <code className="font-mono text-[10px] text-[#141413] block truncate">
                      Hash: {estDocHash || "Tự động băm Keccak-256 khi đăng ký"}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[#141413]/55">
                  * Quy trình an toàn: Xem trước thông tin → Lưu hồ sơ → Xác nhận phát hành cổ phần.
                </span>
                <button
                  type="submit"
                  disabled={busy || !canOpenIssuerPreview}
                  className="inline-flex items-center gap-2 rounded bg-[#1B2A24] hover:bg-[#14201B] disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>Bước 3: Xem trước hồ sơ & Đăng ký</span>
                </button>
              </div>
            </form>

            {/* Cột phải (1/3): Danh sách Hồ sơ chờ Token hóa (Bước 6) & Đã Token hóa */}
            <div className="space-y-6">
              <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-[#141413] border-b border-[#1B2A24]/12 pb-2.5">
                  Kiểm tra dữ liệu biểu mẫu
                </h3>
                {[
                  { ok: issuerFormValidation.validName, label: "Tên bất động sản hợp lệ" },
                  {
                    ok: issuerFormValidation.validSymbolFormat,
                    label: `Định dạng Mã Symbol hợp lệ: 3–12 ký tự A–Z, 0–9 (${symbolUpper || "—"})`,
                  },
                  {
                    ok: issuerFormValidation.notDuplicateSymbol,
                    label: isDuplicateSymbol
                      ? `Mã Symbol bị trùng với BĐS #${duplicateEstate?.id} (${symbolUpper})`
                      : `Mã Symbol chưa được sử dụng (${symbolUpper || "—"})`,
                  },
                  { ok: issuerFormValidation.validArea, label: `Diện tích > 0 (${estArea} m²)` },
                  {
                    ok: issuerFormValidation.validValuation,
                    label: `Định giá > 0 ($${Number(estValuation || 0).toLocaleString("en-US")})`,
                  },
                  {
                    ok: issuerFormValidation.validShares,
                    label: `Tổng cổ phần nguyên dương (${Number(estShares || 0).toLocaleString(
                      "en-US"
                    )})`,
                  },
                ].map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {v.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2fb344] shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#d63939] shrink-0" />
                    )}
                    <span className={v.ok ? "text-[#141413]" : "text-[#d63939] font-semibold"}>
                      {v.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-3">
                <h2 className="text-sm font-bold text-[#141413] border-b border-[#1B2A24]/12 pb-3">
                  Danh sách Hồ sơ BĐS & Kích hoạt Token hóa (Bước 6)
                </h2>
                <div className="space-y-3 text-xs max-h-[520px] overflow-y-auto pr-1">
                  {estates.map((e) => (
                    <div
                      key={e.id}
                      className="rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#141413]">
                          #{e.id} {e.name} ({e.symbol})
                        </span>
                        <span
                          className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            e.token_address ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20" : "bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20"
                          }`}
                        >
                          {e.token_address ? "Đã Token hóa" : "Sẵn sàng phát hành"}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-[#141413]/55 truncate">
                        docCID: {e.doc_cid}
                      </p>
                      {e.token_address ? (
                        <div className="space-y-1.5">
                          <p className="font-mono text-[11px] text-[#206bc4] truncate">
                            Contract: {e.token_address}
                          </p>
                          <Link
                            href={`/assets/${e.id}`}
                            className="inline-block w-full text-center rounded border border-[#206bc4] text-[#206bc4] hover:bg-[#f0f6ff] px-2.5 py-1.5 font-semibold transition"
                          >
                            Mở bán / Cập nhật Định giá →
                          </Link>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTokenizeConfirmAsset(e)}
                          disabled={busy}
                          className="w-full rounded bg-[#1B2A24] hover:bg-[#14201B] px-3 py-2 font-bold text-white transition"
                        >
                          Bước 6: Xác nhận phát hành cổ phần
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MODAL BƯỚC 3 & 4: PREVIEW TOÀN BỘ THÔNG TIN TRƯỚC KHI ĐĂNG KÝ HỒ SƠ (UC-04) */}
          {issuerPreviewModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="border-b border-[#1B2A24]/12 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#206bc4]">
                      BƯỚC 3 & 4 · PREVIEW HỒ SƠ BẤT ĐỘNG SẢN TRƯỚC KHI LƯU
                    </span>
                    <h3 className="text-base font-bold text-[#141413]">
                      Xem trước & Xác nhận Đăng ký: {estName} ({symbolUpper})
                    </h3>
                  </div>
                  <button
                    onClick={() => setIssuerPreviewModalOpen(false)}
                    className="px-2.5 py-1 rounded border border-[#1B2A24]/14 text-xs font-semibold"
                  >
                    Đóng ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12">
                  <div>
                    <span className="text-[#141413]/55 block">Tên bất động sản:</span>
                    <strong className="text-[#141413]">{estName}</strong>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">Tên Token & Mã Symbol:</span>
                    <strong className="font-mono text-[#206bc4]">
                      {estTokenName} ({symbolUpper})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">Loại hình & Năm xây dựng:</span>
                    <strong className="text-[#141413]">
                      {estKind.toUpperCase()} · Năm {estBuildYear}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">Diện tích & Địa chỉ:</span>
                    <strong className="text-[#141413]">
                      {Number(estArea).toLocaleString("en-US")} m² — {estAddress}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">Tổng định giá ban đầu:</span>
                    <strong className="text-[#2fb344]">
                      ${Number(estValuation).toLocaleString("en-US")} mUSDC
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#141413]/55 block">Tổng số cổ phần & Giá quy đổi:</span>
                    <strong className="text-[#141413]">
                      {Number(estShares).toLocaleString("en-US")} cp ($
                      {(Number(estValuation) / Number(estShares)).toLocaleString("en-US")} mUSDC/cp)
                    </strong>
                  </div>
                  <div className="md:col-span-2 pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block">Hồ sơ pháp lý IPFS:</span>
                    <p className="font-semibold text-[#141413]">{estDocType}</p>
                    <code className="font-mono text-[11px] text-[#206bc4] block">
                      CID: {estDocCid || `QmRWALab${symbolUpper}LegalDeed2026`}
                    </code>
                    <code className="font-mono text-[11px] text-[#141413]/55 block break-all">
                      Keccak-256 Hash: {estDocHash || "Sẽ được tính tự động khi lưu hồ sơ"}
                    </code>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIssuerPreviewModalOpen(false)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 bg-white text-xs font-semibold text-[#141413]"
                  >
                    Quay lại chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRegisterEstate}
                    disabled={busy}
                    className="px-5 py-2 rounded bg-[#1E6B52] hover:bg-[#175540] text-xs font-bold text-white transition"
                  >
                    {busy ? "Đang lưu hồ sơ..." : "Bước 4: Xác nhận Đăng ký Hồ sơ"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL BƯỚC 6: XÁC NHẬN TOKEN HÓA BẰNG ASSETFACTORY.CREATEASSET() */}
          {tokenizeConfirmAsset && (
            <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="border-b border-[#1B2A24]/12 pb-3">
                  <span className="text-[10px] font-bold uppercase text-[#206bc4]">
                    BƯỚC 6 · XÁC NHẬN PHÁT HÀNH SMART CONTRACT
                  </span>
                  <h3 className="text-base font-bold text-[#141413]">
                    Xác nhận phát hành cổ phần cho tài sản {tokenizeConfirmAsset.symbol}
                  </h3>
                </div>

                <div className="space-y-2 text-xs bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Tên bất động sản:</span>
                    <strong className="text-[#141413]">{tokenizeConfirmAsset.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Mã Token:</span>
                    <code className="font-mono font-bold text-[#206bc4]">
                      {tokenizeConfirmAsset.symbol}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Tổng cung đúc:</span>
                    <strong>
                      {Number(tokenizeConfirmAsset.total_shares).toLocaleString("en-US")}{" "}
                      {tokenizeConfirmAsset.symbol}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Định giá khởi tạo:</span>
                    <strong className="text-[#2fb344]">
                      ${Number(tokenizeConfirmAsset.valuation).toLocaleString("en-US")} mUSDC
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block">Mã băm pháp lý gắn bất biến On-chain:</span>
                    <code className="font-mono text-[11px] text-[#141413] break-all">
                      {tokenizeConfirmAsset.doc_hash}
                    </code>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setTokenizeConfirmAsset(null)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 bg-white text-xs font-semibold text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTokenizeExisting(tokenizeConfirmAsset.id)}
                    disabled={busy}
                    className="px-5 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-xs font-bold text-white transition"
                  >
                    {busy ? "Đang triển khai Smart Contract..." : "Xác nhận Ký & Triển khai Token"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          2C. ISSUER TAB 3: QUẢN LÝ MỞ BÁN SƠ CẤP (PHẦN VII)
         ===================================================================== */}
      {role === "issuer" && activeTab === "issuer-sales" && (
        <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
          <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="whitespace-nowrap inline-block bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                QUẢN LÝ ĐỢT MỞ BÁN SƠ CẤP
              </span>
              <h2 className="text-base font-bold text-[#141413]">
                Tổng hợp Tình hình Mở bán Sơ cấp (PrimarySale)
              </h2>
              <p className="text-xs text-[#141413]/55">
                Theo dõi giá bán, số lượng phân phối, tiến độ bán và chuyển đến trang chi tiết để mở bán hoặc đóng bán.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                  <th className="py-2.5 px-5">TÊN TÀI SẢN & SYMBOL</th>
                  <th className="py-2.5 px-4">GIÁ BÁN / CP</th>
                  <th className="py-2.5 px-4">ĐƯA RA BÁN</th>
                  <th className="py-2.5 px-4">ĐÃ BÁN</th>
                  <th className="py-2.5 px-4">CÒN LẠI</th>
                  <th className="py-2.5 px-4">TIẾN ĐỘ BÁN</th>
                  <th className="py-2.5 px-4">TRẠNG THÁI MỞ BÁN</th>
                  <th className="py-2.5 px-5 text-right">ĐIỀU KHIỂN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                {(issuerOverview?.estates || estates).map((e: any) => {
                  const s = e.primary_sale || {};
                  const pct = Number(s.progress_percent || 0);
                  return (
                    <tr key={e.id} className="hover:bg-[#F4F1EA]/75">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#141413]">
                          {e.name}{" "}
                          <span className="font-mono text-[#206bc4]">({e.symbol})</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#141413]/55">
                          {e.token_address || "Chưa phát hành Token"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#141413]">
                        ${Number(s.price_per_share || 0).toLocaleString("en-US")} mUSDC
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {Number(s.total_amount || 0).toLocaleString("en-US")} {e.symbol}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#2fb344]">
                        {Number(s.sold_amount || 0).toLocaleString("en-US")} {e.symbol}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#206bc4]">
                        {Number(s.remaining_amount || 0).toLocaleString("en-US")} {e.symbol}
                      </td>
                      <td className="py-3.5 px-4 w-40">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>${Number(s.raised_usdc || 0).toLocaleString("en-US")}</span>
                          <strong>{pct}%</strong>
                        </div>
                        <div className="w-full h-2 bg-[#eef0f3] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E6B52]"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {!e.token_address ? (
                          <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 text-[10px] font-medium">
                            Sẵn sàng phát hành
                          </span>
                        ) : s.is_open ? (
                          <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                            Đang mở bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#EAE5DA]/85 text-[#141413]/80 ring-1 ring-inset ring-slate-500/20 text-[10px] font-medium">
                            Đã đóng bán
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/assets/${e.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg font-semibold transition"
                        >
                          <span>{s.is_open ? "Quản lý / Đóng bán" : "Thiết lập Mở bán"}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          2D. ISSUER TAB 4: QUẢN LÝ HỒ SƠ PHÁP LÝ IPFS (PHẦN VI)
         ===================================================================== */}
      {role === "issuer" && activeTab === "issuer-docs" && (
        <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
          <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="whitespace-nowrap inline-block bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                KHO HỒ SƠ PHÁP LÝ SỐ
              </span>
              <h2 className="text-base font-bold text-[#141413]">
                Quản lý & Kiểm chứng Hồ sơ Pháp lý Bất động sản (IPFS)
              </h2>
              <p className="text-xs text-[#141413]/55">
                Tra cứu, tải xuống và kiểm chứng tính toàn vẹn mật mã Keccak-256 của toàn bộ tài liệu thuộc quyền quản
                lý của Issuer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={docEstateFilter}
                onChange={(e) => setDocEstateFilter(e.target.value)}
                className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
              >
                <option value="ALL">Lọc theo tài sản: Tất cả</option>
                {estates.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    #{e.id} {e.name} ({e.symbol})
                  </option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên tài liệu, CID, Hash..."
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  className="w-60 pl-3 pr-8 py-1.5 rounded border border-[#1B2A24]/14 text-xs"
                />
                <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                  <th className="py-2.5 px-5">TÀI LIỆU & TÀI SẢN</th>
                  <th className="py-2.5 px-4">IPFS CID</th>
                  <th className="py-2.5 px-4">KECCAK-256 DOCUMENT HASH</th>
                  <th className="py-2.5 px-4">PHIÊN BẢN</th>
                  <th className="py-2.5 px-4">TOÀN VẸN ON-CHAIN</th>
                  <th className="py-2.5 px-5 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                {(issuerOverview?.legal_documents || estates)
                  .filter((d: any) => {
                    const estId = String(d.estate_id || d.id);
                    if (docEstateFilter !== "ALL" && estId !== docEstateFilter) return false;
                    if (!docSearchQuery.trim()) return true;
                    const q = docSearchQuery.toLowerCase();
                    return (
                      (d.estate_name || d.name || "").toLowerCase().includes(q) ||
                      (d.symbol || "").toLowerCase().includes(q) ||
                      (d.doc_cid || "").toLowerCase().includes(q) ||
                      (d.doc_hash || "").toLowerCase().includes(q)
                    );
                  })
                  .map((d: any) => {
                    const eid = d.estate_id || d.id;
                    const verified = d.integrity_verified !== false;
                    return (
                      <tr key={eid} className="hover:bg-[#F4F1EA]/75">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#141413]">
                            {d.doc_name || `Ho_so_Phap_ly_${d.symbol}.docx`}
                          </div>
                          <div className="text-[11px] text-[#141413]/55">
                            Tài sản: <strong>{d.estate_name || d.name}</strong> ({d.symbol}) · Word (.docx)
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#206bc4]">
                          {d.doc_cid}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#141413]">
                          {d.doc_hash ? `${d.doc_hash.slice(0, 20)}...` : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="whitespace-nowrap px-2 py-0.5 rounded bg-[#f0f6ff] text-[#206bc4] text-[10px] font-bold">
                            {d.version || "v1.0 (Genesis)"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {verified ? (
                            <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                              ✓ Đã xác thực
                            </span>
                          ) : (
                            <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 text-[10px] font-medium">
                              ⚠ Không khớp
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewEstateDocId(eid)}
                              className="px-2.5 py-1 rounded border border-[#206bc4]/40 bg-[#f0f6ff] hover:bg-[#e1eeff] font-semibold text-[#206bc4]"
                            >
                              Xem tài liệu IPFS
                            </button>
                            <a
                              href={`${backendBaseUrl}/api/assets/${eid}/document/download`}
                              download={d.doc_name || `Ho_so_Phap_ly_${d.symbol}.docx`}
                              className="px-2.5 py-1 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] font-semibold text-[#141413]"
                            >
                              Tải (.docx)
                            </a>
                            <button
                              type="button"
                              onClick={() => handleVerifyIssuerDocIntegrity(eid)}
                              disabled={busy}
                              className="px-2.5 py-1 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg font-semibold"
                            >
                              Kiểm chứng Hash
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          2E. ISSUER TAB 5: BÁO CÁO PHÁT HÀNH & XUẤT CSV (PHẦN VIII)
         ===================================================================== */}
      {role === "issuer" && activeTab === "issuer-reports" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A24]/12 pb-4">
              <div>
                <span className="whitespace-nowrap inline-block bg-[#1b2434] text-white px-2.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1">
                  BÁO CÁO PHÁT HÀNH & THỐNG KÊ
                </span>
                <h2 className="text-lg font-bold text-[#141413]">
                  Báo cáo Tổng hợp Phát hành, Huy động Vốn & Lịch sử Định giá
                </h2>
                <p className="text-xs text-[#141413]/55">
                  Dữ liệu kết xuất trực tiếp từ PostgreSQL/SQLite và các hợp đồng thông minh trên Anvil.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportIssuerReportCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#1E6B52] hover:bg-[#175540] text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Xuất Báo cáo CSV (Excel UTF-8)</span>
              </button>
            </div>

            {/* Bảng 1: Báo cáo danh sách BĐS đã phát hành & tình hình bán sơ cấp */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#141413]">
                1. Báo cáo Danh mục Bất động sản Phát hành & Kết quả Bán Sơ cấp
              </h3>
              <div className="overflow-x-auto border border-[#1B2A24]/12 rounded">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                      <th className="py-2.5 px-4">MÃ BĐS</th>
                      <th className="py-2.5 px-4">TÊN TÀI SẢN</th>
                      <th className="py-2.5 px-4">TỔNG ĐỊNH GIÁ</th>
                      <th className="py-2.5 px-4">TOKEN PHÁT HÀNH</th>
                      <th className="py-2.5 px-4">ĐÃ BÁN SƠ CẤP</th>
                      <th className="py-2.5 px-4 text-right">TIỀN HUY ĐỘNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                    {(issuerOverview?.estates || estates).map((e: any) => {
                      const s = e.primary_sale || {};
                      return (
                        <tr key={e.id} className="hover:bg-[#F4F1EA]/75">
                          <td className="py-3 px-4 font-mono font-bold text-[#206bc4]">
                            {e.symbol}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#141413]">{e.name}</td>
                          <td className="py-3 px-4">
                            ${Number(e.valuation).toLocaleString("en-US")} mUSDC
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {Number(e.total_shares).toLocaleString("en-US")} {e.symbol}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#2fb344]">
                            {Number(s.sold_amount || 0).toLocaleString("en-US")} {e.symbol} (
                            {s.progress_percent || 0}%)
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#2fb344]">
                            ${Number(s.raised_usdc || 0).toLocaleString("en-US")} mUSDC
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bảng 2: Báo cáo Lịch sử thay đổi định giá */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold text-[#141413]">
                2. Báo cáo Lịch sử Thay đổi Định giá
              </h3>
              <div className="overflow-x-auto border border-[#1B2A24]/12 rounded">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                      <th className="py-2.5 px-4">THỜI GIAN</th>
                      <th className="py-2.5 px-4">TÀI SẢN</th>
                      <th className="py-2.5 px-4">ĐỊNH GIÁ CŨ → MỚI</th>
                      <th className="py-2.5 px-4">CĂN CỨ & GHI CHÚ</th>
                      <th className="py-2.5 px-4 text-right">TX HASH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                    {(issuerOverview?.valuation_logs || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#141413]/55">
                          Chưa có bản ghi thay đổi định giá mới ngoài định giá khởi tạo Genesis.
                        </td>
                      </tr>
                    ) : (
                      (issuerOverview?.valuation_logs || []).map((v: any) => (
                        <tr key={v.id} className="hover:bg-[#F4F1EA]/75">
                          <td className="py-3 px-4 text-[#141413]/55">{formatDate(v.signed_at)}</td>
                          <td className="py-3 px-4 font-bold text-[#141413]">
                            {v.estate_name} ({v.symbol})
                          </td>
                          <td className="py-3 px-4 tabular-nums">
                            {Number(v.old_valuation) === Number(v.new_valuation) ? (
                              <strong className="text-[#141413]">
                                ${Number(v.new_valuation).toLocaleString("en-US")} mUSDC
                              </strong>
                            ) : (
                              <>
                                <span className="text-[#141413]/45 line-through mr-1">
                                  ${Number(v.old_valuation).toLocaleString("en-US")}
                                </span>
                                <strong className="text-[#1E6B52]">
                                  → ${Number(v.new_valuation).toLocaleString("en-US")} mUSDC
                                </strong>
                              </>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#141413]">
                            {v.basis} — <span className="text-[#141413]/55">{v.notes}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-[#206bc4]">
                            {v.tx_hash?.slice(0, 14)}...
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. ADMIN TAB 1: TỔNG QUAN QUẢN TRỊ HỆ THỐNG RWA
         ===================================================================== */}
      {role === "admin" && activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#141413]">
              Tổng quan Quản trị Hệ thống
            </h1>
            <p className="text-[13px] text-[#141413]/55 mt-0.5">
              Giám sát tài sản RWA, tiến độ huy động vốn, giao dịch On-chain và tuân thủ KYC trên mạng Anvil
            </p>
          </div>

          {/* Hàng 1: 4 Thẻ KPI Tổng quan chuẩn Fintech / Web3 */}
          {(() => {
            const totalValuationUsdc = assetsListForAdmin.reduce(
              (acc: number, e: any) => acc + Number(e.valuation || 0),
              0
            );
            const totalAssetsCount = overviewData?.kpis?.total_assets ?? assetsListForAdmin.length;
            const totalTokensIssued = Number(
              overviewData?.kpis?.total_tokens_issued ??
                assetsListForAdmin.reduce((acc: number, e: any) => acc + Number(e.total_shares || 0), 0)
            );
            const openSalesCount = assetsListForAdmin.filter(
              (e: any) => Boolean(e.primary_sale?.is_open)
            ).length;
            const activeContractsCount =
              overviewData?.kpis?.active_assets ??
              assetsListForAdmin.filter((e: any) => e.token_address && !e.is_paused).length;
            const pausedCount = Number(overviewData?.kpis?.paused_assets || 0);
            const totalTxCount = Number(overviewData?.kpis?.total_transactions ?? 0);
            const totalInvestorsCount = Number(
              overviewData?.kpis?.total_investors ??
                labAccounts.filter((a) => a.role_label === "investor").length
            );
            const pendingKycCount = kycList.filter(
              (k: any) => k.status === "pending" || k.status === "under_review"
            ).length;
            const verifiedWalletsCount = Number(
              overviewData?.kpis?.kyc_verified_wallets ??
                labAccounts.filter((a) => a.is_whitelisted).length
            );

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* KPI 1: Tổng giá trị RWA */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-medium text-[#141413]/55 block">
                      Tổng giá trị RWA
                    </span>
                    <div className="text-2xl font-bold text-[#141413] tabular-nums tracking-tight whitespace-nowrap">
                      ${totalValuationUsdc.toLocaleString("en-US")}
                    </div>
                    <p className="text-xs text-[#141413]/55 tabular-nums">
                      {totalAssetsCount} tài sản · {totalTokensIssued.toLocaleString("en-US")} cổ phần
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#EEF2F0] text-[#1B2A24] flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>

                {/* KPI 2: BĐS đang mở bán */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-medium text-[#141413]/55 block">
                      BĐS đang mở bán
                    </span>
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-2xl font-bold text-[#141413] tracking-tight">
                        {openSalesCount} / {totalAssetsCount}
                      </span>
                      {pausedCount > 0 && (
                        <StatusBadge variant="danger" dot>
                          {pausedCount} Tạm dừng
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-xs text-[#141413]/55 tabular-nums">
                      {activeContractsCount} hợp đồng AssetToken hoạt động
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#E9F4EF] text-[#1E6B52] flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>

                {/* KPI 3: Giao dịch On-chain */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-medium text-[#141413]/55 block">
                      Giao dịch On-chain
                    </span>
                    <div className="text-2xl font-bold text-[#141413] tabular-nums tracking-tight">
                      {totalTxCount.toLocaleString("en-US")}
                    </div>
                    <p className="text-xs text-[#141413]/55 tabular-nums">
                      {totalInvestorsCount} nhà đầu tư trên tổng {overviewData?.kpis?.total_users ?? labAccounts.length} ví
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#F8EFE2] text-[#B8844A] flex items-center justify-center shrink-0">
                    <Repeat className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>

                {/* KPI 4: Hồ sơ KYC chờ duyệt */}
                <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-medium text-[#141413]/55 block">
                      Hồ sơ KYC chờ duyệt
                    </span>
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-2xl font-bold text-[#141413] tracking-tight">
                        {pendingKycCount.toLocaleString("en-US")}
                      </span>
                      <StatusBadge variant={pendingKycCount > 0 ? "warning" : "success"} dot>
                        {pendingKycCount > 0 ? "Cần thẩm định" : "Đã xử lý hết"}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-[#141413]/55 tabular-nums">
                      {verifiedWalletsCount} ví đã ghi Whitelist IdentityRegistry
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#F8EFE2] text-[#B8844A] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Hàng 2: Cảnh báo hệ thống + Trạng thái kết nối Blockchain */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#1B2A24]/8 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
                  <h2 className="text-base font-semibold text-[#141413]">
                    Cảnh báo hệ thống &amp; Bảo mật
                  </h2>
                </div>
                <span className="text-xs text-[#141413]/55">
                  Kiểm tra trực tiếp từ Smart Contract &amp; DB
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {(overviewData?.system_alerts || []).map((al: any, idx: number) => {
                  const style =
                    al.level === "critical"
                      ? "border-[#A63A3A]/22 bg-[#FBF0F0] text-[#A63A3A]"
                      : al.level === "warning"
                      ? "border-[#B8844A]/30 bg-[#F8EFE2] text-[#8F622C]"
                      : al.level === "info"
                      ? "border-[#1B2A24]/18 bg-[#EEF2F0] text-[#1B2A24]"
                      : "border-[#1E6B52]/22 bg-[#E9F4EF] text-[#1E6B52]";
                  return (
                    <div key={idx} className={`p-3.5 rounded-xl border ${style}`}>
                      <div className="font-semibold">{al.title}</div>
                      <p className="mt-0.5 opacity-90 leading-relaxed">{al.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#1B2A24]/8 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#1B2A24]" strokeWidth={1.75} />
                  <h2 className="text-base font-semibold text-[#141413]">
                    Trạng thái Kết nối Blockchain
                  </h2>
                </div>
                {overviewData?.blockchain_status?.connected !== false ? (
                  <StatusBadge variant="success" dot>
                    Đã kết nối
                  </StatusBadge>
                ) : (
                  <StatusBadge variant="danger" dot>
                    Mất kết nối
                  </StatusBadge>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-[#1B2A24]/8">
                  <span className="text-[#141413]/55">RPC Endpoint:</span>
                  <code className="font-mono font-medium text-[#141413]">
                    {overviewData?.blockchain_status?.rpc_url || "http://127.0.0.1:8545"}
                  </code>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1B2A24]/8">
                  <span className="text-[#141413]/55">Chain ID:</span>
                  <strong className="font-mono font-semibold text-[#141413] tabular-nums">
                    {overviewData?.blockchain_status?.chain_id || 31337} (Foundry Anvil)
                  </strong>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1B2A24]/8">
                  <span className="text-[#141413]/55">Block hiện tại:</span>
                  <strong className="font-mono font-semibold text-[#1B2A24] tabular-nums">
                    #{overviewData?.blockchain_status?.block_number ?? "—"}
                  </strong>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1B2A24]/8">
                  <span className="text-[#141413]/55">Giá Gas:</span>
                  <span className="font-mono text-[#141413] tabular-nums">
                    {overviewData?.blockchain_status?.gas_price_gwei ?? 1.0} Gwei
                  </span>
                </div>
                <div className="pt-1.5">
                  <button
                    onClick={() => switchTab("monitoring")}
                    className="w-full py-2 rounded-lg border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-[#141413]/80 font-medium text-center shadow-xs transition-colors"
                  >
                    Xem chi tiết Giám sát Hệ thống →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hàng 3: Tài sản mới đăng ký / phát hành & Danh sách giao dịch gần đây */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Tài sản RWA đã đăng ký & Phát hành Token */}
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1B2A24]/8 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[#141413]">
                    Tài sản RWA đã đăng ký &amp; Phát hành Token
                  </h2>
                  <p className="text-[13px] text-[#141413]/55">
                    Trạng thái trực tiếp từ hợp đồng AssetToken trên Anvil
                  </p>
                </div>
                <button
                  onClick={() => switchTab("pause")}
                  className="text-xs font-medium text-[#1B2A24] hover:text-[#1B2A24] whitespace-nowrap shrink-0 transition-colors"
                >
                  Quản lý Tạm dừng →
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                      <th className="py-3 px-4">Tài sản</th>
                      <th className="py-3 px-3 whitespace-nowrap">Contract</th>
                      <th className="py-3 px-3 whitespace-nowrap">Tổng cung</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-sm">
                    {assetsListForAdmin.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-[#141413]/55">
                          Chưa có tài sản RWA nào được đăng ký.
                        </td>
                      </tr>
                    ) : (
                      assetsListForAdmin.slice(0, 6).map((a: any) => (
                        <tr key={a.id} className="hover:bg-[#F4F1EA]/75 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#141413]">
                              {a.name} ({a.symbol})
                            </div>
                            <div className="text-xs text-[#141413]/55 whitespace-nowrap tabular-nums">
                              Định giá: ${Number(a.valuation || 0).toLocaleString("en-US")}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {a.token_address ? (
                              <CopyAddress address={a.token_address} chars={4} />
                            ) : (
                              <span className="text-xs text-[#141413]/45">Chưa Token hóa</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-[#141413] whitespace-nowrap tabular-nums">
                            {Number(a.total_shares || 0).toLocaleString("en-US")} {a.symbol}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {!a.token_address ? (
                              <StatusBadge variant="warning" dot>
                                Sẵn sàng phát hành
                              </StatusBadge>
                            ) : a.is_paused ? (
                              <StatusBadge variant="danger" dot>
                                Tạm dừng
                              </StatusBadge>
                            ) : (
                              <StatusBadge variant="success" dot>
                                Hoạt động
                              </StatusBadge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Danh sách giao dịch gần đây */}
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1B2A24]/8 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[#141413]">
                    Danh sách Giao dịch Gần đây
                  </h2>
                  <p className="text-[13px] text-[#141413]/55">
                    Đồng bộ từ sự kiện Phát hành Token, Mua sơ cấp, P2P &amp; Marketplace
                  </p>
                </div>
                <Link
                  href="/wallet"
                  className="text-xs font-medium text-[#1B2A24] hover:text-[#1B2A24] whitespace-nowrap shrink-0 transition-colors"
                >
                  Xem sổ cái →
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                      <th className="py-3 px-4 whitespace-nowrap">Loại</th>
                      <th className="py-3 px-3 whitespace-nowrap">Từ ví → Đến ví</th>
                      <th className="py-3 px-3 whitespace-nowrap">Số lượng</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Block / Tx</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1B2A24]/8 text-sm">
                    {(overviewData?.recent_transactions || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-[#141413]/55">
                          Chưa có giao dịch chuyển nhượng nào.
                        </td>
                      </tr>
                    ) : (
                      (overviewData?.recent_transactions || []).slice(0, 6).map((tx: any) => {
                        const fromInfo = resolveAddressLabel(tx.from_address);
                        const toInfo = resolveAddressLabel(tx.to_address);
                        const hasFriendlyNames = Boolean(fromInfo.label || toInfo.label);
                        return (
                          <tr key={tx.id} className="hover:bg-[#F4F1EA]/75 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <StatusBadge
                                variant={
                                  tx.event_type === "FORCED_TRANSFER"
                                    ? "purple"
                                    : tx.event_type === "PRIMARY_BUY"
                                    ? "success"
                                    : "info"
                                }
                              >
                                {formatEventTypeLabel(tx.event_type)}
                              </StatusBadge>
                            </td>
                            <td className="py-3.5 px-3">
                              {hasFriendlyNames && (
                                <div className="text-xs font-medium text-[#141413] whitespace-nowrap">
                                  {fromInfo.label || fromInfo.short} → {toInfo.label || toInfo.short}
                                </div>
                              )}
                              <div
                                className="font-mono text-[11px] text-[#141413]/55 whitespace-nowrap"
                                title={`${fromInfo.full} → ${toInfo.full}`}
                              >
                                {fromInfo.short} → {toInfo.short}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-medium text-[#141413] whitespace-nowrap tabular-nums">
                              {Number(tx.amount).toLocaleString("en-US")} {tx.symbol}
                            </td>
                            <td
                              className="py-3.5 px-4 text-right font-mono text-xs text-[#141413]/55 whitespace-nowrap tabular-nums"
                              title={tx.tx_hash}
                            >
                              #{tx.block_number} · {tx.tx_hash?.slice(0, 8)}...
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Hàng 4: Hoạt động quản trị gần đây */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1B2A24]/8 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#141413]">
                  Hoạt động quản trị &amp; Ký số gần đây
                </h2>
                <p className="text-[13px] text-[#141413]/55">
                  Nhấp vào bất kỳ bản ghi nào để xem chi tiết tham số giao dịch và Transaction Hash
                </p>
              </div>
              <button
                onClick={() => switchTab("audit")}
                className="text-xs font-medium text-[#1B2A24] hover:text-[#1B2A24] whitespace-nowrap shrink-0 transition-colors"
              >
                Xem toàn bộ Nhật ký →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                    <th className="py-3 px-4 whitespace-nowrap">Thời gian</th>
                    <th className="py-3 px-4 whitespace-nowrap">Người thực hiện</th>
                    <th className="py-3 px-4 whitespace-nowrap">Hành động</th>
                    <th className="py-3 px-4 whitespace-nowrap">Đối tượng</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tx Hash</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-sm">
                  {auditSigns.slice(0, 6).map((a) => {
                    const act = classifyAuditAction(a.contract_method || "");
                    const targetInfo = extractAuditTargetInfo(a);
                    const isFailed = (a.status || "SUCCESS").toUpperCase() === "FAILED";
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedAuditDetail(a)}
                        className="hover:bg-[#F4F1EA]/75 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 text-xs text-[#141413]/55 whitespace-nowrap tabular-nums">
                          {formatDate(a.signed_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#141413] whitespace-nowrap">
                            {a.signer_name || a.role_label?.toUpperCase()}
                          </div>
                          {a.signer_address && <CopyAddress address={a.signer_address} />}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#141413] text-xs">
                            {act.label}
                          </div>
                          <div className="font-mono text-[11px] text-[#141413]/55 mt-0.5">
                            {a.contract_method}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {targetInfo.title && (
                            <div className="font-medium text-[#141413] whitespace-nowrap">
                              {targetInfo.title}
                              {targetInfo.subtitle && (
                                <span className="ml-1.5 text-xs font-normal text-[#141413]/55">
                                  ({targetInfo.subtitle})
                                </span>
                              )}
                            </div>
                          )}
                          {targetInfo.address && <CopyAddress address={targetInfo.address} />}
                        </td>
                        <td
                          className="py-3.5 px-4 whitespace-nowrap"
                          title={a.tx_hash}
                        >
                          {String(a.tx_hash || "").startsWith("OFFCHAIN_") ? (
                            <span className="inline-flex items-center rounded-full bg-[#EAE5DA]/85 text-[#141413]/65 ring-1 ring-inset ring-slate-500/20 px-2.5 py-0.5 text-[11px] font-medium">
                              Ghi nhận Off-chain
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-[#1B2A24]">
                              {a.tx_hash?.slice(0, 12)}...
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <StatusBadge variant={isFailed ? "danger" : "success"} dot>
                            {isFailed ? "Thất bại" : "Thành công"}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. ADMIN TAB 2: NÂNG CẤP EMERGENCY PAUSE (YÊU CẦU 3)
         ===================================================================== */}
      {role === "admin" && activeTab === "pause" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1B2A24]/12 pb-4">
              <div>
                <span className="whitespace-nowrap inline-block bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  EMERGENCY CIRCUIT BREAKER
                </span>
                <h2 className="text-lg font-bold text-[#141413]">
                  Quản lý Tạm dừng Khẩn cấp Hợp đồng Tài sản
                </h2>
                <p className="text-xs text-[#141413]/55 mt-0.5">
                  Khi hợp đồng ở trạng thái <code>Paused</code>, hàm <code>_update</code> trong Smart Contract sẽ từ chối
                  toàn bộ giao dịch chuyển nhượng sơ cấp, thứ cấp và P2P để bảo vệ tài sản.
                </p>
              </div>

              <div className="bg-[#F4F1EA]/80 border border-[#1B2A24]/14 rounded px-3.5 py-2 text-xs">
                <span className="text-[#141413]/55 block text-[10px] uppercase font-bold">
                  Ví Admin đang kết nối ký lệnh:
                </span>
                <code className="font-mono font-bold text-[#141413]">
                  {currentUser?.address}
                </code>
              </div>
            </div>

            {/* Chọn hợp đồng & Thẻ thông tin trạng thái chi tiết */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#141413] mb-1.5">
                    Chọn Tài sản RWA / Hợp đồng AssetToken cần thao tác:
                  </label>
                  <select
                    value={selectedTokenAddr}
                    onChange={(e) => setSelectedTokenAddr(e.target.value)}
                    className="w-full rounded border border-[#1B2A24]/14 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#141413] focus:border-[#206bc4] focus:outline-none"
                  >
                    {assetsListForAdmin
                      .filter((e: any) => e.token_address)
                      .map((e: any) => (
                        <option key={e.id} value={e.token_address}>
                          [{e.symbol}] {e.name} — {e.token_address} (
                          {e.is_paused ? "Tạm dừng" : "Hoạt động"})
                        </option>
                      ))}
                  </select>
                </div>

                {currentSelectedAsset && (
                  <div className="rounded-xl border border-[#1B2A24]/12 bg-[#F4F1EA]/80 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#141413]/55 block">Tên Tài sản & Mã Token:</span>
                      <strong className="text-sm text-[#141413]">
                        {currentSelectedAsset.name} ({currentSelectedAsset.symbol})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Trạng thái Hợp đồng Hiện tại:</span>
                      <div className="mt-1">
                        {currentSelectedAsset.is_paused ? (
                          <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 font-medium text-xs">
                            <Lock className="w-3.5 h-3.5" />
                            ĐANG TẠM DỪNG KHẨN CẤP
                          </span>
                        ) : (
                          <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 font-medium text-xs">
                            <Unlock className="w-3.5 h-3.5" />
                            ĐANG HOẠT ĐỘNG BÌNH THƯỜNG
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Địa chỉ Smart Contract (AssetToken):</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <code className="font-mono font-bold text-[#206bc4] break-all">
                          {currentSelectedAsset.token_address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(currentSelectedAsset.token_address)}
                          className="p-1 rounded hover:bg-slate-200 text-[#141413]/55"
                          title="Copy địa chỉ hợp đồng"
                        >
                          {copiedText === currentSelectedAsset.token_address ? (
                            <Check className="w-3.5 h-3.5 text-[#2fb344]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Người thực hiện thao tác gần nhất:</span>
                      <strong className="text-[#141413] block">
                        {currentSelectedAsset.last_actor_name || "Quản trị viên (Admin #0)"}
                      </strong>
                      <code className="font-mono text-[11px] text-[#141413]/55">
                        {currentSelectedAsset.last_actor || currentUser?.address}
                      </code>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Thời gian thao tác gần nhất:</span>
                      <strong className="text-[#141413]">
                        {formatDate(currentSelectedAsset.last_action_at)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Hành động & TxHash gần nhất:</span>
                      <code className="font-mono text-[11px] text-[#141413]">
                        {currentSelectedAsset.last_action || "AssetFactory.createAsset"}{" "}
                        {currentSelectedAsset.last_tx_hash
                          ? `(${currentSelectedAsset.last_tx_hash.slice(0, 14)}...)`
                          : ""}
                      </code>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#141413] mb-1">
                    Ghi chú / Lý do thực hiện (Lưu vào Nhật ký Kiểm toán Audit Log):
                  </label>
                  <input
                    type="text"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="Nhập lý do tạm dừng hoặc mở lại hợp đồng..."
                    className="w-full rounded border border-[#1B2A24]/14 bg-white px-3.5 py-2 text-xs text-[#141413]"
                  />
                </div>

                {/* 2 Nút hành động chính mở Modal Xác nhận */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => openPauseConfirmation(selectedTokenAddr, true)}
                    disabled={busy || !selectedTokenAddr || currentSelectedAsset?.is_paused}
                    className="inline-flex items-center justify-center gap-2 rounded bg-[#A63A3A] hover:bg-[#8A2E2E] disabled:opacity-50 px-5 py-3 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Tạm dừng hợp đồng (AssetToken)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPauseConfirmation(selectedTokenAddr, false)}
                    disabled={busy || !selectedTokenAddr || !currentSelectedAsset?.is_paused}
                    className="inline-flex items-center justify-center gap-2 rounded bg-[#1E6B52] hover:bg-[#175540] disabled:opacity-50 px-5 py-3 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Khôi phục hợp đồng (AssetToken)</span>
                  </button>
                </div>
              </div>

              {/* Hộp hiển thị Kết quả Giao dịch vừa thực hiện */}
              <div className="rounded-xl border border-[#1B2A24]/12 bg-[#F4F1EA]/80 p-4 space-y-3 text-xs">
                <h3 className="font-bold text-[#141413] border-b border-[#1B2A24]/12 pb-2 flex items-center justify-between">
                  <span>Kết quả Giao dịch Gần nhất</span>
                  {lastPauseTxResult && (
                    <span className="whitespace-nowrap px-2 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                      Đã xác nhận
                    </span>
                  )}
                </h3>

                {!lastPauseTxResult ? (
                  <p className="text-[#141413]/55 py-6 text-center">
                    Chọn hợp đồng và nhấn <strong>Tạm dừng</strong> hoặc <strong>Khôi phục</strong> để xem
                    biên lai giao dịch Blockchain tại đây.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[#141413]/55 block">Hợp đồng cập nhật:</span>
                      <strong className="text-[#141413]">
                        {lastPauseTxResult.asset_name} ({lastPauseTxResult.symbol})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Trạng thái mới sau giao dịch:</span>
                      <span
                        className={`whitespace-nowrap inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          lastPauseTxResult.is_paused ? "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20" : "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                        }`}
                      >
                        {lastPauseTxResult.is_paused ? "Tạm dừng" : "Hoạt động"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#141413]/55 block">Transaction Hash:</span>
                      <code className="font-mono text-[11px] text-[#206bc4] break-all">
                        {lastPauseTxResult.tx_hash}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#141413]/55">Block Number:</span>
                      <strong className="font-mono">#{lastPauseTxResult.block_number}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#141413]/55">Thời gian:</span>
                      <span>{formatDate(lastPauseTxResult.timestamp)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bảng tổng hợp trạng thái toàn bộ các hợp đồng AssetToken */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
            <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141413]">
                Bảng Trạng thái Toàn bộ Hợp đồng Tài sản
              </h3>
              <span className="text-xs text-[#141413]/55">
                Tổng số: {assetsListForAdmin.filter((a: any) => a.token_address).length} hợp đồng
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                    <th className="py-2.5 px-5">TÊN TÀI SẢN</th>
                    <th className="py-2.5 px-4">SMART CONTRACT</th>
                    <th className="py-2.5 px-4">TRẠNG THÁI</th>
                    <th className="py-2.5 px-4">NGƯỜI THỰC HIỆN GẦN NHẤT</th>
                    <th className="py-2.5 px-4">THỜI GIAN CẬP NHẬT</th>
                    <th className="py-2.5 px-5 text-right">THAO TÁC NHANH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                  {assetsListForAdmin
                    .filter((a: any) => a.token_address)
                    .map((a: any) => (
                      <tr key={a.id} className="hover:bg-[#F4F1EA]/75">
                        <td className="py-3.5 px-5 font-bold text-[#141413]">
                          {a.name} ({a.symbol})
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#206bc4] whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <span title={a.token_address}>{shortAddr(a.token_address)}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(a.token_address)}
                              title="Sao chép địa chỉ hợp đồng"
                              className="p-0.5 rounded hover:bg-slate-200 text-[#141413]/55 hover:text-[#206bc4] transition"
                            >
                              {copiedText === a.token_address ? (
                                <Check className="w-3 h-3 text-[#2fb344]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {a.is_paused ? (
                            <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 text-[11px] font-medium">
                              Tạm dừng
                            </span>
                          ) : (
                            <span className="inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[11px] font-medium">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#141413] whitespace-nowrap">{a.last_actor_name}</div>
                          <div className="font-mono text-[11px] text-[#141413]/55 whitespace-nowrap" title={a.last_actor}>
                            {shortAddr(a.last_actor)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#141413]/55 whitespace-nowrap">
                          {formatDate(a.last_action_at)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {a.is_paused ? (
                            <button
                              onClick={() => {
                                setSelectedTokenAddr(a.token_address);
                                openPauseConfirmation(a.token_address, false);
                              }}
                              disabled={busy}
                              className="px-3 py-1 rounded bg-[#1E6B52] hover:bg-[#175540] text-white rounded-lg font-semibold whitespace-nowrap transition"
                            >
                              Khôi phục
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTokenAddr(a.token_address);
                                openPauseConfirmation(a.token_address, true);
                              }}
                              disabled={busy}
                              className="px-3 py-1 rounded bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] rounded-lg font-semibold whitespace-nowrap transition"
                            >
                              Tạm dừng
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL XÁC NHẬN PAUSE / UNPAUSE */}
          {pauseConfirmModal && pauseConfirmModal.open && (
            <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#1B2A24]/12 pb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      pauseConfirmModal.targetPaused ? "bg-[#FBF0F0] text-[#A63A3A]" : "bg-[#E9F4EF] text-[#1E6B52]"
                    }`}
                  >
                    {pauseConfirmModal.targetPaused ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Unlock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#141413]/55">
                      XÁC NHẬN THAO TÁC QUẢN TRỊ KHẨN CẤP
                    </span>
                    <h3 className="text-base font-bold text-[#141413]">
                      {pauseConfirmModal.targetPaused
                        ? "Tạm dừng hợp đồng AssetToken"
                        : "Khôi phục hợp đồng AssetToken"}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#141413]/55">Tên hợp đồng:</span>
                    <strong className="text-[#141413] text-right">
                      {pauseConfirmModal.assetName} ({pauseConfirmModal.symbol})
                    </strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#141413]/55">Địa chỉ Smart Contract:</span>
                    <code className="font-mono text-[#206bc4]">
                      {pauseConfirmModal.tokenAddress}
                    </code>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#141413]/55">Hành động chuẩn bị thực hiện:</span>
                    <code className="font-mono font-bold text-[#141413]">
                      {pauseConfirmModal.targetPaused
                        ? "AssetToken.pause()"
                        : "AssetToken.unpause()"}
                    </code>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#141413]/55">Ví Admin đang kết nối:</span>
                    <code className="font-mono text-[#141413]">{currentUser?.address}</code>
                  </div>
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block font-semibold mb-1">
                      Tác động của hành động:
                    </span>
                    <p
                      className={`p-2.5 rounded font-medium ${
                        pauseConfirmModal.targetPaused
                          ? "bg-[#d63939]/10 text-[#b02a37]"
                          : "bg-[#2fb344]/10 text-[#1E6B52]"
                      }`}
                    >
                      {pauseConfirmModal.targetPaused
                        ? "CẢNH BÁO: Toàn bộ giao dịch mua sơ cấp, mua bán trên Marketplace và chuyển nhượng P2P của token này sẽ bị khóa ngay lập tức bởi modifier whenNotPaused trong hàm _update."
                        : "THÔNG BÁO: Hợp đồng sẽ hoạt động trở lại bình thường, cho phép nhà đầu tư đã KYC giao dịch và chuyển nhượng token."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPauseConfirmModal(null)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-semibold text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={executeConfirmedPause}
                    disabled={busy}
                    className={`px-4 py-2 rounded text-xs font-bold text-white transition ${
                      pauseConfirmModal.targetPaused
                        ? "bg-[#A63A3A] hover:bg-[#8A2E2E]"
                        : "bg-[#1E6B52] hover:bg-[#175540]"
                    }`}
                  >
                    {busy
                      ? "Đang ký & gửi lên Anvil..."
                      : `Xác nhận ${pauseConfirmModal.targetPaused ? "Tạm dừng" : "Khôi phục"}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          5. ADMIN TAB 3: NÂNG CẤP FORCED TRANSFER (YÊU CẦU 4)
         ===================================================================== */}
      {role === "admin" && activeTab === "forced-transfer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái (2/3): Form nhập & kiểm tra trực tiếp chủ ví */}
            <div className="lg:col-span-2 bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-5">
              <div className="border-b border-[#1B2A24]/12 pb-3.5">
                <span className="whitespace-nowrap inline-block bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  FORCED TRANSFER ENFORCEMENT
                </span>
                <h2 className="text-lg font-bold text-[#141413]">
                  Khôi phục & Chuyển quyền cổ phần
                </h2>
                <p className="text-xs text-[#141413]/55 mt-0.5">
                  Thu hồi cổ phần từ địa chỉ ví vi phạm / mất khóa riêng và chuyển sang địa chỉ ví nhận đã được xác minh
                  KYC trong <code>IdentityRegistry</code>.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Chọn tài sản / hợp đồng */}
                <div>
                  <label className="block font-bold text-[#141413] mb-1">
                    1. Chọn Tài sản RWA / Hợp đồng AssetToken (*):
                  </label>
                  <select
                    value={selectedTokenAddr}
                    onChange={(e) => setSelectedTokenAddr(e.target.value)}
                    className="w-full rounded border border-[#1B2A24]/14 bg-white px-3.5 py-2.5 font-semibold text-[#141413]"
                  >
                    {assetsListForAdmin
                      .filter((e: any) => e.token_address)
                      .map((e: any) => (
                        <option key={e.id} value={e.token_address}>
                          [{e.symbol}] {e.name} — Contract: {e.token_address}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Địa chỉ ví gửi (From) + Thẻ thông tin chủ ví */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#141413]">
                        2. Địa chỉ Ví gửi bị thu hồi (*):
                      </label>
                      <select
                        aria-label="Chọn nhanh ví gửi"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setForcedFromAddr(e.target.value);
                        }}
                        className="text-[11px] border border-[#1B2A24]/14 rounded px-2 py-0.5 bg-[#F4F1EA]/80 text-[#206bc4] font-semibold"
                      >
                        <option value="">+ Chọn nhanh ví Lab</option>
                        {labAccounts.map((a) => (
                          <option key={a.address} value={a.address}>
                            {a.display_name} ({a.address.slice(0, 6)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      value={forcedFromAddr}
                      onChange={(e) => setForcedFromAddr(e.target.value)}
                      placeholder="0x..."
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-mono text-[#141413]"
                    />

                    {/* Thẻ hiển thị dữ liệu ví gửi (From) */}
                    {fromWalletInfo && (
                      <div
                        className={`p-3 rounded border space-y-1 ${
                          fromWalletInfo.is_valid
                            ? "border-[#1B2A24]/14 bg-[#F4F1EA]/80"
                            : "border-[#d63939]/40 bg-[#d63939]/5 text-[#b02a37]"
                        }`}
                      >
                        {!fromWalletInfo.is_valid ? (
                          <p className="font-semibold">{fromWalletInfo.error}</p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">Chủ ví gửi:</span>
                              <strong className="text-[#141413]">
                                {fromWalletInfo.display_name}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">
                                Số dư {fromWalletInfo.selected_token_symbol}:
                              </span>
                              <strong className="text-[#206bc4] font-mono">
                                {Number(fromWalletInfo.selected_token_balance).toLocaleString(
                                  "en-US"
                                )}{" "}
                                {fromWalletInfo.selected_token_symbol}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">Trạng thái KYC:</span>
                              <span
                                className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  fromWalletInfo.is_kyc_verified ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20" : "bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20"
                                }`}
                              >
                                {fromWalletInfo.is_kyc_verified ? "Đã duyệt KYC" : "Chưa duyệt KYC"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">Trạng thái Ví:</span>
                              <span
                                className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  fromWalletInfo.is_frozen ? "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20" : "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18"
                                }`}
                              >
                                {fromWalletInfo.wallet_status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Địa chỉ ví nhận (To) + Thẻ thông tin chủ ví */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#141413]">
                        3. Địa chỉ Ví nhận khôi phục (*):
                      </label>
                      <select
                        aria-label="Chọn nhanh ví nhận"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) setForcedToAddr(e.target.value);
                        }}
                        className="text-[11px] border border-[#1B2A24]/14 rounded px-2 py-0.5 bg-[#F4F1EA]/80 text-[#206bc4] font-semibold"
                      >
                        <option value="">+ Chọn nhanh ví Lab</option>
                        {labAccounts.map((a) => (
                          <option key={a.address} value={a.address}>
                            {a.display_name} ({a.address.slice(0, 6)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      value={forcedToAddr}
                      onChange={(e) => setForcedToAddr(e.target.value)}
                      placeholder="0x..."
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-mono text-[#141413]"
                    />

                    {/* Thẻ hiển thị dữ liệu ví nhận (To) */}
                    {toWalletInfo && (
                      <div
                        className={`p-3 rounded border space-y-1 ${
                          toWalletInfo.is_valid
                            ? "border-[#1B2A24]/14 bg-[#F4F1EA]/80"
                            : "border-[#d63939]/40 bg-[#d63939]/5 text-[#b02a37]"
                        }`}
                      >
                        {!toWalletInfo.is_valid ? (
                          <p className="font-semibold">{toWalletInfo.error}</p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">Chủ ví nhận:</span>
                              <strong className="text-[#141413]">
                                {toWalletInfo.display_name}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">
                                Số dư {toWalletInfo.selected_token_symbol}:
                              </span>
                              <strong className="text-[#206bc4] font-mono">
                                {Number(toWalletInfo.selected_token_balance).toLocaleString(
                                  "en-US"
                                )}{" "}
                                {toWalletInfo.selected_token_symbol}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">Trạng thái KYC:</span>
                              <span
                                className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  toWalletInfo.is_kyc_verified ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20" : "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20"
                                }`}
                              >
                                {toWalletInfo.is_kyc_verified
                                  ? "Đã duyệt KYC (Đủ điều kiện nhận)"
                                  : "Chưa xác minh (Giao dịch sẽ bị từ chối)"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#141413]/55">Trạng thái Ví:</span>
                              <span
                                className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  toWalletInfo.is_frozen ? "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20" : "bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18"
                                }`}
                              >
                                {toWalletInfo.wallet_status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Số lượng & Mã hồ sơ xử lý */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#141413] mb-1">
                      4. Số lượng Token cần cưỡng chế chuyển nhượng (*):
                    </label>
                    <input
                      type="number"
                      min="0.0001"
                      step="any"
                      required
                      value={forcedAmount}
                      onChange={(e) => setForcedAmount(e.target.value)}
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-bold text-[#141413]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#141413] mb-1">
                      5. Mã hồ sơ xử lý pháp lý (Case ID — nếu có):
                    </label>
                    <input
                      type="text"
                      value={forcedCaseCode}
                      onChange={(e) => setForcedCaseCode(e.target.value)}
                      placeholder="VD: CASE-RWA-2026-01"
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-mono text-[#141413]"
                    />
                  </div>
                </div>

                {/* Lý do cưỡng chế chuyển nhượng */}
                <div>
                  <label className="block font-bold text-[#141413] mb-1">
                    6. Lý do cưỡng chế chuyển nhượng (Bắt buộc — Lưu vào Audit Log Off-chain):
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={forcedReason}
                    onChange={(e) => setForcedReason(e.target.value)}
                    placeholder="Ghi rõ căn cứ pháp lý, biên bản xử lý mất khóa cá nhân hoặc quyết định thu hồi..."
                    className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-[#141413]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setForcedConfirmModalOpen(true)}
                  disabled={busy || !canProceedForcedTransfer}
                  className="w-full inline-flex items-center justify-center gap-2 rounded bg-[#5C3D6E] hover:bg-[#492F59] disabled:opacity-50 px-5 py-3 text-xs font-bold text-white shadow-xs transition"
                >
                  <Repeat className="w-4 h-4" />
                  <span>
                    Kiểm tra & Mở xác nhận khôi phục cổ phần
                  </span>
                </button>
              </div>
            </div>

            {/* Cột phải (1/3): Bảng kiểm tra điều kiện an toàn */}
            <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="border-b border-[#1B2A24]/12 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#141413]">
                  Kiểm tra Điều kiện Smart Contract
                </h3>
                {inspectingWallets && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#206bc4]" />
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  {
                    ok: forcedValidation.validFrom && forcedValidation.validTo && forcedValidation.notSameWallet,
                    label: "Địa chỉ ví gửi (From) và ví nhận (To) hợp lệ, khác nhau",
                  },
                  {
                    ok: forcedValidation.validAmount,
                    label: `Số lượng token hợp lệ (> 0): ${forcedAmount || 0}`,
                  },
                  {
                    ok: forcedValidation.sufficientBalance,
                    label: `Ví gửi (From) có đủ số dư (${
                      fromWalletInfo?.selected_token_balance ?? 0
                    } >= ${forcedAmount || 0})`,
                  },
                  {
                    ok: forcedValidation.recipientKycVerified,
                    label: "Ví nhận (To) đã xác minh KYC trong IdentityRegistry",
                  },
                  {
                    ok: forcedValidation.recipientNotFrozen,
                    label: "Ví nhận (To) không bị đóng băng",
                  },
                  {
                    ok: forcedValidation.adminAuthorized,
                    label: "Tài khoản đang kết nối có quyền DEFAULT_ADMIN_ROLE",
                  },
                  {
                    ok: forcedValidation.hasReason,
                    label: "Đã nhập lý do cưỡng chế để lưu vào Audit Log",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2.5 rounded border ${
                      item.ok
                        ? "border-[#2fb344]/30 bg-[#2fb344]/5 text-[#1E6B52]"
                        : "border-[#d63939]/30 bg-[#d63939]/5 text-[#b02a37]"
                    }`}
                  >
                    {item.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2fb344]" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#d63939]" />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              {lastForcedTxResult && (
                <div className="mt-4 pt-4 border-t border-[#1B2A24]/12 space-y-1.5 text-xs">
                  <div className="font-bold text-[#2fb344]">
                    ✓ Giao dịch Cưỡng chế Gần nhất Thành công
                  </div>
                  <div className="font-mono text-[11px] text-[#206bc4] break-all">
                    TxHash: {lastForcedTxResult.tx_hash}
                  </div>
                  <div className="text-[#141413]/55">
                    Mã hồ sơ: <strong>{lastForcedTxResult.case_code || "N/A"}</strong> · Số lượng:{" "}
                    <strong>{lastForcedTxResult.amount}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MODAL XÁC NHẬN FORCED TRANSFER */}
          {forcedConfirmModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#1B2A24]/12 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3EDF5] text-[#5C3D6E] flex items-center justify-center">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#ae3ec9]">
                      XÁC NHẬN CHUYỂN NHƯỢNG CƯỠNG CHẾ
                    </span>
                    <h3 className="text-base font-bold text-[#141413]">
                      Xác nhận Khôi phục cổ phần (AssetToken)
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Hợp đồng Tài sản:</span>
                    <strong className="text-[#141413]">
                      {currentSelectedAsset?.name} ({currentSelectedAsset?.symbol})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Ví bị thu hồi:</span>
                    <code className="font-mono text-[#d63939] font-bold">{forcedFromAddr}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Ví nhận khôi phục:</span>
                    <code className="font-mono text-[#2fb344] font-bold">{forcedToAddr}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Số lượng cổ phần cưỡng chế:</span>
                    <strong className="text-sm text-[#ae3ec9]">
                      {Number(forcedAmount).toLocaleString("en-US")} {currentSelectedAsset?.symbol}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Mã hồ sơ xử lý:</span>
                    <strong className="font-mono">{forcedCaseCode || "Không có"}</strong>
                  </div>
                  <div className="pt-2 border-t border-[#1B2A24]/12">
                    <span className="text-[#141413]/55 block">Lý do thực hiện (Lưu vào Audit Log):</span>
                    <p className="font-medium text-[#141413] mt-0.5">{forcedReason}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForcedConfirmModalOpen(false)}
                    disabled={busy}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-semibold text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={executeConfirmedForcedTransfer}
                    disabled={busy}
                    className="px-4 py-2 rounded bg-[#5C3D6E] hover:bg-[#492F59] text-xs font-bold text-white transition"
                  >
                    {busy ? "Đang thực thi On-chain..." : "Xác nhận & Ký Giao dịch"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          6. ADMIN TAB 4: NÂNG CẤP GRANT / REVOKE ROLES & ROLE MANAGEMENT (YÊU CẦU 5)
         ===================================================================== */}
      {role === "admin" && (activeTab === "roles" || activeTab === "role-management") && (
        <div className="space-y-6">
          {/* Card 0: Quản lý Tài khoản & Phân quyền Hệ thống (RBAC User Management) */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1B2A24]/12 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <span className="whitespace-nowrap inline-block bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  RBAC · QUẢN LÝ TÀI KHOẢN &amp; PHÂN QUYỀN NGƯỜI DÙNG
                </span>
                <h2 className="text-base font-bold text-[#141413]">
                  Danh sách Tài khoản Đăng ký &amp; Cấp phát Vai trò Hệ thống ({labAccounts.length} tài khoản)
                </h2>
                <p className="text-xs text-[#141413]/55">
                  Quản trị viên có thể thay đổi vai trò của bất kỳ tài khoản nào (bao gồm tài khoản mới đăng ký) và tự động đồng bộ quyền <code>AccessControl</code> lên Smart Contract.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={rbacRoleFilter}
                  onChange={(e) => setRbacRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-[#1B2A24]/14 bg-white text-xs font-semibold text-[#141413]"
                >
                  <option value="all">Vai trò: Tất cả</option>
                  <option value="admin">ADMIN</option>
                  <option value="issuer">ISSUER</option>
                  <option value="compliance">COMPLIANCE</option>
                  <option value="investor">INVESTOR</option>
                </select>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm tên, @username, email, ví..."
                    value={rbacSearch}
                    onChange={(e) => setRbacSearch(e.target.value)}
                    className="w-52 pl-3 pr-8 py-1.5 rounded border border-[#1B2A24]/14 text-xs text-[#141413] focus:outline-none focus:border-[#206bc4]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={refreshBalances}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-semibold text-[#141413]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                    <th className="py-2.5 px-5">ID / Tài khoản</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Địa chỉ ví EOA</th>
                    <th className="py-2.5 px-4">Vai trò hiện tại</th>
                    <th className="py-2.5 px-4">Chọn vai trò mới</th>
                    <th className="py-2.5 px-5 text-right">Thao tác phân quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-[#141413]">
                  {(() => {
                    const filteredUsers = labAccounts.filter((u: any) => {
                      if (rbacRoleFilter !== "all" && u.role_label !== rbacRoleFilter) return false;
                      if (!rbacSearch.trim()) return true;
                      const q = rbacSearch.toLowerCase();
                      return (
                        (u.display_name || "").toLowerCase().includes(q) ||
                        (u.username || "").toLowerCase().includes(q) ||
                        (u.email || "").toLowerCase().includes(q) ||
                        (u.address || "").toLowerCase().includes(q)
                      );
                    });

                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#141413]/55">
                            Không tìm thấy tài khoản nào khớp với bộ lọc.
                          </td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u: any) => {
                      const selectedRole = userRoleDrafts[u.id] ?? u.role_label;
                      const hasChanged = selectedRole !== u.role_label;
                      const isSelf =
                        currentUser &&
                        u.address.toLowerCase() === currentUser.address.toLowerCase();
                      const roleBadgeClass =
                        u.role_label === "admin"
                          ? "rounded-full bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20 whitespace-nowrap shrink-0"
                          : u.role_label === "issuer"
                          ? "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0"
                          : u.role_label === "compliance"
                          ? "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0"
                          : "rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0";

                      return (
                        <tr key={u.id} className="hover:bg-[#F4F1EA]/75 transition">
                          <td className="py-3 px-5">
                            <div className="font-semibold text-[#141413] flex items-center gap-1.5">
                              <span>#{u.id} · {u.display_name}</span>
                              {isSelf && (
                                <span className="whitespace-nowrap px-1.5 py-0.5 rounded bg-[#206bc4]/10 text-[#206bc4] text-[10px] font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-[#206bc4]">
                              @{u.username || `user_${u.id}`}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#141413]/55">{u.email || "—"}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#141413]">
                            {shortAddr(u.address)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`whitespace-nowrap px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${roleBadgeClass}`}>
                              {u.role_label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={selectedRole}
                              onChange={(e) =>
                                setUserRoleDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))
                              }
                              disabled={busy || Boolean(isSelf)}
                              title={isSelf ? "Không thể tự thay đổi vai trò của tài khoản Admin đang đăng nhập" : "Chọn vai trò mới"}
                              className="rounded border border-[#1B2A24]/14 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#141413] disabled:bg-[#f4f6fa] disabled:text-slate-500"
                            >
                              <option value="investor">Nhà đầu tư</option>
                              <option value="compliance">Cán bộ tuân thủ</option>
                              <option value="issuer">Đơn vị phát hành</option>
                              <option value="admin">Quản trị hệ thống</option>
                            </select>
                          </td>
                          <td className="py-3 px-5 text-right">
                            {isSelf ? (
                              <span className="text-[11px] text-[#141413]/55 italic">Đang đăng nhập</span>
                            ) : (
                              <button
                                type="button"
                                disabled={busy || !hasChanged}
                                onClick={() =>
                                  setRbacConfirmTarget({
                                    user: u,
                                    newRole: selectedRole,
                                    reason: `Phân quyền tài khoản @${u.username || u.id} từ ${u.role_label.toUpperCase()} sang ${selectedRole.toUpperCase()}`,
                                    syncOnchain: true,
                                  })
                                }
                                className="px-3 py-1.5 rounded bg-[#1B2A24] hover:bg-[#14201B] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition"
                              >
                                Lưu &amp; Đồng bộ On-chain
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Xác Nhận Phân Quyền RBAC */}
          {rbacConfirmTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-lg border border-[#1B2A24]/12 shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
                  <div>
                    <span className="whitespace-nowrap bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase">
                      XÁC NHẬN PHÂN QUYỀN RBAC
                    </span>
                    <h3 className="text-base font-bold text-[#141413] mt-1">
                      Thay đổi Vai trò Tài khoản
                    </h3>
                  </div>
                  <button
                    onClick={() => setRbacConfirmTarget(null)}
                    disabled={busy}
                    className="p-1 text-[#141413]/55 hover:text-[#141413]"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#F4F1EA]/80 p-3.5 rounded border border-[#1B2A24]/12 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Tài khoản:</span>
                    <strong className="text-[#141413]">
                      {rbacConfirmTarget.user.display_name} (@{rbacConfirmTarget.user.username || rbacConfirmTarget.user.id})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#141413]/55">Địa chỉ ví EOA:</span>
                    <code className="font-mono text-[#141413]">{shortAddr(rbacConfirmTarget.user.address)}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#141413]/55">Thay đổi vai trò:</span>
                    <span className="font-bold">
                      <span className="text-[#141413]/55 uppercase">{rbacConfirmTarget.user.role_label}</span>
                      {" → "}
                      <span className="text-[#206bc4] uppercase">{rbacConfirmTarget.newRole}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rbacConfirmTarget.syncOnchain}
                      onChange={(e) =>
                        setRbacConfirmTarget((prev) =>
                          prev ? { ...prev, syncOnchain: e.target.checked } : prev
                        )
                      }
                    />
                    <span className="font-semibold text-[#141413]">
                      Tự động đồng bộ quyền <code>AccessControl</code> lên Smart Contract (Anvil)
                    </span>
                  </label>

                  <div>
                    <label className="block font-semibold text-[#141413] mb-1">
                      Lý do phân quyền (Ghi vào Audit Log):
                    </label>
                    <input
                      type="text"
                      value={rbacConfirmTarget.reason}
                      onChange={(e) =>
                        setRbacConfirmTarget((prev) =>
                          prev ? { ...prev, reason: e.target.value } : prev
                        )
                      }
                      className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 text-xs text-[#141413]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRbacConfirmTarget(null)}
                    className="px-4 py-2 rounded border border-[#1B2A24]/14 text-xs font-semibold text-[#141413]/55 hover:text-[#141413]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleAssignUserSystemRole(
                        rbacConfirmTarget.user,
                        rbacConfirmTarget.newRole,
                        rbacConfirmTarget.reason,
                        rbacConfirmTarget.syncOnchain
                      )
                    }
                    className="px-4 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    {busy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Xác Nhận Phân Quyền</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card 1: Cấp / Thu hồi quyền trực tiếp */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-4">
            <div className="border-b border-[#1B2A24]/12 pb-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="whitespace-nowrap inline-block bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  ON-CHAIN ACCESS CONTROL
                </span>
                <h2 className="text-lg font-bold text-[#141413]">
                  Cấp & Thu hồi Quyền Quản trị
                </h2>
                <p className="text-xs text-[#141413]/55">
                  Quản lý <code>DEFAULT_ADMIN_ROLE</code>, <code>ISSUER_ROLE</code> và{" "}
                  <code>COMPLIANCE_ROLE</code> trực tiếp trên Smart Contract.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/14 font-mono">
                  Signer: <strong>{currentUser?.address.slice(0, 10)}...</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
              <div>
                <label className="block font-bold text-[#141413] mb-1">
                  Hợp đồng đích:
                </label>
                <select
                  value={roleContractName}
                  onChange={(e) => setRoleContractName(e.target.value)}
                  className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-semibold text-[#141413]"
                >
                  <option value="IdentityRegistry">IdentityRegistry</option>
                  <option value="AssetFactory">AssetFactory</option>
                  <option value="PrimarySale">PrimarySale</option>
                  <option value="AssetToken">AssetToken (BĐS đang chọn)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#141413] mb-1">
                  Vai trò cần cấp / thu hồi:
                </label>
                <select
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-semibold text-[#141413]"
                >
                  <option value="DEFAULT_ADMIN_ROLE">DEFAULT_ADMIN_ROLE</option>
                  <option value="ISSUER_ROLE">ISSUER_ROLE</option>
                  <option value="COMPLIANCE_ROLE">COMPLIANCE_ROLE</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#141413]">Địa chỉ Ví Mục tiêu:</label>
                  <select
                    aria-label="Chọn nhanh ví Lab"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setRoleTargetAccount(e.target.value);
                    }}
                    className="text-[10px] border border-[#1B2A24]/14 rounded px-1.5 py-0.2 bg-[#F4F1EA]/80 text-[#206bc4] font-semibold"
                  >
                    <option value="">+ Chọn ví Lab</option>
                    {labAccounts.map((a) => (
                      <option key={a.address} value={a.address}>
                        {a.display_name} ({a.role_label})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={roleTargetAccount}
                  onChange={(e) => setRoleTargetAccount(e.target.value)}
                  className="w-full rounded border border-[#1B2A24]/14 bg-white px-3 py-2 font-mono text-[#141413]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openRoleConfirmModal(roleContractName, roleName, roleTargetAccount, true)
                  }
                  disabled={busy || !roleTargetAccount.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-[#1E6B52] hover:bg-[#175540] px-3 py-2 font-bold text-white transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cấp quyền</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openRoleConfirmModal(roleContractName, roleName, roleTargetAccount, false)
                  }
                  disabled={busy || !roleTargetAccount.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-[#A63A3A] hover:bg-[#8A2E2E] px-3 py-2 font-bold text-white transition"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Thu hồi quyền</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Bảng danh sách Role kiểm tra trực tiếp từ Smart Contract */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
            <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#141413]">
                  Bảng Danh sách Phân quyền Thực tế trên Smart Contract
                </h3>
                <p className="text-[11px] text-[#141413]/55">
                  Dữ liệu được kiểm tra trực tiếp từ hàm <code>hasRole(bytes32, address)</code> trên chuỗi Anvil
                </p>
              </div>

              {/* Bộ lọc & tìm kiếm Role */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={roleFilterName}
                  onChange={(e) => setRoleFilterName(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="DEFAULT_ADMIN_ROLE">DEFAULT_ADMIN_ROLE</option>
                  <option value="ISSUER_ROLE">ISSUER_ROLE</option>
                  <option value="COMPLIANCE_ROLE">COMPLIANCE_ROLE</option>
                </select>

                <select
                  value={roleFilterContract}
                  onChange={(e) => setRoleFilterContract(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
                >
                  <option value="ALL">Tất cả Hợp đồng</option>
                  <option value="IdentityRegistry">IdentityRegistry</option>
                  <option value="AssetFactory">AssetFactory</option>
                  <option value="PrimarySale">PrimarySale</option>
                  <option value="AssetToken">AssetToken</option>
                </select>

                <select
                  value={roleFilterStatus}
                  onChange={(e) => setRoleFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
                >
                  <option value="ALL">Mọi trạng thái</option>
                  <option value="ACTIVE">Đang có quyền</option>
                  <option value="REVOKED">Đã thu hồi</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm theo địa chỉ ví..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="w-52 pl-3 pr-8 py-1.5 rounded border border-[#1B2A24]/14 text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                    <th className="py-2.5 px-5 whitespace-nowrap">ĐỊA CHỈ VÍ</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">VAI TRÒ</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">HỢP ĐỒNG</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">TRẠNG THÁI ON-CHAIN</th>
                    <th className="py-2.5 px-4 whitespace-nowrap">THỜI GIAN CẤP QUYỀN</th>
                    <th className="py-2.5 px-5 text-right whitespace-nowrap">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                  {filteredRolesMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#141413]/55">
                        Không tìm thấy bản ghi phân quyền nào khớp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredRolesMatrix.map((r) => {
                      const roleBadge =
                        r.role_name === "DEFAULT_ADMIN_ROLE"
                          ? "rounded-full bg-[#F3EDF5] text-[#5C3D6E] ring-1 ring-inset ring-violet-600/20 whitespace-nowrap shrink-0"
                          : r.role_name === "ISSUER_ROLE"
                          ? "rounded-full bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0"
                          : "rounded-full bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 whitespace-nowrap shrink-0";

                      const isSoleAdmin =
                        r.role_name === "DEFAULT_ADMIN_ROLE" &&
                        r.has_role &&
                        (rolesMatrix.admin_counts?.[r.contract_name] || 1) <= 1;

                      return (
                        <tr key={r.id} className="hover:bg-[#F4F1EA]/75">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-[#141413] whitespace-nowrap">{r.display_name}</div>
                            <div className="inline-flex items-center gap-1 font-mono text-[11px] text-[#141413]/55 whitespace-nowrap">
                              <span title={r.account_address}>{shortAddr(r.account_address)}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(r.account_address)}
                                title="Sao chép địa chỉ ví"
                                className="p-0.5 rounded hover:bg-slate-200 text-[#141413]/55 hover:text-[#206bc4] transition"
                              >
                                {copiedText === r.account_address ? (
                                  <Check className="w-3 h-3 text-[#2fb344]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold ${roleBadge}`}
                            >
                              {r.role_name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#141413]">{r.contract_label}</div>
                            <div className="font-mono text-[11px] text-[#206bc4]">
                              {r.contract_address
                                ? `${r.contract_address.slice(0, 10)}...${r.contract_address.slice(-6)}`
                                : ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {r.has_role ? (
                              <span className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                                <Check className="w-3 h-3" /> Đang hoạt động
                              </span>
                            ) : (
                              <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#EAE5DA]/85 text-[#141413]/80 ring-1 ring-inset ring-slate-500/20 text-[10px] font-medium">
                                Đã thu hồi
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#141413]/55">
                            {formatDate(r.updated_at)}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {r.has_role ? (
                              <button
                                onClick={() =>
                                  openRoleConfirmModal(
                                    r.contract_name,
                                    r.role_name,
                                    r.account_address,
                                    false,
                                    r.contract_address
                                  )
                                }
                                disabled={busy}
                                title={
                                  isSoleAdmin
                                    ? "Cảnh báo: Đây là DEFAULT_ADMIN_ROLE duy nhất trên hợp đồng này"
                                    : "Thu hồi quyền trực tiếp"
                                }
                                className="px-3 py-1 rounded bg-[#FBF0F0] text-[#A63A3A] border border-[#A63A3A]/22 hover:bg-[#F5E0E0] rounded-lg font-semibold transition"
                              >
                                Thu hồi quyền
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openRoleConfirmModal(
                                    r.contract_name,
                                    r.role_name,
                                    r.account_address,
                                    true,
                                    r.contract_address
                                  )
                                }
                                disabled={busy}
                                className="px-3 py-1 rounded bg-[#1E6B52] hover:bg-[#175540] text-white rounded-lg font-semibold transition"
                              >
                                Cấp lại quyền
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL XÁC NHẬN GRANT / REVOKE ROLE (ĐẶC BIỆT BẢO VỆ DEFAULT_ADMIN_ROLE CUỐI CÙNG) */}
          {roleConfirmModal && roleConfirmModal.open && (
            <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-lg w-full p-6 space-y-4">
                {(() => {
                  const isRevokingDefaultAdmin =
                    !roleConfirmModal.grant &&
                    roleConfirmModal.roleName === "DEFAULT_ADMIN_ROLE";
                  const activeAdminCount =
                    rolesMatrix.admin_counts?.[roleConfirmModal.contractName] ?? 1;
                  const isLastAdminBlocked = isRevokingDefaultAdmin && activeAdminCount <= 1;

                  return (
                    <>
                      <div className="flex items-center gap-2.5 border-b border-[#1B2A24]/12 pb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            roleConfirmModal.grant ? "bg-[#E9F4EF] text-[#1E6B52]" : "bg-[#FBF0F0] text-[#A63A3A]"
                          }`}
                        >
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#141413]/55">
                            XÁC NHẬN PHÂN QUYỀN ON-CHAIN
                          </span>
                          <h3 className="text-base font-bold text-[#141413]">
                            {roleConfirmModal.grant
                              ? `Cấp quyền ${roleConfirmModal.roleName}`
                              : `Thu hồi quyền ${roleConfirmModal.roleName}`}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs bg-[#F4F1EA]/80 p-4 rounded border border-[#1B2A24]/12">
                        <div className="flex justify-between">
                          <span className="text-[#141413]/55">Hợp đồng Smart Contract:</span>
                          <strong className="text-[#141413]">
                            {roleConfirmModal.contractName}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#141413]/55">Vai trò thao tác:</span>
                          <code className="font-mono font-bold text-[#206bc4]">
                            {roleConfirmModal.roleName}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#141413]/55">Địa chỉ Ví mục tiêu:</span>
                          <code className="font-mono text-[#141413]">
                            {roleConfirmModal.accountAddress}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#141413]/55">Ví Admin đang kết nối:</span>
                          <code className="font-mono text-[#141413]">{currentUser?.address}</code>
                        </div>
                      </div>

                      {isRevokingDefaultAdmin && (
                        <div className="p-3.5 rounded border border-[#d63939] bg-[#d63939]/10 text-[#b02a37] text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>CẢNH BÁO NGUY HIỂM: THU HỒI QUYỀN QUẢN TRỊ TỐI CAO</span>
                          </div>
                          {isLastAdminBlocked ? (
                            <p className="font-semibold">
                              CHẶN AN TOÀN HỆ THỐNG: Hợp đồng{" "}
                              <code>{roleConfirmModal.contractName}</code> hiện chỉ còn duy nhất 1
                              ví giữ <code>DEFAULT_ADMIN_ROLE</code>. Hệ thống khóa thao tác này để
                              không vô tình làm mất quyền quản trị cuối cùng!
                            </p>
                          ) : (
                            <p>
                              Bạn đang chuẩn bị thu hồi <code>DEFAULT_ADMIN_ROLE</code>. Hãy chắc
                              chắn rằng hợp đồng vẫn còn ít nhất một ví quản trị viên dự phòng.
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-[#141413] mb-1">
                          Lý do phân quyền (Lưu vào Audit Log):
                        </label>
                        <input
                          type="text"
                          value={roleReason}
                          onChange={(e) => setRoleReason(e.target.value)}
                          className="w-full rounded border border-[#1B2A24]/14 px-3 py-2 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setRoleConfirmModal(null)}
                          disabled={busy}
                          className="px-4 py-2 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] text-xs font-semibold text-[#141413]"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          onClick={executeConfirmedRoleManage}
                          disabled={busy || isLastAdminBlocked}
                          className={`px-4 py-2 rounded text-xs font-bold text-white transition disabled:opacity-40 ${
                            roleConfirmModal.grant
                              ? "bg-[#1E6B52] hover:bg-[#175540]"
                              : "bg-[#A63A3A] hover:bg-[#8A2E2E]"
                          }`}
                        >
                          {busy
                            ? "Đang gửi giao dịch..."
                            : isLastAdminBlocked
                            ? "Đã khóa để bảo vệ Admin cuối cùng"
                            : `Xác nhận ${roleConfirmModal.grant ? "Cấp quyền" : "Thu hồi quyền"}`}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          7. ADMIN TAB 5: NÂNG CẤP TRANG AUDIT LOGS RIÊNG (YÊU CẦU 6)
         ===================================================================== */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
            {/* Toolbar Tìm kiếm, Lọc hành động, Lọc trạng thái, Lọc thời gian */}
            <div className="px-5 py-4 border-b border-[#1B2A24]/12 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="whitespace-nowrap inline-block bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  BLOCKCHAIN AUDIT TRAIL
                </span>
                <h2 className="text-base font-bold text-[#141413]">
                  Nhật ký Kiểm toán Giao dịch Quản trị
                </h2>
                <p className="text-xs text-[#141413]/55">
                  Chỉ ghi nhận giao dịch thành công sau khi đã có xác nhận Block từ Blockchain Anvil.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
                >
                  <option value="ALL">Loại hành động: Tất cả</option>
                  <option value="PAUSE">Pause AssetToken</option>
                  <option value="UNPAUSE">Unpause AssetToken</option>
                  <option value="FORCED_TRANSFER">Forced Transfer</option>
                  <option value="GRANT_ROLE">Grant Role</option>
                  <option value="REVOKE_ROLE">Revoke Role</option>
                  <option value="FREEZE">Freeze / Unfreeze</option>
                  <option value="OTHER">Thao tác khác</option>
                </select>

                <select
                  value={auditStatusFilter}
                  onChange={(e) => {
                    setAuditStatusFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
                >
                  <option value="ALL">Trạng thái: Tất cả</option>
                  <option value="SUCCESS">Success (Confirmed)</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>

                <select
                  value={auditTimeFilter}
                  onChange={(e) => {
                    setAuditTimeFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-1.5 rounded border border-[#1B2A24]/14 bg-white font-semibold text-[#141413]"
                >
                  <option value="ALL">Thời gian: Toàn bộ</option>
                  <option value="TODAY">Trong 24 giờ qua</option>
                  <option value="7DAYS">7 ngày gần nhất</option>
                  <option value="30DAYS">30 ngày gần nhất</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm theo ví, TxHash, method..."
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(1);
                    }}
                    className="w-56 pl-3 pr-8 py-1.5 rounded border border-[#1B2A24]/14 text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-[#9aa7b8] absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Bảng lịch sử Audit Logs */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                    <th className="py-2.5 px-5">THỜI GIAN</th>
                    <th className="py-2.5 px-4">NGƯỜI THỰC HIỆN</th>
                    <th className="py-2.5 px-4">HÀNH ĐỘNG</th>
                    <th className="py-2.5 px-4">ĐỐI TƯỢNG TÁC ĐỘNG</th>
                    <th className="py-2.5 px-4">TRẠNG THÁI</th>
                    <th className="py-2.5 px-5 text-right">CHI TIẾT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-[13px]">
                  {paginatedAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[#141413]/55">
                        Không có bản ghi kiểm toán nào khớp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map((a) => {
                      const act = classifyAuditAction(a.contract_method || "");
                      const st = (a.status || "SUCCESS").toUpperCase();
                      return (
                        <tr
                          key={a.id}
                          onClick={() => setSelectedAuditDetail(a)}
                          className="hover:bg-[#F4F1EA]/75 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-5 text-xs text-[#141413] whitespace-nowrap">
                            <div className="font-semibold">{formatDate(a.signed_at)}</div>
                            <div className="text-[11px] text-[#141413]/55 font-mono">
                              Audit #{a.id} · Block #{a.block_number || a.id}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs font-bold text-[#141413]">
                              {a.signer_name || a.role_label?.toUpperCase()}
                            </div>
                            <div className="font-mono text-[11px] text-[#141413]/55">
                              <div className="inline-flex items-center gap-1 font-mono text-[11px] text-[#141413]/55 whitespace-nowrap">
                                <span title={a.signer_address}>{shortAddr(a.signer_address)}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(a.signer_address);
                                  }}
                                  title="Sao chép địa chỉ ví"
                                  className="p-0.5 rounded hover:bg-slate-200 text-[#141413]/55 hover:text-[#206bc4] transition"
                                >
                                  {copiedText === a.signer_address ? (
                                    <Check className="w-3 h-3 text-[#2fb344]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded text-[11px] font-bold font-mono ${act.badge}`}
                            >
                              {a.contract_method}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#141413]">
                            {(() => {
                              const ti = extractAuditTargetInfo(a);
                              return (
                                <>
                                  {ti.title && (
                                    <div className="font-semibold text-[#141413] whitespace-nowrap">
                                      {ti.title}
                                      {ti.subtitle && (
                                        <span className="ml-1.5 text-[11px] font-normal text-[#141413]/55">
                                          ({ti.subtitle})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {ti.address && (
                                    <div className="inline-flex items-center gap-1 font-mono text-[11px] text-[#141413]/55 whitespace-nowrap">
                                      <span title={ti.address}>{shortAddr(ti.address)}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToClipboard(ti.address || "");
                                        }}
                                        title="Sao chép địa chỉ ví"
                                        className="p-0.5 rounded hover:bg-slate-200 text-[#141413]/55 hover:text-[#206bc4] transition"
                                      >
                                        {copiedText === ti.address ? (
                                          <Check className="w-3 h-3 text-[#2fb344]" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {a.reason && (
                              <div className="text-[11px] font-sans text-[#141413]/55 truncate max-w-xs">
                                Lý do: {a.reason}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                                st === "SUCCESS"
                                  ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                                  : st === "PENDING"
                                  ? "bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20"
                                  : "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20"
                              }`}
                            >
                              {st === "SUCCESS"
                                ? "Thành công"
                                : st === "PENDING"
                                ? "Đang xử lý"
                                : "Thất bại"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAuditDetail(a);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg text-xs font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Thanh Phân trang (Pagination) */}
            <div className="px-5 py-3.5 border-t border-[#1B2A24]/12 flex flex-wrap items-center justify-between gap-3 text-xs text-[#141413]/55">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>
                  Hiển thị{" "}
                  <strong>
                    {filteredAuditLogs.length === 0
                      ? 0
                      : (auditPage - 1) * AUDIT_PAGE_SIZE + 1}
                  </strong>{" "}
                  đến{" "}
                  <strong>
                    {Math.min(auditPage * AUDIT_PAGE_SIZE, filteredAuditLogs.length)}
                  </strong>{" "}
                  trong tổng số{" "}
                  <span className="whitespace-nowrap px-1.5 py-0.5 bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 rounded-full text-[11px] font-medium">
                    {filteredAuditLogs.length}
                  </span>{" "}
                  bản ghi
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] disabled:opacity-40 font-semibold text-[#141413]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </button>
                <span className="px-2.5 py-1 font-bold text-[#141413]">
                  Trang {auditPage} / {totalAuditPages}
                </span>
                <button
                  onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                  disabled={auditPage >= totalAuditPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#1B2A24]/14 bg-white hover:bg-[#F4F1EA] disabled:opacity-40 font-semibold text-[#141413]"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BẢN GHI AUDIT LOG (DÙNG CHUNG CHO DASHBOARD & TAB AUDIT) */}
      {selectedAuditDetail && (
        <div className="fixed inset-0 z-50 bg-[#141413]/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1B2A24]/12 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#206bc4]">
                  AUDIT LOG RECORD DETAIL #{selectedAuditDetail.id}
                </span>
                <h3 className="text-base font-bold text-[#141413]">
                  {selectedAuditDetail.contract_method}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditDetail(null)}
                className="px-3 py-1 rounded border border-[#1B2A24]/14 text-xs font-semibold text-[#141413]/55 hover:text-[#141413]"
              >
                Đóng ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/12 md:col-span-2">
                <span className="text-[#141413]/55 block">Transaction Hash:</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <code className="font-mono font-bold text-[#206bc4] break-all">
                    {selectedAuditDetail.tx_hash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedAuditDetail.tx_hash)}
                    className="px-2 py-1 rounded border border-[#1B2A24]/14 bg-white text-[11px] font-semibold shrink-0"
                  >
                    {copiedText === selectedAuditDetail.tx_hash ? "Đã copy" : "Copy Hash"}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/12">
                <span className="text-[#141413]/55 block">Địa chỉ Ví Người thực hiện:</span>
                <strong className="text-[#141413] block">
                  {selectedAuditDetail.signer_name} ({selectedAuditDetail.role_label?.toUpperCase()})
                </strong>
                <code className="font-mono text-[11px] text-[#141413]/55 break-all">
                  {selectedAuditDetail.signer_address}
                </code>
              </div>

              <div className="p-3 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/12">
                <span className="text-[#141413]/55 block">Smart Contract Liên quan:</span>
                <strong className="text-[#141413] block">
                  {(selectedAuditDetail.contract_method || "").split(".")[0]}
                </strong>
                <code className="font-mono text-[11px] text-[#206bc4] break-all">
                  {selectedAuditDetail.params_json?.contract_address ||
                    selectedAuditDetail.params_json?.token ||
                    "On-chain System Contract"}
                </code>
              </div>

              <div className="p-3 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/12">
                <span className="text-[#141413]/55 block">Block Number & Thời gian:</span>
                <strong className="font-mono text-[#141413]">
                  Block #{selectedAuditDetail.block_number || selectedAuditDetail.id}
                </strong>
                <span className="block text-[#141413]/55">
                  {formatDate(selectedAuditDetail.signed_at)}
                </span>
              </div>

              <div className="p-3 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/12">
                <span className="text-[#141413]/55 block">Trạng thái Giao dịch:</span>
                <span
                  className={`inline-flex items-center shrink-0 whitespace-nowrap mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    (selectedAuditDetail.status || "SUCCESS").toUpperCase() === "FAILED"
                      ? "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20"
                      : "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                  }`}
                >
                  {(selectedAuditDetail.status || "SUCCESS").toUpperCase() === "FAILED"
                    ? "Thất bại"
                    : "Thành công (Đã xác nhận On-chain)"}
                </span>
              </div>

              {(selectedAuditDetail.reason ||
                selectedAuditDetail.params_json?.reason ||
                selectedAuditDetail.case_code ||
                selectedAuditDetail.params_json?.case_code) && (
                <div className="p-3 rounded bg-[#F4F1EA]/80 border border-[#1B2A24]/12 md:col-span-2">
                  <span className="text-[#141413]/55 block">Lý do thực hiện & Mã hồ sơ:</span>
                  <p className="font-semibold text-[#141413] mt-0.5">
                    {selectedAuditDetail.reason || selectedAuditDetail.params_json?.reason}
                  </p>
                  {(selectedAuditDetail.case_code ||
                    selectedAuditDetail.params_json?.case_code) && (
                    <span className="inline-block mt-1 font-mono text-[11px] text-[#ae3ec9] font-bold">
                      Mã hồ sơ:{" "}
                      {selectedAuditDetail.case_code || selectedAuditDetail.params_json?.case_code}
                    </span>
                  )}
                </div>
              )}

              <div className="p-3 rounded bg-[#1b2434] text-slate-100 md:col-span-2">
                <span className="text-[#141413]/45 text-[11px] uppercase font-bold block mb-1">
                  Tham số Giao dịch:
                </span>
                <pre className="font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedAuditDetail.params_json, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. ADMIN TAB 6: BỔ SUNG SYSTEM MONITORING (YÊU CẦU 7)
         ===================================================================== */}
      {role === "admin" && activeTab === "monitoring" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B2A24]/12 pb-4">
              <div>
                <span className="whitespace-nowrap inline-block bg-[#EEF2F0] text-[#1B2A24] ring-1 ring-inset ring-[#1B2A24]/18 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase mb-1">
                  GIÁM SÁT HẠ TẦNG TRỰC TIẾP
                </span>
                <h2 className="text-lg font-bold text-[#141413]">
                  Giám sát trạng thái hệ thống
                </h2>
                <p className="text-xs text-[#141413]/55">
                  Kiểm tra kết nối thực tế tới Anvil RPC, FastAPI Backend, Database, IPFS/Pinata và Bytecode của các
                  Smart Contract.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#141413]/55">
                  Kiểm tra gần nhất: <strong>{formatDate(monitoringData?.checked_at)}</strong>
                </span>
                <button
                  onClick={loadAdminData}
                  disabled={loadingData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg text-xs font-bold transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`} />
                  <span>Kiểm tra Kết nối Ngay</span>
                </button>
              </div>
            </div>

            {/* 5 Thẻ thành phần hệ thống */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(monitoringData?.services || []).map((svc: any) => {
                const isOnline = svc.status === "ONLINE";
                const isError = svc.status === "ERROR";
                return (
                  <div
                    key={svc.key}
                    className="rounded-xl border border-[#1B2A24]/12 bg-[#F4F1EA]/80 p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-[#141413]">
                          {lang === "en"
                            ? svc.name
                            : MONITORING_SERVICE_NAME_VI[svc.name] || svc.name}
                        </h3>
                        <code className="font-mono text-[11px] text-[#141413]/55">
                          {formatMonitoringEndpoint(String(svc.endpoint || ""), lang)}
                        </code>
                      </div>
                      <span
                        className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          isOnline
                            ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20"
                            : isError
                            ? "bg-[#F8EFE2] text-[#8F622C] ring-1 ring-inset ring-amber-600/20"
                            : "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20"
                        }`}
                      >
                        {isOnline ? "Đã kết nối" : isError ? "Lỗi kết nối" : "Mất kết nối"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1B2A24]/8">
                      <div>
                        <span className="text-[#141413]/55 block">Thời gian phản hồi:</span>
                        <strong className="font-mono text-[#206bc4]">{svc.latency_ms} ms</strong>
                      </div>
                      <div>
                        <span className="text-[#141413]/55 block">Kiểm tra lúc:</span>
                        <strong className="text-[#141413]">
                          {formatDate(svc.checked_at).split(" ")[1] || "Live"}
                        </strong>
                      </div>
                    </div>

                    {svc.details && (
                      <div className="bg-white rounded-lg border border-[#1B2A24]/12 p-2.5 space-y-1.5 text-[11px]">
                        {Object.entries(svc.details).map(([k, v]) => {
                          const rawStr = String(v);
                          const displayVal =
                            k === "storage_dir" || /^[A-Za-z]:\\/.test(rawStr)
                              ? "./storage/ipfs_cache"
                              : rawStr;
                          const labelMeta = MONITORING_DETAIL_KEY_MAP[k];
                          const displayKey = labelMeta
                            ? lang === "en"
                              ? labelMeta.en
                              : labelMeta.vi
                            : k;
                          return (
                            <div key={k} className="flex items-start justify-between gap-3">
                              <span className="text-[#141413]/55 shrink-0">{displayKey}:</span>
                              <strong className="font-mono text-[#141413] text-right break-words min-w-0">
                                {displayVal}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-[11px]">
                      <span className="text-[#141413]/55">Lỗi kết nối gần nhất: </span>
                      <strong className={svc.last_error ? "text-[#A63A3A]" : "text-[#1E6B52]"}>
                        {svc.last_error || "Không có lỗi"}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bảng kiểm tra trực tiếp các Smart Contracts trên Anvil */}
          <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs">
            <div className="px-5 py-3.5 border-b border-[#1B2A24]/12 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#141413]">
                  Trạng thái Triển khai & Bytecode Smart Contracts
                </h3>
                <p className="text-[11px] text-[#141413]/55">
                  Xác minh trực tiếp mã máy EVM của từng hợp đồng trên mạng Anvil :8545
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/12 text-[11px] font-semibold uppercase text-[#141413]/55">
                    <th className="py-2.5 px-5">SMART CONTRACT</th>
                    <th className="py-2.5 px-4">PHÂN LOẠI</th>
                    <th className="py-2.5 px-4">ĐỊA CHỈ HỢP ĐỒNG</th>
                    <th className="py-2.5 px-4">BYTECODE SIZE</th>
                    <th className="py-2.5 px-4">TRẠNG THÁI VẬN HÀNH</th>
                    <th className="py-2.5 px-5 text-right">KẾT NỐI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A24]/8 text-xs">
                  {(monitoringData?.contracts || []).map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#F4F1EA]/75">
                      <td className="py-3.5 px-5 font-bold text-[#141413]">{c.name}</td>
                      <td className="py-3.5 px-4 text-[#141413]/55">{c.type}</td>
                      <td className="py-3.5 px-4 font-mono text-[#206bc4]">{c.address}</td>
                      <td className="py-3.5 px-4 font-mono text-[#141413]">
                        {Number(c.bytecode_bytes || 0).toLocaleString("en-US")} bytes
                      </td>
                      <td className="py-3.5 px-4">
                        {c.is_paused ? (
                          <span className="whitespace-nowrap px-2 py-0.5 rounded-full bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20 text-[10px] font-medium">
                            Tạm dừng
                          </span>
                        ) : (
                          <span className="whitespace-nowrap px-2 py-0.5 rounded-full bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20 text-[10px] font-medium">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span
                          className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            c.status === "ONLINE" ? "bg-[#E9F4EF] text-[#1E6B52] ring-1 ring-inset ring-emerald-600/20" : "bg-[#FBF0F0] text-[#A63A3A] ring-1 ring-inset ring-rose-600/20"
                          }`}
                        >
                          {c.status === "ONLINE" ? "Trực tuyến" : "Ngoại tuyến"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. ADMIN TAB 7: SYSTEM SETTINGS (YÊU CẦU 8 & 10)
         ===================================================================== */}
      {role === "admin" && activeTab === "settings" && (
        <div className="bg-white border border-[#1B2A24]/12 rounded-2xl shadow-xs p-6 space-y-5">
          <div className="border-b border-[#1B2A24]/12 pb-3.5">
            <span className="whitespace-nowrap inline-block bg-[#1b2434] text-white px-2.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1">
              PLATFORM CONFIGURATION & SECURITY POLICY
            </span>
            <h2 className="text-lg font-bold text-[#141413]">
              Cấu hình Hệ thống & Chính sách Bảo mật Quản trị RWA
            </h2>
            <p className="text-xs text-[#141413]/55">
              Thông số kết nối Smart Contract, cơ chế ký giao dịch và kiểm soát phân quyền đa lớp (Frontend + Backend +
              On-chain).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 space-y-3">
              <h3 className="font-bold text-sm text-[#141413]">
                1. Xác thực Ví & Ký số Giao dịch (MetaMask / Session Lab)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#141413]/55">Tài khoản Quản trị đang hoạt động:</span>
                  <strong className="text-[#141413]">{currentUser?.display_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#141413]/55">Địa chỉ Ví Admin (Anvil #0):</span>
                  <code className="font-mono text-[#206bc4]">{currentUser?.address}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#141413]/55">Ví Trình duyệt (MetaMask) kết nối:</span>
                  <code className="font-mono text-[#141413]">
                    {browserWallet || account || "Đang dùng Session Lab Signer"}
                  </code>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={connectMetaMaskWallet}
                    className="px-3.5 py-2 rounded bg-[#1B2A24] hover:bg-[#14201B] text-white rounded-lg font-semibold transition"
                  >
                    Kết nối / Đồng bộ Ví MetaMask Trình duyệt
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded border border-[#1B2A24]/12 bg-[#F4F1EA]/80 space-y-3">
              <h3 className="font-bold text-sm text-[#141413]">
                2. Chính sách bảo mật quản trị
              </h3>
              <ul className="space-y-2 text-[#141413]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2fb344] shrink-0" />
                  <span>
                    Kiểm tra quyền <code>DEFAULT_ADMIN_ROLE</code> tại Backend API & Smart Contract
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2fb344] shrink-0" />
                  <span>
                    Không lưu trữ Private Key hoặc Seed Phrase trên trình duyệt (Frontend)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2fb344] shrink-0" />
                  <span>
                    Bảo vệ chống thu hồi <code>DEFAULT_ADMIN_ROLE</code> cuối cùng trên hợp đồng
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2fb344] shrink-0" />
                  <span>
                    Ghi nhận 100% thao tác quản trị vào nhật ký kiểm toán hệ thống kèm lý do
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* Modal Xem Tài Liệu Word (.docx) IPFS Trực Tiếp Tại Web */}
      <IpfsWordViewerModal
        open={previewEstateDocId !== null}
        estateId={previewEstateDocId}
        onClose={() => setPreviewEstateDocId(null)}
      />
    </div>
  );
}
