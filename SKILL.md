# Inkberry Press — Digital Products Store Project Guide

## Quick Facts
- **Project**: Inkberry Press — printable PDF e-commerce (colouring books, activity books, worksheets, planners, bundles)
- **Stack**: Next.js 16.3.1, Prisma 7.9.1, PostgreSQL (Neon), Tailwind CSS v4, Zustand, Razorpay, Vercel Blob, Resend
- **Production URL**: https://www.gtshoppingonline.in (set via `NEXT_PUBLIC_SITE_URL`)
- **GitHub**: https://github.com/gauravjadhav007/ecommerce-store.git
- **Vercel project**: `gauravjadhav561-8665s-projects/ecommerce-store`
- **DNS**: GoDaddy
- **Admin credentials**: see `.env` / reset via `npx tsx scripts/create-admin.ts` (never commit credentials)

## User Rules
- **NEVER deploy without asking first**
- **Always test before deploying**
- **No secrets in SKILL.md** — all credentials referenced from `.env` file

## What this store sells
Digital-only. Every product is a PDF (or ZIP of PDFs) delivered instantly after Razorpay payment. There is **no physical shipping, inventory, tracking, returns-by-post, or COD**. Customers print at home. Bundles contain multiple products' files.

## Tech Details
- **Database**: PostgreSQL on Neon (`DATABASE_URL`). Workflow: `npx prisma db push` (NOT migrate — no migrations folder). Client output: `src/generated/prisma`
- **Auth**: NextAuth v4 (JWT strategy, AES-256-GCM encrypted tokens via `next-auth/jwt` encode/decode). Customer login = email+password tab OR mobile-OTP tab at `/login`; signup requires mobile OTP (`phoneVerified` set)
- **Payments**: Razorpay only. Server-computed amounts (paise). HMAC verify + webhook fallback
- **File storage**: `src/lib/storage.ts` — Vercel Blob (private) in production; local filesystem `data/files/` fallback in dev when `BLOB_READ_WRITE_TOKEN` is unset
- **Email**: Resend (`RESEND_API_KEY`), branded templates in `src/lib/email.ts`
- **Receipt tokens**: `src/lib/receipt.ts` — HMAC-signed, 30-day TTL, guest download access
- **OTP expiry**: 10 minutes

## Environment Variables (.env)
See `.env.example`. Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `MSG91_AUTH_KEY`, `MSG91_FLOW_ID_SIGNUP`/`MSG91_FLOW_ID_LOGIN`. Optional: `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` (local FS fallback otherwise), `OTP_TEST_MODE` (dev testing only — code fixed to 123456).

## Database Models (Prisma — digital additions)
| Model | Key Fields | Notes |
|-------|-----------|-------|
| Product | id, name, slug, price, compareAt, images (JSON), isActive, featured, isDigital (default true), productType (SINGLE/BUNDLE), tags, pageCount, paperSize, fileFormat, printInstructions, license, categoryId | stock exists but unused for digital (set 9999) |
| ProductFile | id, productId, fileName, storagePath, mimeType, sizeBytes, sortOrder | Cascade delete with Product |
| BundleItem | id, bundleId, productId, sortOrder | Unique [bundleId, productId] |
| Order | id, orderNumber (IB-XXXXXX unique), status (PENDING/PAID/COMPLETED/FAILED/REFUNDED/CANCELLED), total, shippingName, shippingEmail, shippingPhone, shippingAddr (nullable, stores coupon JSON metadata), razorpayOrderId (unique), paidAt, userId | No cascade delete on User |
| OrderItem | id, name, price, quantity, image, isDigital, downloaded, productId, orderId | Cascade delete with Order |
| DownloadEvent | id, orderItemId, orderId, fileName, ip, createdAt | Logs every file stream |
| NewsletterSubscriber | id, email (unique), source, consentAt | |

## Key Flows

