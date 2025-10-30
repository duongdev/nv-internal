/**
 * Text processing utilities for the NV Internal API
 *
 * This module provides utilities for text normalization and search optimization,
 * particularly for Vietnamese language support.
 */

/**
 * Remove Vietnamese accents/diacritics from text for accent-insensitive search
 *
 * This function normalizes Vietnamese text by:
 * 1. Decomposing combined Unicode characters (NFD normalization)
 * 2. Removing diacritic marks (accents)
 * 3. Converting đ/Đ to d/D (special Vietnamese character)
 *
 * @param text - The text to normalize
 * @returns Text with Vietnamese accents removed
 *
 * @example
 * removeVietnameseAccents('Nguyễn Văn A') // returns 'Nguyen Van A'
 * removeVietnameseAccents('Điện thoại') // returns 'Dien thoai'
 * removeVietnameseAccents('Hà Nội') // returns 'Ha Noi'
 */
export function removeVietnameseAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/**
 * Normalize text for case-insensitive and accent-insensitive search
 *
 * This combines accent removal with lowercase conversion for maximum
 * search flexibility with Vietnamese text.
 *
 * @param text - The text to normalize
 * @returns Normalized text (lowercase, no accents)
 *
 * @example
 * normalizeForSearch('Nguyễn Văn A') // returns 'nguyen van a'
 * normalizeForSearch('ĐIỆN THOẠI') // returns 'dien thoai'
 */
export function normalizeForSearch(text: string): string {
  return removeVietnameseAccents(text).toLowerCase()
}
