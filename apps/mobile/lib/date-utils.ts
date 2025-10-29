/**
 * Date utility functions for handling month-to-date-range conversions
 * and Vietnamese timezone operations
 */

/**
 * Get the first day of a month
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12, NOT 0-11)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getFirstDayOfMonth(year: number, month: number): string {
  // Ensure month is 1-12
  const normalizedMonth = Math.max(1, Math.min(12, month))
  // Pad with zeros
  const monthStr = normalizedMonth.toString().padStart(2, '0')
  return `${year}-${monthStr}-01`
}

/**
 * Get the last day of a month
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12, NOT 0-11)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getLastDayOfMonth(year: number, month: number): string {
  // JavaScript Date months are 0-indexed, so month param is already 1-12
  // Create date for next month's first day, then subtract 1 day
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const lastDay = new Date(nextYear, nextMonth - 1, 0).getDate()

  const monthStr = month.toString().padStart(2, '0')
  const dayStr = lastDay.toString().padStart(2, '0')
  return `${year}-${monthStr}-${dayStr}`
}

/**
 * Get date range for a specific month
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12, NOT 0-11)
 * @returns Object with startDate and endDate in ISO format (YYYY-MM-DD)
 */
export function getMonthDateRange(year: number, month: number) {
  return {
    startDate: getFirstDayOfMonth(year, month),
    endDate: getLastDayOfMonth(year, month),
  }
}

/**
 * Get current month and year
 * @returns Object with year and month (1-12)
 */
export function getCurrentMonth() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // Convert 0-11 to 1-12
  }
}

/**
 * Get previous month
 * @param year - Current year
 * @param month - Current month (1-12)
 * @returns Object with year and month of previous month
 */
export function getPreviousMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 }
  }
  return { year, month: month - 1 }
}

/**
 * Get next month
 * @param year - Current year
 * @param month - Current month (1-12)
 * @returns Object with year and month of next month
 */
export function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 }
  }
  return { year, month: month + 1 }
}

/**
 * Format month for display in Vietnamese
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Formatted string like "Tháng 1/2025"
 */
export function formatMonthDisplay(year: number, month: number): string {
  return `Tháng ${month}/${year}`
}

/**
 * Format date in Vietnamese locale
 * @param dateString - ISO date string
 * @returns Formatted date like "1 tháng 1, 2025"
 */
export function formatDateVN(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date and time in Vietnamese locale
 * @param dateString - ISO date string
 * @returns Formatted date and time like "1 tháng 1, 2025 14:30"
 */
export function formatDateTimeVN(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
