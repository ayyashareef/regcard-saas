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
