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

/**
 * Remove Vietnamese accents and diacritics from a string
 * Used for accent-insensitive search functionality
 *
 * @param str - The string to normalize
 * @returns A normalized string without Vietnamese accents
 *
 * @example
 * removeVietnameseAccents("Dương Đỗ") // "Duong Do"
 * removeVietnameseAccents("Nguyễn Văn A") // "Nguyen Van A"
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/đ/g, 'd') // Replace lowercase đ
    .replace(/Đ/g, 'D') // Replace uppercase Đ
}

/**
 * Perform accent-insensitive search on a Vietnamese string
 * Normalizes both the search query and target string before comparison
 *
 * @param text - The text to search in
 * @param query - The search query
 * @returns True if the normalized text contains the normalized query
 *
 * @example
 * vietnameseSearch("Dương Đỗ", "duong") // true
 * vietnameseSearch("Nguyễn Văn A", "nguyen van") // true
 */
export function vietnameseSearch(text: string, query: string): boolean {
  const normalizedText = removeVietnameseAccents(text.toLowerCase())
  const normalizedQuery = removeVietnameseAccents(query.toLowerCase())
  return normalizedText.includes(normalizedQuery)
}