### Purchase → delivery
1. Cart (Zustand, guest) → `/checkout` (guest-friendly; email required)
2. `POST /api/orders` — creates PENDING order with server-priced items + optional coupon
3. `POST /api/razorpay/order` — creates Razorpay order, stores `razorpayOrderId`
4. Razorpay modal → success → `POST /api/razorpay/verify` — HMAC check, `markOrderPaid()` (idempotent), returns `receiptToken`
5. `POST /api/razorpay/webhook` — server fallback (`payment.captured` / `payment.failed`)
6. `/order-confirmed?orderNumber=..&t=<token>` — download links
7. `GET /download/[orderNumber]?t=<token>` or session auth — file list page
8. `GET /api/downloads/[orderNumber]/[itemId]` — streams file (Blob signed URL or local signed path)
9. `src/lib/payments.ts markOrderPaid()` also sends the branded confirmation email with download CTA

### Auth
- Password: `/login` → `signIn("credentials")` → full page reload to callbackUrl
- Mobile OTP: `POST /api/otp/send` {phone, purpose} → `POST /api/auth/otp-login` {phone, code} → session cookies
- Signup: `/register` → Send OTP (purpose `signup`) → `POST /api/register` with `otp` → verifies + sets `phoneVerified` → redirect `/login`
- OTP verify = server-side against `otps` table (10-min expiry, single-use). `OTP_TEST_MODE=true` → fixed code `123456`, no SMS — never in production
- Admin: `/admin/login` → `/api/auth/admin-login` (bcrypt + ADMIN role)
- Tokens: `next-auth/jwt` `encode()` (AES-256-GCM). Middleware decrypts via `jose.jwtDecrypt` + `@panva/hkdf` (Edge-compatible)
- Session persists 10 years; full page reload (`window.location.href`) after login, never `router.push`

### Route protection (middleware)
- Admin (`/admin/*`): ADMIN role required
- Guest-friendly: `/cart`, `/checkout`, `/products`, all public pages
- Auth pages redirect logged-in users to `/`

## File Structure (src/app/)
```
Customer: page.tsx, products/, cart/, checkout/, order-confirmed/,
          download/[orderNumber]/, login/, register/,
          account/ (page, orders, orders/[orderNumber]/invoice, downloads),
          wishlist/, about/, faq/, contact/,
          license/, refund-policy/, privacy-policy/, tc/
Admin:    admin/ (page, login, products, orders, categories, coupons, users)
API:      api/orders/, api/razorpay/{order,verify,webhook}/,
          api/downloads/[orderNumber]/[itemId]/, api/files/local/,
          api/admin/* (incl. products/[id]/files upload, newsletter),
          api/newsletter/, api/categories/, api/coupons/validate/,
          api/auth/*, api/otp/*, api/register, api/user/*, api/reviews/
```

### Lib (src/lib/)
```
storage.ts        — putProductFile, putCoverImage, issueProductDownload, readProductFile, signLocalPath, deleteProductFile
download-auth.ts  — canAccessOrder (session or receipt token), getFilesForProduct (incl. bundle flattening)
receipt.ts        — signReceipt / verifyReceipt (HMAC, 30-day TTL)
payments.ts       — markOrderPaid (idempotent, sends email)
email.ts          — sendEmail, sendOtpEmail, sendOrderConfirmation (Inkberry branded)
razorpay.ts, coupons.ts, otp.ts, auth.ts, session.ts, prisma.ts, utils.ts
demo-pdf.ts, demo-cover.ts — seed helpers
```

## Commands
```bash
npm run dev        # Local dev
npm run build      # prisma generate && next build
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run db:seed    # Seed demo catalogue (22 singles + 3 bundles)
npx prisma db push # Sync schema to Neon
npx tsx scripts/create-admin.ts  # Create/reset admin user
scripts/gen-brand-images.cjs     # Regenerate logo.png / og-image.png (needs Playwright)
```

## Deployment Checklist (ask user before deploying)
1. `npx prisma db push` against production DB
2. Set `NEXT_PUBLIC_SITE_URL` to production domain
3. Connect private Vercel Blob store (OIDC) or set `BLOB_READ_WRITE_TOKEN`
4. Razorpay dashboard: webhook URL `https://<domain>/api/razorpay/webhook`, events `payment.captured` + `payment.failed`, secret = `RAZORPAY_WEBHOOK_SECRET`
5. Verify `EMAIL_FROM` domain is verified in Resend
6. `npm run build` locally to confirm, then ask user before `vercel deploy`
