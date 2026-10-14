# GT Shopping — Go-Live Checklist
**Site:** https://www.gtshoppingonline.in  
**Stack:** Next.js 16 · Prisma/Neon · Razorpay · Resend/SMTP · MSG91 · Vercel Blob  
**Last verified:** production build passes locally (tsc + next build)

> **Rule:** Do not deploy until every ⬜ blocker below is ✅ and you explicitly approve deploy.

---

## 1. Brand & content (mostly done)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | Brand name = GT Shopping everywhere | ✅ | Header, footer, emails, PDFs, covers, sitemap |
| 1.2 | Domain = gtshoppingonline.in | ✅ | middleware, sitemap, robots, canonical |
| 1.3 | Digital-only copy (no shipping/COD) | ✅ | |
| 1.4 | Product covers free of "Inkberry Press" | ✅ | All `public/products/*.svg` → GT Shopping |
| 1.5 | Admin Site Settings page | ✅ | `/admin/settings` — name, email, announcement, footer, phone/WhatsApp |
| 1.6 | Legal pages | ✅ | `/tc`, `/privacy-policy`, `/refund-policy`, `/license`, `/contact`, `/faq` |
| 1.7 | OG image `/og-image.png` | ⬜ | Confirm file exists and looks correct |
| 1.8 | Favicon | ✅ | Updated to GT |

---

## 2. Database & seed

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | Neon DB connected | ✅ | `DATABASE_URL` in `.env` |
| 2.2 | Schema pushed (`prisma db push`) | ⬜ | Run after any schema change (incl. `phoneVerified` if not yet pushed) |
| 2.3 | Catalogue seeded | ✅ | Re-run **only** if you want demo products back — wipes admin product edits |
| 2.4 | 9 featured products | ✅ | |
| 2.5 | Admin account exists | ✅ | Email + password (see `scripts/create-admin.ts`) |
| 2.6 | Test PENDING orders cleaned | ⬜ | Old `GT-XXXXXX` PENDING rows — delete or ignore before real traffic |

---

## 3. Payments (Razorpay)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | Live keys in `.env` | ✅ | `RAZORPAY_KEY_ID` = `rzp_live_...` |
| 3.2 | **Rotate secrets before prod** | ⬜ | Secrets are in git-tracked workflow history — regenerate key secret if repo is public/shared |
| 3.3 | Admin payment mode = **live** | ⬜ | Admin → Settings / store key `payment_mode` must be `live` (code defaults to `test` if missing) |
| 3.4 | Webhook secret | ⬜ | `.env` still `dev-webhook-secret-change-in-prod` — set a long random secret |
| 3.5 | Razorpay dashboard webhook | ⬜ | URL: `https://www.gtshoppingonline.in/api/razorpay/webhook` · events: `payment.captured` · same secret as 3.4 |
| 3.6 | ₹1 live test purchase | ⬜ | Full flow: cart → checkout → pay → PAID → download link |
| 3.7 | Server-computed amounts only | ✅ | Never trust client price |
| 3.8 | Order email on payment | ✅ | `markOrderPaid` → `sendOrderConfirmation` with download URL |

---

## 4. Email (OTP + order delivery)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | Resend API key | ✅ | Present |
| 4.2 | **Verify Resend domain** | ⬜ | Free Resend only delivers to account owner unless `gtshoppingonline.in` is verified |
| 4.3 | SMTP fallback (Gmail) | ✅ | Resend fail → Gmail SMTP (app password) |
| 4.4 | From address | ✅ | `GT Shopping <noreply@gtshoppingonline.in>` — may need Resend domain + Gmail "Send as" alignment |
| 4.5 | OTP email template | ✅ | GT Shopping branded |
| 4.6 | Order confirmation + download link | ✅ | |
| 4.7 | Live email smoke test | ⬜ | Trigger OTP + order email; confirm inbox (not spam) |

---

