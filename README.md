# Zebella Designs — storefront

Next.js storefront. All data and business logic (catalog, auth, cart, orders, payments) live in the
separate Python backend; this app only talks to it through `src/lib/api/client.ts`.

## Setup

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to the backend base URL
npm install
npm run dev
```

## Backend contract this app expects (all JSON, `Authorization: Bearer <token>` when signed in)

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login` → `{ token, user, profile? }`; `GET /auth/me`; `POST /auth/logout`, `/auth/password-reset`, `/auth/resend-verification`; `PATCH /me/profile` |
| Catalog (public) | `GET /catalog/products`, `/catalog/categories`, `/catalog/collections`, `GET /products/by-ids?ids=a,b` → `{ products }` |
| Content (public) | `GET /content/settings`, `/content/homepage`, `/content/banners`, `/content/testimonials` |
| Cart | `GET /cart`, `PUT /cart`, `POST /cart/quote` → `{ quote }` |
| Checkout | `POST /checkout` → payment session, `POST /checkout/verify`, `POST /checkout/retry` |
| Orders | `GET /orders` → `{ orders }`, `GET /orders/:id`, `POST /orders/track` |
| Forms | `POST /contact`, `POST /newsletter` |

Errors: `{ "error": "message", "code"?: "..." }`. Shapes follow `src/lib/types.ts` and `src/lib/content.ts`.

## Scripts

`npm run dev | build | lint | typecheck | test | e2e`
