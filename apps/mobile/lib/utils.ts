import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in compact form for space-constrained UI
 * Primarily used for displaying differences/changes (e.g., month-over-month comparisons)
 * NO +/- SIGNS - Icons and colors already indicate direction
 * - Under 1K: Full format with ₫ symbol (e.g., "500 ₫")
 * - 1K - 999K: Thousands (e.g., "10.5K ₫")
 * - 1M - 999M: Millions (e.g., "10.5M ₫")
 * - 1B+: Billions (e.g., "10.5B ₫")
 */
export function formatCurrencyCompact(amount: number): string {
  const absAmount = Math.abs(amount)

  if (absAmount >= 1_000_000_000) {
    // Billion: 10.5B ₫
    const value = (absAmount / 1_000_000_000).toFixed(1)
    return `${value}B ₫`
  }

  if (absAmount >= 1_000_000) {
    // Million: 10.5M ₫
    const value = (absAmount / 1_000_000).toFixed(1)
    return `${value}M ₫`
  }

  if (absAmount >= 1_000) {
    // Thousand: 10.5K ₫
    const value = (absAmount / 1_000).toFixed(1)
    return `${value}K ₫`
  }

  // Under 1000: 500 ₫
  return `${absAmount.toLocaleString('vi-VN')} ₫`
}
