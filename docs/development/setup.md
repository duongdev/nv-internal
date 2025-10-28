# Environment Setup

Complete setup guide for the NV Internal development environment.

## Prerequisites

1. Install pnpm package manager
2. Install Docker (for local database)
3. Node.js 18+ installed

## Initial Setup

1. Clone repository
   ```bash
   git clone <repository-url>
   cd nv-internal
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   - Copy `.env.example` files in `apps/api/` and `apps/mobile/`
   - Fill in required values (database URL, Clerk keys, etc.)

4. Start local database (optional)
   ```bash
   cd apps/api
   docker compose -f docker-compose.dev.yml up -d
   ```

5. Run database migrations
   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

6. Start API server
   ```bash
   # From root of monorepo
   npx vc dev
   ```

7. Start mobile app (in another terminal)
   ```bash
   cd apps/mobile
   pnpm dev
   ```

## Environment Variables

### API (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk authentication key
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `STORAGE_PROVIDER` - `vercel-blob` or `local-disk`
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (if using Vercel Blob)

### Mobile (.env)
- `EXPO_PUBLIC_API_URL` - API endpoint URL
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

## Troubleshooting

### Prisma Client Issues
If you see Prisma client errors:
```bash
pnpm --filter @nv-internal/prisma-client build
```

### TypeScript Errors
Run type checking:
```bash
npx tsc --noEmit
```

### Cache Issues
Clear caches:
```bash
# Mobile
cd apps/mobile
pnpm clean

# API
cd apps/api
rm -rf .vercel
```
