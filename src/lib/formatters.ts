/**
 * Shared utility functions for CleanSlate
 * Handles consistent currency formatting to two decimal places and standardized mailto links.
 */

/**
 * Formats any numeric or string amount to currency with exactly two decimal places and commas.
 * Example: 3850 -> "$ 3,850.00"
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') {
    return '$\u00A00.00';
  }
  const numericVal = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;
  return `$\u00A0${numericVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Returns a standardized mailto: URL that auto-populates the recipient
 * and sets a subject line starting with "Cleanslate: " so the user can easily continue typing.
 */
export function getMailtoUrl(email: string | undefined | null, extraSubject = ''): string {
  if (!email) return '#';
  const cleanEmail = email.trim();
  const subject = extraSubject ? `Cleanslate: ${extraSubject}` : 'Cleanslate: ';
  return `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(subject)}`;
}
