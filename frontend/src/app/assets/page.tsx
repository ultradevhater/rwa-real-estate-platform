"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Context";
import { StatusBadge, BadgeVariant } from "@/components/ui/StatusBadge";
import { CopyAddress } from "@/components/ui/CopyAddress";
import { AssetGridSkeleton, TableRowsSkeleton } from "@/components/ui/Skeleton";
import {
  Search,
  RefreshCw,
  Eye,
  Globe,
  Filter,
  Plus,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  ShoppingBag,
  Settings2,
} from "lucide-react";

const PROPERTY_KIND_PILLS: Record<
  string,
  { label: string; variant: BadgeVariant; thumbGradient: string }
> = {
  apartment: {
    label: "Căn hộ",
    variant: "info",
    thumbGradient: "from-[#141413] via-[#1B2A24] to-[#2F473D]",
  },
  land: {
    label: "Đất nền",
    variant: "purple",
    thumbGradient: "from-[#141413] via-[#2B242B] to-[#4A3B47]",
  },
  building: {
    label: "Tòa nhà",
    variant: "neutral",
    thumbGradient: "from-[#141413] via-[#2A231B] to-[#4F3E2A]",
  },
};

export default function AssetsListPage() {
  const { apiFetch, currentUser } = useWeb3();
  const role = currentUser?.role_label || "investor";

  const [estates, setEstates] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [userToggledView, setUserToggledView] = useState<boolean>(false);
  const [filterKind, setFilterKind] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "valuation_desc">("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 6;
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userToggledView) {
      setViewMode(role === "investor" ? "grid" : "table");
    }
  }, [role, userToggledView]);

  const loadEstates = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/assets?property_kind=${filterKind}`);
      setEstates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch real estates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstates();
  }, [filterKind, currentUser?.address]);

  const getTokenizationBadge = (est: any): { key: string; label: string; variant: BadgeVariant; dot?: boolean } => {
    if (!est.token_address) {
      return { key: "ready", label: "Sẵn sàng phát hành", variant: "warning", dot: true };
    }
    if (est.is_paused) {
      return { key: "paused", label: "Tạm dừng giao dịch", variant: "danger", dot: true };
    }
    return { key: "tokenized", label: "Đã phát hành cổ phần", variant: "info", dot: true };
  };

  const getSaleBadge = (est: any): { key: string; label: string; variant: BadgeVariant; dot?: boolean } => {
    const sale = est.primary_sale || {};
    if (!est.token_address) {
      return { key: "not_tokenized", label: "Chưa phát hành", variant: "neutral" };
    }
    if (sale.is_open) {
      return { key: "sale_open", label: "Đang mở bán", variant: "success", dot: true };
    }
    if (Number(sale.total_amount || 0) > 0) {
      return { key: "sale_closed", label: "Đã đóng bán", variant: "danger", dot: true };
    }
    return { key: "sale_closed", label: "Chưa mở bán", variant: "neutral" };
  };

  const filteredEstates = estates
    .filter((est) => {
      const tokBadge = getTokenizationBadge(est);
      const saleBadge = getSaleBadge(est);

      if (filterStatus !== "all") {
        if (filterStatus === "ready" && tokBadge.key !== "ready") return false;
        if (filterStatus === "tokenized" && !est.token_address) return false;
        if (filterStatus === "sale_open" && saleBadge.key !== "sale_open") return false;
        if (filterStatus === "sale_closed" && saleBadge.key !== "sale_closed") return false;
        if (filterStatus === "paused" && tokBadge.key !== "paused") return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (est.name || "").toLowerCase().includes(q) ||
        (est.symbol || "").toLowerCase().includes(q) ||
        (est.address_text || "").toLowerCase().includes(q) ||
        (est.doc_cid || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "valuation_desc") {
        return Number(b.valuation || 0) - Number(a.valuation || 0);
      }
      const tA = a.created_at ? new Date(a.created_at).getTime() : a.id;
      const tB = b.created_at ? new Date(b.created_at).getTime() : b.id;
      return sortBy === "newest" ? tB - tA : tA - tB;
    });

  const totalPages = Math.max(1, Math.ceil(filteredEstates.length / PAGE_SIZE));
  const paginatedEstates = filteredEstates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalValuation = estates.reduce((acc, e) => acc + Number(e.valuation || 0), 0);
  const openOfferingsCount = estates.filter((e) => e.primary_sale?.is_open).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#B8844A] font-semibold block">
            Sổ đăng ký tài sản thực
          </span>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] mt-1">
            Danh mục Bất động sản{" "}
            <span className="font-sans font-bold text-[#B8844A]">
              đồng sở hữu
            </span>
          </h1>
          <p className="text-[13px] text-[#141413]/60 mt-1">
            Khám phá tài sản bất động sản đã kiểm chứng pháp lý và đầu tư cổ phần minh bạch bằng mUSDC.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher: Dạng lưới | Dạng bảng */}
          <div className="inline-flex items-center rounded-xl border border-[#1B2A24]/15 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setUserToggledView(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === "grid"
                  ? "bg-[#1B2A24] text-[#F4F1EA] shadow-xs"
                  : "text-[#141413]/65 hover:text-[#141413]"
              }`}
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={1.75} />
              <span>Dạng lưới</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("table");
                setUserToggledView(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === "table"
                  ? "bg-[#1B2A24] text-[#F4F1EA] shadow-xs"
                  : "text-[#141413]/65 hover:text-[#141413]"
              }`}
            >
              <List className="w-4 h-4" strokeWidth={1.75} />
              <span>Dạng bảng</span>
            </button>
          </div>

          {role === "issuer" && (
            <Link
              href="/admin?tab=issuer-register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1B2A24] hover:bg-[#14201B] text-[#F4F1EA] shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
              <span>Đăng ký bất động sản mới</span>
            </Link>
          )}
        </div>
      </div>

      {/* Portfolio Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
        <div className="bg-white rounded-2xl border border-[#1B2A24]/12 px-5 py-4 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#141413]/50 font-semibold">
            Bất động sản niêm yết
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-jakarta text-2xl font-bold text-[#141413]">{estates.length}</span>
            <span className="text-xs text-[#141413]/55">tài sản</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#1B2A24]/12 px-5 py-4 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#141413]/50 font-semibold">
            Tổng giá trị định giá
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-jakarta text-2xl font-bold text-[#141413]">
              ${totalValuation.toLocaleString("en-US")}
            </span>
            <span className="font-mono text-xs text-[#B8844A] font-semibold">mUSDC</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#1B2A24]/12 px-5 py-4 shadow-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#141413]/50 font-semibold">
            Đợt mở bán sơ cấp
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-jakarta text-2xl font-bold text-[#1E6B52]">{openOfferingsCount}</span>
            <span className="text-xs text-[#141413]/55">đang nhận đầu tư</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar Card */}
      <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative inline-flex items-center">
            <select
              aria-label="Lọc loại bất động sản"
              value={filterKind}
              onChange={(e) => {
                setFilterKind(e.target.value);
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-1.5 border border-[#1B2A24]/15 rounded-xl text-xs font-medium text-[#141413] bg-[#F4F1EA]/50 hover:bg-[#F4F1EA] focus:outline-none focus:border-[#B8844A] cursor-pointer"
            >
              <option value="all">Loại hình: Tất cả</option>
              <option value="apartment">Căn hộ</option>
              <option value="land">Đất nền</option>
              <option value="building">Tòa nhà</option>
            </select>
            <Filter
              className="w-3.5 h-3.5 text-[#141413]/45 absolute right-2.5 pointer-events-none"
              strokeWidth={1.75}
            />
          </div>

          <select
            aria-label="Lọc trạng thái"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-[#1B2A24]/15 rounded-xl text-xs font-medium text-[#141413] bg-[#F4F1EA]/50 hover:bg-[#F4F1EA] focus:outline-none focus:border-[#B8844A] cursor-pointer"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="ready">Sẵn sàng phát hành</option>
            <option value="tokenized">Đã phát hành cổ phần</option>
            <option value="sale_open">Đang mở bán sơ cấp</option>
            <option value="sale_closed">Đã đóng / Chưa mở bán</option>
            <option value="paused">Tạm dừng giao dịch</option>
          </select>

          <select
            aria-label="Sắp xếp danh sách"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-[#1B2A24]/15 rounded-xl text-xs font-medium text-[#141413] bg-[#F4F1EA]/50 hover:bg-[#F4F1EA] focus:outline-none focus:border-[#B8844A] cursor-pointer"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="oldest">Sắp xếp: Cũ nhất</option>
            <option value="valuation_desc">Sắp xếp: Định giá cao → thấp</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên dự án hoặc mã tài sản..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-56 sm:w-64 pl-3 pr-8 py-1.5 border border-[#1B2A24]/15 rounded-xl text-xs text-[#141413] bg-[#F4F1EA]/40 placeholder-[#141413]/40 focus:bg-white focus:outline-none focus:border-[#B8844A]"
            />
            <Search
              className="w-4 h-4 text-[#141413]/45 absolute right-2.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <button
          onClick={loadEstates}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1B2A24]/15 rounded-xl text-xs font-medium text-[#141413] bg-white hover:bg-[#F4F1EA] shadow-xs transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#B8844A]" : "text-[#141413]/60"}`} strokeWidth={1.75} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* VIEW 1: DẠNG LƯỚI 3 CỘT */}
      {viewMode === "grid" ? (
        loading ? (
          <AssetGridSkeleton count={6} />
        ) : paginatedEstates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xs py-14 text-center text-sm text-[#141413]/55">
            Không tìm thấy bất động sản nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEstates.map((est) => {
              const kindPill = PROPERTY_KIND_PILLS[est.property_kind] || PROPERTY_KIND_PILLS.apartment;
              const tokBadge = getTokenizationBadge(est);
              const saleBadge = getSaleBadge(est);
              const sale = est.primary_sale || {};
              const progressPct = Math.min(100, Number(sale.progress_percent || 0));

              return (
                <div
                  key={est.id}
                  className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xs hover:shadow-[0_18px_40px_-20px_rgba(20,20,19,0.22)] hover:-translate-y-0.5 hover:border-[#B8844A]/50 transition-all duration-200 overflow-hidden flex flex-col group"
                >
                  {/* Cover Image / Architectural Gradient Fallback */}
                  <Link
                    href={`/assets/${est.id}`}
                    className={`relative aspect-[16/10] w-full bg-gradient-to-br ${kindPill.thumbGradient} flex flex-col items-center justify-center overflow-hidden`}
                  >
                    {est.cover_image_url ? (
                      <img
                        src={est.cover_image_url}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#F4F1EA]/90 select-none">
                        <div className="w-11 h-11 rounded-xl bg-[#F4F1EA]/10 backdrop-blur-xs border border-[#D7BC8D]/30 flex items-center justify-center mb-2">
                          <Building2 className="w-5 h-5 text-[#D7BC8D]" strokeWidth={1.75} />
                        </div>
                        <span className="font-mono text-xs font-semibold tracking-wider text-[#EED7B2]">
                          {est.symbol}
                        </span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141413]/70 via-transparent to-transparent" />

                    {/* Top-left Kind Pill & Top-right Sale Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <StatusBadge variant={kindPill.variant} className="bg-[#F4F1EA]/95 backdrop-blur-xs shadow-xs">
                        {kindPill.label}
                      </StatusBadge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <StatusBadge
                        variant={est.token_address ? saleBadge.variant : tokBadge.variant}
                        dot
                        className="bg-[#F4F1EA]/95 backdrop-blur-xs shadow-xs"
                      >
                        {est.token_address ? saleBadge.label : tokBadge.label}
                      </StatusBadge>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/assets/${est.id}`}
                            className="font-jakarta text-base font-bold text-[#141413] hover:text-[#B8844A] transition-colors line-clamp-1"
                          >
                            {est.name}
                          </Link>
                          <span className="shrink-0 whitespace-nowrap rounded-lg bg-[#EAE5DA] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1B2A24]">
                            {est.symbol}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#141413]/55 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#B8844A]" strokeWidth={1.75} />
                          <span className="truncate">
                            {est.address_text} · {Number(est.area_m2).toLocaleString("en-US")} m²
                          </span>
                        </div>
                      </div>

                      {/* Financial Metrics Box */}
                      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#F4F1EA]/80 border border-[#1B2A24]/8 tabular-nums">
                        <div>
                          <span className="block text-[11px] text-[#141413]/55">Giá mỗi cổ phần</span>
                          <strong className="font-mono text-sm font-semibold text-[#141413]">
                            ${Number(sale.price_per_share || est.intrinsic_price_per_share || 0).toLocaleString("en-US")}{" "}
                            <span className="text-[10.5px] font-normal text-[#B8844A]">mUSDC</span>
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#141413]/55">Tổng định giá</span>
                          <strong className="font-mono text-sm font-semibold text-[#141413]">
                            ${Number(est.valuation).toLocaleString("en-US")}
                          </strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 tabular-nums">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#141413]/60">
                            Đã phân phối:{" "}
                            <strong className="font-semibold text-[#141413]">
                              {Number(sale.sold_amount || 0).toLocaleString("en-US")} /{" "}
                              {Number(sale.total_amount || est.total_shares || 0).toLocaleString("en-US")}
                            </strong>{" "}
                            cổ phần
                          </span>
                          <span className="font-mono font-semibold text-[#1B2A24]">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAE5DA] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1B2A24] via-[#1E6B52] to-[#B8844A] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer CTA */}
                    <div className="pt-3 border-t border-[#1B2A24]/8 flex items-center gap-2">
                      {role === "investor" && sale.is_open ? (
                        <>
                          <Link
                            href={`/assets/${est.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B2A24] hover:bg-[#14201B] text-[#F4F1EA] text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                          >
                            <ShoppingBag className="w-4 h-4 text-[#D7BC8D]" strokeWidth={1.75} />
                            <span>Mua cổ phần</span>
                          </Link>
                          <Link
                            href={`/assets/${est.id}`}
                            title="Xem chi tiết & kiểm chứng hồ sơ pháp lý"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#F4F1EA] text-[#141413]/70 transition-colors shrink-0"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.75} />
                          </Link>
                        </>
                      ) : role === "issuer" ? (
                        <Link
                          href={`/assets/${est.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#1B2A24]/15 hover:bg-[#1B2A24] hover:text-[#F4F1EA] text-[#141413] text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                        >
                          <Settings2 className="w-4 h-4 text-[#B8844A]" strokeWidth={1.75} />
                          <span>Quản lý &amp; Mở bán</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/assets/${est.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F4F1EA]/80 border border-[#1B2A24]/12 hover:bg-[#1B2A24] hover:text-[#F4F1EA] text-[#141413] text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.75} />
                          <span>Xem chi tiết bất động sản</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* VIEW 2: DẠNG BẢNG */
        <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F1EA]/80 border-b border-[#1B2A24]/10 text-[11px] font-semibold uppercase tracking-wider text-[#141413]/55">
                  <th className="py-3 px-4 whitespace-nowrap">Bất động sản</th>
                  <th className="py-3 px-3 whitespace-nowrap">Định giá</th>
                  <th className="py-3 px-3 whitespace-nowrap">Cổ phần</th>
                  <th className="py-3 px-3 whitespace-nowrap">Phát hành</th>
                  <th className="py-3 px-3 whitespace-nowrap">Mở bán</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2A24]/8 text-sm text-[#141413]">
                {loading ? (
                  <TableRowsSkeleton rows={6} cols={6} />
                ) : paginatedEstates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#141413]/55">
                      Không tìm thấy bất động sản nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedEstates.map((est) => {
                    const kindPill =
                      PROPERTY_KIND_PILLS[est.property_kind] || PROPERTY_KIND_PILLS.apartment;
                    const tokBadge = getTokenizationBadge(est);
                    const saleBadge = getSaleBadge(est);
                    const sale = est.primary_sale || {};

                    return (
                      <tr key={est.id} className="hover:bg-[#F4F1EA]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kindPill.thumbGradient} text-[#D7BC8D] flex flex-col items-center justify-center shrink-0 shadow-xs`}
                            >
                              <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 max-w-[195px]">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/assets/${est.id}`}
                                  className="text-sm font-semibold text-[#141413] hover:text-[#B8844A] truncate"
                                  title={est.name}
                                >
                                  {est.name}
                                </Link>
                                <span className="shrink-0 whitespace-nowrap px-1.5 py-0.5 rounded bg-[#EAE5DA] text-[#1B2A24] font-mono text-[10px] font-semibold">
                                  {est.symbol}
                                </span>
                              </div>
                              <div className="text-xs text-[#141413]/55 flex items-center gap-1.5 mt-0.5 truncate tabular-nums">
                                <StatusBadge variant={kindPill.variant} className="!px-2 !py-0 !text-[10px]">
                                  {kindPill.label}
                                </StatusBadge>
                                <span className="truncate">
                                  {Number(est.area_m2).toLocaleString("en-US")} m²
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap tabular-nums">
                          <div className="font-mono text-sm font-semibold text-[#141413]">
                            ${Number(est.valuation).toLocaleString("en-US")}
                          </div>
                          <div className="font-mono text-xs text-[#141413]/55">
                            ${Number(est.intrinsic_price_per_share).toLocaleString("en-US")}/cổ phần
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap tabular-nums">
                          <div className="text-sm font-medium text-[#141413]">
                            {Number(est.total_shares).toLocaleString("en-US")} {est.symbol}
                          </div>
                          <div className="text-xs text-[#141413]/55">
                            Đã bán: <strong className="font-medium text-[#141413]">{Number(sale.sold_amount || 0).toLocaleString("en-US")}</strong>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <StatusBadge variant={tokBadge.variant} dot={tokBadge.dot}>
                            {tokBadge.label}
                          </StatusBadge>
                          {est.token_address && (
                            <div className="mt-1">
                              <CopyAddress value={est.token_address} prefixLen={4} suffixLen={3} />
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap tabular-nums">
                          <StatusBadge variant={saleBadge.variant} dot={saleBadge.dot}>
                            {saleBadge.label}
                          </StatusBadge>
                          {Number(sale.total_amount || 0) > 0 && (
                            <div className="mt-1.5 w-20">
                              <div className="w-full h-1.5 bg-[#EAE5DA] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#1E6B52] rounded-full"
                                  style={{ width: `${Math.min(100, sale.progress_percent || 0)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Link
                              href={`/assets/${est.id}`}
                              title="Xem chi tiết bất động sản"
                              className="w-8 h-8 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#F4F1EA] text-[#141413]/70 inline-flex items-center justify-center shadow-xs transition-colors"
                            >
                              <Eye className="w-4 h-4" strokeWidth={1.75} />
                            </Link>

                            {role === "investor" && sale.is_open && (
                              <Link
                                href={`/assets/${est.id}`}
                                className="px-3 py-1.5 rounded-xl bg-[#1B2A24] hover:bg-[#14201B] text-[#F4F1EA] text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                              >
                                Mua
                              </Link>
                            )}

                            {role === "issuer" && (
                              <Link
                                href={`/assets/${est.id}`}
                                className="px-3 py-1.5 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#1B2A24] hover:text-[#F4F1EA] text-[#141413] text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                              >
                                Quản lý
                              </Link>
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
        </div>
      )}

      {/* Pagination Bar */}
      <div className="bg-white rounded-2xl border border-[#1B2A24]/12 shadow-xs px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#141413]/60 tabular-nums">
        <div className="flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-[#B8844A]" strokeWidth={1.75} />
          <span>
            Hiển thị{" "}
            <strong className="font-semibold text-[#141413]">
              {filteredEstates.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            </strong>{" "}
            đến{" "}
            <strong className="font-semibold text-[#141413]">
              {Math.min(page * PAGE_SIZE, filteredEstates.length)}
            </strong>{" "}
            trong tổng số{" "}
            <StatusBadge variant="info" className="mx-0.5">
              {filteredEstates.length}
            </StatusBadge>{" "}
            bất động sản
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#F4F1EA] disabled:opacity-40 font-medium text-[#141413] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} /> Trước
          </button>
          <span className="font-mono font-semibold text-[#141413] px-1">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#1B2A24]/15 bg-white hover:bg-[#F4F1EA] disabled:opacity-40 font-medium text-[#141413] transition-colors"
          >
            Sau <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
