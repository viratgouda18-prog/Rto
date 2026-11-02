/**
 * Validation utilities for Karnataka RTO Document Management
 */

// Format and validate Indian 10-digit mobile number
export function isValidIndianMobile(mobile: string): boolean {
  if (!mobile) return false;
  const cleaned = mobile.replace(/[\s\-+]/g, '');
  // Match 10 digits starting with 6, 7, 8, or 9; or with 91 prefix
  const regex = /^(?:91)?[6-9]\d{9}$/;
  return regex.test(cleaned);
}

// Mask Aadhaar number to display only last 4 digits per UIDAI compliance
export function maskAadhaar(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

// Format and validate Karnataka vehicle registration number (e.g. KA-01-AB-1234, KA05MH9999)
export function isValidKarnatakaRegNumber(reg: string): boolean {
  if (!reg) return false;
  const cleaned = reg.trim().toUpperCase().replace(/[\s\-]/g, '');
  // Standard Indian / Karnataka format: KA followed by 2 digits, optional 1-3 letters, and 1-4 digits
  // Or BH series: e.g. 22BH1234AA
  const kaRegex = /^KA\d{2}[A-Z]{0,3}\d{1,4}$/;
  const bhRegex = /^\d{2}BH\d{1,4}[A-Z]{1,2}$/;
  return kaRegex.test(cleaned) || bhRegex.test(cleaned);
}

// Format registration number standardizing hyphens (KA-01-AB-1234)
export function formatKarnatakaRegNumber(reg: string): string {
  if (!reg) return '';
  const cleaned = reg.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = cleaned.match(/^(KA)(\d{2})([A-Z]{1,3})?(\d{1,4})$/);
  if (match) {
    const [, state, rto, series, num] = match;
    return series ? `${state}-${rto}-${series}-${num}` : `${state}-${rto}-${num}`;
  }
  return reg.trim().toUpperCase();
}

// Calculate days remaining until expiry
export function getDaysUntilExpiry(expiryDateStr: string): number | null {
  if (!expiryDateStr) return null;
  const target = new Date(expiryDateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  // Set to midnight for clean day calculation
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Determine expiry badge status
export function getExpiryStatus(expiryDateStr: string): {
  status: 'expired' | 'critical' | 'warning' | 'valid' | 'none';
  label: string;
  daysRemaining: number | null;
} {
  const days = getDaysUntilExpiry(expiryDateStr);
  if (days === null) {
    return { status: 'none', label: 'No Date', daysRemaining: null };
  }
  if (days < 0) {
    return { status: 'expired', label: `Expired (${Math.abs(days)}d ago)`, daysRemaining: days };
  }
  if (days <= 7) {
    return { status: 'critical', label: `Expires in ${days}d`, daysRemaining: days };
  }
  if (days <= 30) {
    return { status: 'warning', label: `Expires in ${days}d`, daysRemaining: days };
  }
  return { status: 'valid', label: `${days} days left`, daysRemaining: days };
}
