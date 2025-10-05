declare module '@paralleldrive/cuid2' {
  export function init(options?: {
    length?: number
    fingerprint?: string
    random?: () => number
  }): () => string
  export function createId(): string
  export function isCuid(id: string): boolean
}

export {}
