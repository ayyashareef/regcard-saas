# RegCard Deployment Guide — DigitalOcean Droplet

## 1. SSH into your droplet

```bash
ssh root@188.166.180.71
```

## 2. Initial Server Setup (run once)

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt install -y git

# Install build essentials (needed for sharp/native modules)
apt install -y build-essential

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Tesseract OCR (needed by tesseract.js for trained data)
apt install -y tesseract-ocr
```

## 3. Clone the Repository

```bash
mkdir -p /var/www
cd /var/www

# Option A: If using Git (recommended)
git clone <YOUR_REPO_URL> regcard
cd regcard

# Option B: If no Git repo, use SCP from your local machine:
# Run this FROM YOUR LOCAL MACHINE (not the server):
# scp -r ./regcard root@188.166.180.71:/var/www/regcard
```

## 4. Create Environment File

```bash
cd /var/www/regcard

cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="GENERATE_A_RANDOM_SECRET_HERE"
NEXTAUTH_URL="http://188.166.180.71"
EOF
```

Generate a proper secret:
```bash
openssl rand -base64 32
```
Then replace `GENERATE_A_RANDOM_SECRET_HERE` with the output.

## 5. Install Dependencies & Build

```bash
cd /var/www/regcard

# Install all dependencies (including dev for build)
npm install

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed the database (creates initial admin user)
npm run seed

# Build the Next.js app
npm run build
```

## 6. Create Logs Directory

```bash
mkdir -p /var/www/regcard/logs
mkdir -p /var/www/regcard/uploads
```

## 7. Start with PM2

```bash
cd /var/www/regcard
pm2 start ecosystem.config.js

# Save PM2 process list so it restarts on server reboot
pm2 save
pm2 startup
```

## 8. Configure Nginx Reverse Proxy

```bash
cat > /etc/nginx/sites-available/regcard << 'EOF'
server {
    listen 80;
    server_name 188.166.180.71;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/regcard /etc/nginx/sites-enabled/regcard

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx
```

## 9. Configure Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS (for later)
ufw --force enable
```

## 10. Verify Deployment

Visit http://188.166.180.71 in your browser.

## Future Deployments

After the initial setup, just run:
```bash
cd /var/www/regcard
bash deploy-regcard.sh main
```

## Optional: Set Up a Domain + HTTPS

If you have a domain name pointing to this IP:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## Troubleshooting

```bash
# Check app status
pm2 status
pm2 logs regcard

# Check Nginx
systemctl status nginx
nginx -t

# Check if port 3003 is in use
ss -tlnp | grep 3003

# Restart everything
pm2 restart regcard
systemctl restart nginx
```

---

# Multi-Tenant SaaS notes

This app is now a multi-tenant SaaS. Companies self-register at `/signup` and
work under a path prefix: `https://yourdomain.com/<org-slug>/...`. There is a
single domain and a single TLS cert — **no wildcard DNS is required** (that was
a deliberate choice; tenancy is path-based, not subdomain-based).

Key URLs:
- `/signup` — public self-serve company signup (creates an org + first admin).
- `/<slug>/login` — per-tenant login (branded with the org's logo/colors).
- `/<slug>/dashboard` … — the tenant app.
- `/platform` — operator console (PLATFORM_ADMIN only): list/suspend/reactivate
  tenants. PLATFORM_ADMIN lives in the reserved `_platform` org and signs in at
  `/_platform/login`.

## Production environment (.env)

Do **not** use the SQLite line from section 4 in production — that's local-dev
only. Use Postgres and strong secrets:

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://regcard:STRONG_PW@localhost:5432/regcard?schema=public"
AUTH_SECRET="PASTE_OUTPUT_OF_openssl_rand_base64_32"
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
UPLOAD_DIR="/var/www/regcard/uploads"
CRON_SECRET="PASTE_ANOTHER_RANDOM_SECRET"
# Seed secrets are only needed if you run `npm run seed` (creates _platform +
# a demo org). For a clean SaaS, skip seeding and create tenants via /signup.
EOF
```

`UPLOAD_DIR` holds per-tenant logos (`<orgId>/logo.*`) and passport images.
Keep it on a **persistent volume** and include it in backups — it is not in git.

## Postgres cutover (local dev is SQLite; production is Postgres)

The schema is written to be portable — the former enums are `String` columns
(values centralized in `lib/enums.ts`), so only the datasource changes. To cut
over to Postgres:

1. In `prisma/schema.prisma`, set the datasource provider:
   ```prisma
   datasource db { provider = "postgresql"  url = env("DATABASE_URL") }
   ```
2. The committed migration in `prisma/migrations/` is SQLite-flavored. For
   Postgres, regenerate a clean baseline against your prod (or a staging) DB:
   ```bash
   rm -rf prisma/migrations            # SQLite baseline; not Postgres-compatible
   DATABASE_URL=postgresql://... npx prisma migrate dev --name init
   ```
   Commit the new Postgres migration, then on the server use:
   ```bash
   npx prisma migrate deploy
   ```
3. `npx prisma generate && npm run build`.

> Tip: keep two env files (`.env` SQLite for local, server `.env` Postgres) and
> only flip the `provider` line when building for production. A future
> improvement is two schema files or a generator script if you want both
> providers in one branch without manual edits.

## Postgres install (on the droplet)

```bash
apt install -y postgresql
sudo -u postgres psql -c "CREATE USER regcard WITH PASSWORD 'STRONG_PW';"
sudo -u postgres psql -c "CREATE DATABASE regcard OWNER regcard;"
```

## Nginx for path-based tenancy

The existing single-`location /` block already works — every `/<slug>/...`
path proxies to the app and the app resolves the tenant. Just point
`server_name` at your domain and run certbot (section: HTTPS). `client_max_body_size`
should stay ≥ 20M for passport-image and logo uploads.

## Deferred: mobile API

`/api/mobile/**` is intentionally **disabled (HTTP 503)** and `lib/mobile-auth.ts`
is a stub. The chosen design for re-enabling: mobile login carries an org slug,
the issued JWT embeds `orgId`, and every mobile route scopes by it. Until that
work lands, the disabled state guarantees the mobile API cannot serve or leak
cross-tenant data.
