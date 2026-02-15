/**
 * Format currency amount as "CUR X,XXX.XX"
 */
export function formatCurrency(amount, currency = 'EUR') {
  if (amount == null || isNaN(amount)) return `${currency} 0.00`;
  const num = Number(amount);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

/**
 * Format date to relative or absolute
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format full date with time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate IBAN for display
 */
export function maskIban(iban) {
  if (!iban) return '';
  if (iban.length <= 8) return iban;
  return `${iban.slice(0, 4)} **** ${iban.slice(-4)}`;
}

/**
 * Get payee display name from payee object
 */
export function getPayeeName(payee) {
  return payee?.payee_name || payee?.name || payee?.label || 'Unknown Payee';
}

/**
 * Get transaction display name
 */
export function getTxDisplayName(tx) {
  return tx?.counterparty_name || tx?.description || tx?.transaction_type || tx?.type || 'Transaction';
}

/**
 * Determine if transaction is incoming based on transaction_type
 */
export function isTxIncoming(tx) {
  const type = (tx?.transaction_type || tx?.type || '').toUpperCase();
  if (type === 'DEPOSIT' || type === 'CREDIT' || type === 'INBOUND') return true;
  if (type === 'WITHDRAWAL' || type === 'PAYMENT' || type === 'DEBIT' || type === 'OUTBOUND') return false;
  // For TRANSFER, check description or default to outgoing
  if (type === 'TRANSFER') {
    const desc = (tx?.description || '').toLowerCase();
    if (desc.startsWith('from:') || desc.includes('received')) return true;
    if (desc.startsWith('to:') || desc.includes('sent')) return false;
  }
  // For EXCHANGE, check if it's a buy or sell
  if (type === 'EXCHANGE') return false;
  return false;
}

/**
 * Normalize status for display (handle uppercase from DB)
 */
export function normalizeStatus(status) {
  if (!status) return 'unknown';
  return status.toLowerCase();
}

/**
 * Format transaction type for display
 */
export function formatTxType(type) {
  if (!type) return 'Transaction';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}
