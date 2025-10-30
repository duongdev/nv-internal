import { describe, expect, it } from '@jest/globals'
import { normalizeForSearch } from '../text-utils'

describe('Debug search normalization', () => {
  it('should show normalization for "Mua quat" use case', () => {
    const searchTerm = 'Mua quat'
    const title = 'Mua quat'

    const normalizedSearch = normalizeForSearch(
      searchTerm.trim().replace(/\s+/g, ' '),
    )
    const normalizedTitle = normalizeForSearch(title).replace(/\s+/g, ' ')

    console.log('=== Debug Search Normalization ===')
    console.log('Search term:', searchTerm)
    console.log('Title:', title)
    console.log('Normalized search:', normalizedSearch)
    console.log('Normalized title:', normalizedTitle)
    console.log('Match:', normalizedTitle.includes(normalizedSearch))
    console.log('===================================')

    expect(normalizedTitle.includes(normalizedSearch)).toBe(true)
  })

  it('should show normalization with different titles', () => {
    const searchTerm = 'Mua quat'
    const titles = [
      'Mua quat',
      'Mua quat dieu hoa',
      'Sua quat',
      'Mua dieu hoa',
      'mua  quat', // Extra space
      'MUA QUAT', // Uppercase
    ]

    console.log('\n=== Testing Different Titles ===')
    console.log('Search term:', searchTerm)
    console.log(
      'Normalized search:',
      normalizeForSearch(searchTerm.trim().replace(/\s+/g, ' ')),
    )

    for (const title of titles) {
      const normalizedTitle = normalizeForSearch(title).replace(/\s+/g, ' ')
      const matches = normalizedTitle.includes(
        normalizeForSearch(searchTerm.trim().replace(/\s+/g, ' ')),
      )
      console.log(`\nTitle: "${title}"`)
      console.log(`  Normalized: "${normalizedTitle}"`)
      console.log(`  Matches: ${matches}`)
    }
    console.log('===================================\n')
  })
})
