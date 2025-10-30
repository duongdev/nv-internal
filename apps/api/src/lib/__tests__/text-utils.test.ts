/**
 * Tests for text processing utilities
 *
 * Verifies Vietnamese accent removal and search normalization functions
 */

import { describe, expect, it } from '@jest/globals'
import { normalizeForSearch, removeVietnameseAccents } from '../text-utils'

describe('text-utils', () => {
  describe('removeVietnameseAccents', () => {
    it('should remove accents from Vietnamese vowels', () => {
      expect(removeVietnameseAccents('Nguyễn')).toBe('Nguyen')
      expect(removeVietnameseAccents('Trần')).toBe('Tran')
      expect(removeVietnameseAccents('Phạm')).toBe('Pham')
      expect(removeVietnameseAccents('Lê')).toBe('Le')
      expect(removeVietnameseAccents('Hoàng')).toBe('Hoang')
    })

    it('should convert đ to d', () => {
      expect(removeVietnameseAccents('Điện thoại')).toBe('Dien thoai')
      expect(removeVietnameseAccents('đường')).toBe('duong')
      expect(removeVietnameseAccents('Đại học')).toBe('Dai hoc')
    })

    it('should handle all five Vietnamese tones', () => {
      // a, à, á, ả, ã, ạ
      expect(removeVietnameseAccents('à')).toBe('a')
      expect(removeVietnameseAccents('á')).toBe('a')
      expect(removeVietnameseAccents('ả')).toBe('a')
      expect(removeVietnameseAccents('ã')).toBe('a')
      expect(removeVietnameseAccents('ạ')).toBe('a')

      // e, è, é, ẻ, ẽ, ẹ, ê, ề, ế, ể, ễ, ệ
      expect(removeVietnameseAccents('è')).toBe('e')
      expect(removeVietnameseAccents('é')).toBe('e')
      expect(removeVietnameseAccents('ê')).toBe('e')
      expect(removeVietnameseAccents('ề')).toBe('e')
      expect(removeVietnameseAccents('ế')).toBe('e')

      // o, ò, ó, ỏ, õ, ọ, ô, ồ, ố, ổ, ỗ, ộ, ơ, ờ, ớ, ở, ỡ, ợ
      expect(removeVietnameseAccents('ò')).toBe('o')
      expect(removeVietnameseAccents('ô')).toBe('o')
      expect(removeVietnameseAccents('ơ')).toBe('o')

      // u, ù, ú, ủ, ũ, ụ, ư, ừ, ứ, ử, ữ, ự
      expect(removeVietnameseAccents('ù')).toBe('u')
      expect(removeVietnameseAccents('ư')).toBe('u')

      // i, ì, í, ỉ, ĩ, ị
      expect(removeVietnameseAccents('ì')).toBe('i')
      expect(removeVietnameseAccents('í')).toBe('i')

      // y, ỳ, ý, ỷ, ỹ, ỵ
      expect(removeVietnameseAccents('ỳ')).toBe('y')
      expect(removeVietnameseAccents('ý')).toBe('y')
    })

    it('should handle full Vietnamese phrases', () => {
      expect(removeVietnameseAccents('Hà Nội')).toBe('Ha Noi')
      expect(removeVietnameseAccents('Thành phố Hồ Chí Minh')).toBe(
        'Thanh pho Ho Chi Minh',
      )
      expect(removeVietnameseAccents('Đà Nẵng')).toBe('Da Nang')
      expect(removeVietnameseAccents('Sửa điều hòa')).toBe('Sua dieu hoa')
      expect(removeVietnameseAccents('Máy lạnh')).toBe('May lanh')
    })

    it('should preserve non-Vietnamese text', () => {
      expect(removeVietnameseAccents('Hello World')).toBe('Hello World')
      expect(removeVietnameseAccents('123 456')).toBe('123 456')
      expect(removeVietnameseAccents('Test@example.com')).toBe(
        'Test@example.com',
      )
    })

    it('should preserve case', () => {
      expect(removeVietnameseAccents('NGUYỄN VĂN A')).toBe('NGUYEN VAN A')
      expect(removeVietnameseAccents('Nguyễn Văn A')).toBe('Nguyen Van A')
      expect(removeVietnameseAccents('nguyễn văn a')).toBe('nguyen van a')
    })

    it('should handle empty strings', () => {
      expect(removeVietnameseAccents('')).toBe('')
    })

    it('should handle strings with only accents', () => {
      expect(removeVietnameseAccents('áéíóú')).toBe('aeiou')
    })

    it('should handle mixed Vietnamese and English', () => {
      expect(removeVietnameseAccents('Nguyễn Văn A - Developer')).toBe(
        'Nguyen Van A - Developer',
      )
      expect(
        removeVietnameseAccents(
          'Email: test@example.com, Số điện thoại: 0987654321',
        ),
      ).toBe('Email: test@example.com, So dien thoai: 0987654321')
    })
  })

  describe('normalizeForSearch', () => {
    it('should convert to lowercase and remove accents', () => {
      expect(normalizeForSearch('NGUYỄN VĂN A')).toBe('nguyen van a')
      expect(normalizeForSearch('Trần Thị B')).toBe('tran thi b')
      expect(normalizeForSearch('Điện Thoại')).toBe('dien thoai')
    })

    it('should handle Vietnamese addresses', () => {
      expect(
        normalizeForSearch('Số 123, Đường Láng, Quận Đống Đa, Hà Nội'),
      ).toBe('so 123, duong lang, quan dong da, ha noi')
    })

    it('should normalize customer names', () => {
      expect(normalizeForSearch('Nguyễn Văn A')).toBe('nguyen van a')
      expect(normalizeForSearch('Phạm Thị Hương')).toBe('pham thi huong')
    })

    it('should normalize task titles', () => {
      expect(normalizeForSearch('Sửa điều hòa gấp')).toBe('sua dieu hoa gap')
      expect(normalizeForSearch('Lắp đặt máy lạnh')).toBe('lap dat may lanh')
    })

    it('should handle empty strings', () => {
      expect(normalizeForSearch('')).toBe('')
    })

    it('should handle phone numbers', () => {
      expect(normalizeForSearch('0987654321')).toBe('0987654321')
    })

    it('should handle mixed case and accents', () => {
      expect(normalizeForSearch('Đại HỌC BÁch KHOA')).toBe('dai hoc bach khoa')
    })
  })

  describe('Search comparison use cases', () => {
    it('should match search query with database text', () => {
      const dbText = 'Nguyễn Văn A'
      const searchQuery = 'nguyen van'

      expect(normalizeForSearch(dbText)).toContain(
        normalizeForSearch(searchQuery),
      )
    })

    it('should match partial address search', () => {
      const dbAddress = 'Số 123, Đường Láng, Quận Đống Đa, Hà Nội'
      const searchQuery = 'duong lang'

      expect(normalizeForSearch(dbAddress)).toContain(
        normalizeForSearch(searchQuery),
      )
    })

    it('should match phone number search', () => {
      const dbPhone = '0987654321'
      const searchQuery = '0987'

      expect(normalizeForSearch(dbPhone)).toContain(
        normalizeForSearch(searchQuery),
      )
    })

    it('should match task ID search', () => {
      const dbId = '123'
      const searchQuery = '12'

      expect(dbId).toContain(searchQuery)
    })

    it('should support case-insensitive title search', () => {
      const dbTitle = 'Sửa điều hòa'
      const searchQuery = 'SUA DIEU HOA'

      expect(normalizeForSearch(dbTitle)).toBe(normalizeForSearch(searchQuery))
    })
  })

  describe('Performance considerations', () => {
    it('should handle large texts efficiently', () => {
      const largeText =
        'Nguyễn Văn A '.repeat(1000) + 'Đường Láng '.repeat(1000)

      const startTime = Date.now()
      const result = normalizeForSearch(largeText)
      const endTime = Date.now()

      expect(result).toBeTruthy()
      expect(endTime - startTime).toBeLessThan(100) // Should complete in < 100ms
    })

    it('should handle many consecutive calls', () => {
      const texts = [
        'Nguyễn Văn A',
        'Trần Thị B',
        'Phạm Văn C',
        'Lê Thị D',
        'Hoàng Văn E',
      ]

      const startTime = Date.now()
      for (let i = 0; i < 1000; i++) {
        for (const text of texts) {
          normalizeForSearch(text)
        }
      }
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // 5000 calls in < 1 second
    })
  })
})
