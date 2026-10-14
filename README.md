# Inkberry Press

Print. Colour. Create.

A digital-products e-commerce store selling downloadable PDFs — colouring books, activity books, worksheets, planners and bundles — with instant, secure post-payment delivery. Built with Next.js (App Router), Prisma + PostgreSQL, Razorpay and Vercel Blob.

## Features

- **Catalogue** — singles and multi-file bundles, category filters, search, pagination
- **Cart & guest checkout** — server-computed amounts, coupons, Razorpay (UPI / cards / netbanking)
- **Secure downloads** — HMAC-signed receipt tokens (guest) or session auth (account); links expire after 30 days; per-file and per-item routes; download events logged
- **Email delivery** — branded confirmation emails (Resend) with download CTA; OTP login emails
- **Admin** — dashboard (revenue, top sellers, newsletter), products (digital fields, PDF/ZIP upload, bundle builder, cover images), orders (PENDING / PAID / COMPLETED / FAILED / REFUNDED), categories, coupons, customers, newsletter subscribers
- **Storage** — private Vercel Blob in production; local filesystem fallback (`data/files/`) in dev when `BLOB_READ_WRITE_TOKEN` is unset
- **SEO** — metadata, JSON-LD (WebSite, Organization, Product, BreadcrumbList), sitemap, robots, OG image

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# fill in DATABASE_URL (Neon Postgres), NEXTAUTH_SECRET, Razorpay keys, etc.

# 3. Push schema and generate the client
npx prisma db push

# 4. Seed the demo catalogue (10 categories, 25 products incl. demo PDFs)
npm run db:seed

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for the full list. The ones you must set:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | NextAuth base URL and secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used in metadata, emails, sitemap |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side Razorpay credentials |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Key ID exposed to the checkout client |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for `POST /api/razorpay/webhook` (set the same value in the Razorpay dashboard) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email (OTP + order delivery) |
| `BLOB_READ_WRITE_TOKEN` | Optional in dev (falls back to `data/files/`); required in production for private Blob storage |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Prisma generate + production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type-check |
| `npm run db:seed` | Seed demo categories, products, files and covers |

## Payment & delivery flow

1. Cart → `/checkout` (guest-friendly; email captured server-side).
2. `POST /api/orders` creates a `PENDING` order (`IB-XXXXXX`) with server-priced items and an optional coupon.
3. `POST /api/razorpay/order` creates a Razorpay order for the server-computed amount and stores `razorpayOrderId`.
4. Client opens the Razorpay modal; on success `POST /api/razorpay/verify` checks the HMAC signature, marks the order `PAID` (idempotent via `markOrderPaid`), and returns a signed `receiptToken`.
5. `POST /api/razorpay/webhook` provides a server-to-server fallback for the same transition.
6. `GET /download/[orderNumber]?t=<receiptToken>` (or session auth) lists the order's files.
7. `GET /api/downloads/[orderNumber]/[itemId]` streams each file via short-lived signed URLs (Blob) or signed local paths (dev).

## Admin

Sign in at `/admin/login` with an `ADMIN` role user. Create one with:

```bash
npx tsx scripts/create-admin.ts
```

## Deployment notes

- Set `NEXT_PUBLIC_SITE_URL` to your production domain.
- Connect a **private** Vercel Blob store (OIDC) and leave `BLOB_READ_WRITE_TOKEN` unset on Vercel, or set the token explicitly.
- Configure the Razorpay webhook to `https://<domain>/api/razorpay/webhook` with events `payment.captured` and `payment.failed`, and set `RAZORPAY_WEBHOOK_SECRET` to the same value.
- Run `npx prisma db push` against the production database before the first deploy.
