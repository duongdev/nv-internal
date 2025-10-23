import type { UserPublicMetadata } from '@nv-internal/validation'

declare global {
  /**
   * Custom JWT session claims added via Clerk Dashboard
   *
   * Configuration location: Clerk Dashboard → Sessions → Customize session token
   *
   * Claims structure:
   * {
   *   "metadata": {
   *     "roles": "{{user.public_metadata.roles}}",
   *     "phoneNumber": "{{user.public_metadata.phoneNumber}}",
   *     "defaultPasswordChanged": "{{user.public_metadata.defaultPasswordChanged}}"
   *   }
   * }
   */
  interface CustomJwtSessionClaims {
    metadata?: UserPublicMetadata
  }
}

export {}
