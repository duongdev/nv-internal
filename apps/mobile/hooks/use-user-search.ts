import Fuse from 'fuse.js'
import { useMemo } from 'react'
import type { User } from '@/api/user/use-user-list'
import { removeVietnameseAccents } from '@/lib/utils'
import {
  getUserFullName,
  getUserPhoneNumber,
  getUserPrimaryEmail,
} from '@/utils/user-helper'

/**
 * Searchable user data structure with normalized fields
 * All fields are normalized (lowercase, accent-removed) for fuzzy matching
 */
interface SearchableUser extends User {
  searchName: string // Normalized full name
  searchUsername: string // Normalized username
  searchPhone: string // Phone number (not normalized - numbers don't have accents)
  searchEmail: string // Normalized email
}

/**
 * Custom hook for fuzzy searching users with Fuse.js
 * Provides accent-insensitive Vietnamese search across:
 * - Full name (firstName + lastName)
 * - Username
 * - Phone number
 * - Email
 *
 * @param users - Array of users to search
 * @param searchQuery - Search query string
 * @param threshold - Fuse.js threshold (0.0 = exact match, 1.0 = match anything). Default: 0.3
 * @returns Filtered array of users matching the search query
 *
 * @example
 * const filteredUsers = useUserSearch(users, "duong") // Finds "Dương Đỗ"
 * const filteredUsers = useUserSearch(users, "091") // Finds phones starting with 091
 */
export function useUserSearch(
  users: User[] | undefined,
  searchQuery: string,
  threshold = 0.3,
): User[] {
  // Create searchable data with normalized fields
  const searchableUsers = useMemo<SearchableUser[]>(() => {
    if (!users) {
      return []
    }

    return users.map((user) => ({
      ...user,
      searchName: removeVietnameseAccents(getUserFullName(user).toLowerCase()),
      searchUsername: removeVietnameseAccents(
        (user.username || '').toLowerCase(),
      ),
      searchPhone: getUserPhoneNumber(user) || '', // Phone numbers don't need accent removal
      searchEmail: removeVietnameseAccents(
        (getUserPrimaryEmail(user) || '').toLowerCase(),
      ),
    }))
  }, [users])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      // If no search query, return original users (not searchable users)
      return users || []
    }

    // Configure Fuse.js for fuzzy matching
    const fuse = new Fuse(searchableUsers, {
      keys: ['searchName', 'searchUsername', 'searchPhone', 'searchEmail'],
      threshold, // Adjust for fuzzy matching sensitivity
      includeScore: true,
      shouldSort: true, // Sort by relevance score
      ignoreLocation: true, // Search anywhere in the string
    })

    // Normalize search query for accent-insensitive matching
    const normalizedQuery = removeVietnameseAccents(searchQuery.toLowerCase())

    // Perform fuzzy search
    const results = fuse.search(normalizedQuery)

    // Return original user objects (without search* fields)
    return results.map((result) => result.item as User)
  }, [searchableUsers, searchQuery, threshold, users])

  return filteredUsers
}
