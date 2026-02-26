# Cloudflare CDN Setup (Optional)

Use this only if you want globally cached static assets. Matrix works without it.

## 1) Create/Use a Cloudflare Zone
- Add your domain to Cloudflare.
- Keep DNS records for your app hostnames proxied (orange cloud).

## 2) Pick a CDN prefix URL
- Example: `https://cdn.yourdomain.com`
- Point `cdn.yourdomain.com` to your app host via CNAME.

## 3) Configure Matrix env
Set in your production env:

```bash
CDN_ASSET_PREFIX=https://cdn.yourdomain.com
```

This value is read by all Next app configs as `assetPrefix`.

## 4) Add Cloudflare cache rules
Recommended rules:
- Path contains `/_next/static/`
- Cache level: Cache Everything
- Edge TTL: 1 month+
- Respect origin cache-control headers: enabled

## 5) Verify
Run:

```bash
npm run prod:readiness
```

Expected CDN check result:
- `ok: true`
- reason shows valid URL

## Notes
- `CDN_ASSET_PREFIX` is optional; leave unset to serve assets directly from origin.
- If you use multiple domains/environments, set a different prefix per environment.
