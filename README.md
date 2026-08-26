# donate_zks95

Open source developer site with projects, donations, admin panel, YooKassa payments, and VPS deployment notes.

## Local

```bash
npm install
npm run dev
```

## Env

Copy `.env.example` to `.env.local` and fill:

- `SITE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `YOOKASSA_WEBHOOK_SECRET`

## Admin

Open `/admin/login`, sign in, then edit site settings and donation data in `/admin`.

## VPS + HTTPS

1. Run the app with `npm run build` and `npm run start` behind `systemd`.
2. Put nginx in front of Node on `127.0.0.1:3000`.
3. Issue SSL with `certbot --nginx`.
4. Set `SITE_URL` to the final `https://` domain.

## One-liners

Install:

```bash
curl -fsSL "https://raw.githubusercontent.com/kzolotarev95/donate_zks95/main/vps/install-vps.sh?v=$(date +%s)" | sudo sh -s -- your-domain.ru
```

Remove:

```bash
curl -fsSL "https://raw.githubusercontent.com/kzolotarev95/donate_zks95/main/vps/uninstall-vps.sh?v=$(date +%s)" | sudo sh -s -- your-domain.ru
```

## YooKassa

- Payment creation: `/api/payments/create`
- Webhook: `/api/payments/webhook?secret=...`

Set the same webhook secret in YooKassa and in `.env.local`.