## 5. SMS OTP (MSG91)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | MSG91 auth key | ✅ | |
| 5.2 | Flow IDs (signup + login) | ✅ | Wired to Flow API (`MSG91_FLOW_ID_*`) |
| 5.3 | OTP verify key format | ✅ | `+91XXXXXXXXXX` with multi-candidate verify |
| 5.4 | DLT templates approved | ⬜ | MSG91/Indian DLT — templates must be approved for sender |
| 5.5 | Live SMS smoke test | ⬜ | Send OTP to a real mobile; receive SMS; verify |

---

## 6. Auth & account rules

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | Admin login only at `/admin/login` | ✅ | Separate from customer `/login` |
| 6.2 | Customer login only at `/login` | ✅ | Email OTP |
| 6.3 | Middleware protects `/admin/*` | ✅ | JWT role ADMIN |
| 6.4 | Admin cannot be deleted | ⬜ | **TODO:** block DELETE of any ADMIN user in `/api/admin/users` |
| 6.5 | Email + mobile mandatory for payment | ⬜ | **TODO:** gate checkout until email + SMS OTP verified |
| 6.6 | `phoneVerified` on User | ⬜ | Schema field added; run `db push` + wire session/checkout gate |
| 6.7 | Weak NextAuth secret | ⬜ | Replace `ecommerce-secret-key-2026` with `openssl rand -base64 32` |

---

## 7. PDF delivery

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Product PDFs on local `data/files/` | ✅ | Dev fallback |
| 7.2 | **Vercel Blob for production PDFs** | ⬜ | `BLOB_READ_WRITE_TOKEN` empty — on Vercel create **private** Blob store |
| 7.3 | Signed download URLs | ✅ | HMAC + TTL |
| 7.4 | Guest download via receipt token | ✅ | `/download/[orderNumber]?t=` |
| 7.5 | Account My Downloads | ✅ | |
| 7.6 | Paid order gets email download link | ✅ | |
| 7.7 | Free sample PDFs | ✅ | `/free` + `/api/samples/[key].pdf` |
| 7.8 | Demo PDFs use real colouring art | ✅ | SVG→PDF converter |
| 7.9 | Sample PDF magic bytes valid | ✅ | `%PDF` |
| 7.10 | **Re-upload PDFs after Blob connect** | ⬜ | Files currently local only — re-seed or re-upload via Admin → Products for production |

---

## 8. Frontend / UX

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8.1 | Homepage hero + featured | ✅ | |
| 8.2 | PLP filters (category, age) | ✅ | |
| 8.3 | PDP gallery `object-contain` (no crop) | ✅ | |
| 8.4 | Wishlist icon in header | ✅ | With badge count |
| 8.5 | Sticky mobile buy bar | ✅ | |
| 8.6 | Peek-inside sample previews | ✅ | |
| 8.7 | Cart / checkout | ✅ | |
| 8.8 | 404 page | ✅ | `/not-found` |
| 8.9 | Mobile responsive smoke | ⬜ | Manually check 360px width |

---

## 9. Admin panel

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9.1 | Dashboard stats | ✅ | |
| 9.2 | Products CRUD + cover upload | ✅ | |
| 9.3 | Categories CRUD | ✅ | |
| 9.4 | Orders (status read-only) | ✅ | Set by payment flow only |
| 9.5 | Customers list | ✅ | |
| 9.6 | Coupons | ✅ | |
| 9.7 | Site settings | ✅ | |
| 9.8 | Payment mode toggle live/test | ⬜ | Confirm set to **live** |

---

## 10. Production environment (Vercel)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 10.1 | Domain `www.gtshoppingonline.in` + apex redirect | ⬜ | Vercel Domains; apex → www (middleware also redirects bare → www) |
| 10.2 | `NEXTAUTH_URL` = `https://www.gtshoppingonline.in` | ⬜ | Still localhost in `.env` |
| 10.3 | `NEXT_PUBLIC_SITE_URL` = `https://www.gtshoppingonline.in` | ⬜ | Still localhost |
| 10.4 | All env vars copied to Vercel Project Settings | ⬜ | See list below |
| 10.5 | HTTPS + HSTS | ⬜ | Default on Vercel |
| 10.6 | Analytics GA (optional) | ⬜ | `NEXT_PUBLIC_GA_ID` |

