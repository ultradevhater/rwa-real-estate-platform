/**
 * Shared UI display label formatters (Vietnamese canonical labels, translated to EN by LanguageContext).
 * Never alters underlying API enum values.
 */

const EVENT_TYPE_LABELS: Record<string, string> = {
  PRIMARY_BUY: "Mua sơ cấp",
  MARKET_BUY: "Mua trên sàn thứ cấp",
  MINT: "Phát hành cổ phần",
  TRANSFER: "Chuyển nhượng trực tiếp",
  FORCED_TRANSFER: "Khôi phục cổ phần",
  ESCROW_LIST: "Đăng bán ký quỹ",
  MARKET_LIST: "Đăng bán ký quỹ",
  ESCROW_CANCEL: "Hủy lệnh bán",
  MARKET_CANCEL: "Hủy lệnh bán",
  DIVIDEND: "Chi trả cổ tức",
};

const PROPERTY_KIND_LABELS: Record<string, string> = {
  apartment: "Căn hộ",
  land: "Đất nền",
  building: "Tòa nhà",
};

const KYC_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xét duyệt",
  under_review: "Đang thẩm định",
  approved: "Đã xác minh",
  rejected: "Bị từ chối",
  revoked: "Đã thu hồi",
  none: "Chưa xác minh",
};

const COMPLIANCE_ACTION_LABELS: Record<string, string> = {
  Approve: "Phê duyệt",
  Reject: "Từ chối",
  Revoke: "Thu hồi",
  Resubmission: "Nộp lại hồ sơ",
  "Approve KYC": "Phê duyệt danh tính",
  "Reject KYC": "Từ chối danh tính",
  "Revoke KYC": "Thu hồi xác minh",
  "Freeze Account": "Khóa tài khoản",
  "Unfreeze Account": "Mở khóa tài khoản",
  Freeze: "Khóa tài khoản",
  Unfreeze: "Mở khóa tài khoản",
  "Access KYC Doc": "Xem hồ sơ định danh",
};

export function formatEventTypeLabel(eventType?: string | null): string {
  if (!eventType) return "Giao dịch";
  const key = eventType.toUpperCase();
  return EVENT_TYPE_LABELS[key] || eventType;
}

export function formatPropertyKindLabel(kind?: string | null): string {
  if (!kind) return "Bất động sản";
  return PROPERTY_KIND_LABELS[kind.toLowerCase()] || kind;
}

export function formatKycStatusLabel(status?: string | null): string {
  if (!status) return "Chờ xét duyệt";
  return KYC_STATUS_LABELS[status.toLowerCase()] || status;
}

export function formatComplianceActionLabel(action?: string | null): string {
  if (!action) return "—";
  return COMPLIANCE_ACTION_LABELS[action] || action;
}
