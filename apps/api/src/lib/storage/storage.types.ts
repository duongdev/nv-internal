export interface PutObjectInput {
  key: string
  body: Blob | ArrayBuffer | ReadableStream
  contentType: string
}

export interface PutObjectResult {
  key: string
}

export interface GetSignedUrlOptions {
  expiresInSec?: number
  dispositionFilename?: string
}

export interface StorageProvider {
  put(input: PutObjectInput): Promise<PutObjectResult>
  delete(key: string): Promise<void>
  getSignedUrl(key: string, opts?: GetSignedUrlOptions): Promise<string>
  readonly name: string
}