### Env vars required on Vercel
```
DATABASE_URL
NEXTAUTH_URL=https://www.gtshoppingonline.in
NEXTAUTH_SECRET=<strong random>
NEXT_PUBLIC_SITE_URL=https://www.gtshoppingonline.in
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY
EMAIL_FROM
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
MSG91_AUTH_KEY
MSG91_FLOW_ID_SIGNUP
MSG91_FLOW_ID_LOGIN
BLOB_READ_WRITE_TOKEN   (from private Blob store)
NEXT_PUBLIC_GA_ID       (optional)
```

---

## 11. Security

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11.1 | No secrets in code | ✅ | Secrets only in `.env` (never commit `.env`) |
| 11.2 | Strong `NEXTAUTH_SECRET` | ⬜ | Currently weak |
| 11.3 | Strong Razorpay webhook secret | ⬜ | Currently placeholder |
| 11.4 | Admin password strong | ⬜ | Change from default if shared |
| 11.5 | Private Blob for product PDFs | ⬜ | Never public access for paid files |
| 11.6 | Admin API auth | ✅ | Session role check |

---

## 12. SEO & performance

| # | Item | Status | Notes |
|---|------|--------|-------|
| 12.1 | Sitemap | ✅ | `/sitemap.xml` |
| 12.2 | Robots | ✅ | `/robots.txt` |
| 12.3 | Canonical + OG | ✅ | From site settings + env URL |
| 12.4 | JSON-LD | ✅ | WebSite + Organization |
| 12.5 | Lighthouse pass | ⬜ | Run on live URL after deploy |

---

## 13. Pre-deploy smoke tests (local or preview)

Run after setting production-like env (https URL, live Razorpay, Blob):

1. [ ] Home, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/free`, `/faq` → 200  
2. [ ] Email OTP login works (inbox)  
3. [ ] SMS OTP works (phone)  
4. [ ] Admin login `/admin/login` works  
5. [ ] Product create / edit / delete / cover upload  
6. [ ] ₹1 payment (test or live key) → order PAID  
7. [ ] Order confirmation email with download link  
8. [ ] Download PDF opens (magic bytes + content)  
9. [ ] Webhook signature accepted (or client verify path)  
10. [ ] 404 page, bad sample key → 404  
11. [ ] No "Inkberry" text on any public page  
12. [ ] Wishlist + cart badges work  

---

## 14. Open engineering TODOs (blocking full launch rules)

| Priority | Task |
|----------|------|
| **P0** | Wire checkout: require verified email + mobile (SMS OTP) before payment; server-side on `/api/orders` + `/api/razorpay/order` |
| **P0** | Protect ADMIN users from delete/demote in `/api/admin/users` |
| **P0** | Set `payment_mode` = `live` in store settings |
| **P0** | Vercel Blob + re-upload product PDFs |
| **P1** | Strong secrets + real webhook secret |
| **P1** | `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` production values |
| **P1** | Verify Resend domain OR rely on Gmail SMTP only |
| **P1** | MSG91 DLT + live SMS test |
| **P2** | Clean old PENDING test orders |
| **P2** | Manual mobile UX pass |

---

## 15. Deploy command (only after approval)

```bash
# Do NOT run until user says deploy
vercel --prod
# or push to the linked Git branch
```

**I will not deploy without your explicit go-ahead.**

---

## Quick status summary

| Area | Ready? |
|------|--------|
| Design / brand / content | ✅ Yes |
| Admin panel | ✅ Yes (delete-admin + payment gate still open) |
| Payments | 🟡 Code ready; webhook secret + live mode + test needed |
| Email | 🟡 Dual provider ready; domain/DNS + smoke test needed |
| SMS | 🟡 Code + keys ready; DLT + live test needed |
| PDF delivery | 🟡 Local works; **Vercel Blob required for prod** |
| Auth hardening | 🟡 Partial; phone/email payment gate not wired yet |
| Vercel env | ⬜ Not configured (URLs still localhost in `.env`) |

**Bottom line:** Design revamp is in good shape. Before replacing the live site: finish P0 auth gates, Blob PDFs, live payment mode, webhook secret, and Vercel env — then run the smoke tests. I have **not** deployed.
