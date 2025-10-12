// Re-export Prisma client types from the API package's generated client.
// At runtime (Vercel bundle) the generated client lives under apps/api/generated/prisma,
// so reference it via a relative path from this package's dist output.
// @ts-ignore - generated client exists in the workspace at apps/api/generated/prisma
// Note: the relative path is chosen so the compiled JS in `dist/` will require the
// runtime client located at `apps/api/generated/prisma/client` inside the Vercel bundle.
export * from '@nv-internal/prisma-client'
