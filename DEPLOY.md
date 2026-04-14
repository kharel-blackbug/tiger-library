# Deploying Tiger's Library

The app runs as a single Node.js server that serves both the API and the
built React frontend. You need:

- **Node.js 22+**
- **3 environment variables** (minimum): `JWT_SECRET`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`
- **Persistent storage** for the SQLite DB (~1MB) and temp image uploads

---

## Option 1: Railway (Recommended — easiest)

Railway gives you a public URL, persistent storage, and automatic deploys
from GitHub. Free tier is enough for personal use.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. From inside the project folder:
railway init          # creates a new project
railway volume add    # add persistent volume → mount at /data
railway up            # deploy

# 4. Set environment variables in Railway dashboard:
#    JWT_SECRET     = (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
#    ADMIN_PASSWORD = your-secure-password
#    ANTHROPIC_API_KEY = sk-ant-...
#    NODE_ENV       = production
```

Railway auto-detects `railway.toml` and uses it. Your app will be live at
`https://tigers-library-production.up.railway.app` (or similar).

---

## Option 2: Fly.io (Free, runs near Gangtok)

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. From inside the project:
fly launch            # detects Dockerfile, creates app
fly volumes create tigers_library_data --size 1  # 1GB persistent volume
fly secrets set \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  ADMIN_PASSWORD="your-secure-password" \
  ANTHROPIC_API_KEY="sk-ant-..."
fly deploy
```

Your app is live at `https://tigers-library.fly.dev`.

---

## Option 3: Your existing VPS (same as SASCI portal)

If you already have a VPS (DigitalOcean, Hetzner, etc.) with nginx:

```bash
# On your VPS:
cd /var/www
git clone https://github.com/yourusername/tigers-library-react.git
cd tigers-library-react
cp .env.example .env
nano .env   # fill in JWT_SECRET, ADMIN_PASSWORD, ANTHROPIC_API_KEY

npm install
npm run build

# Run with PM2 (keeps it alive)
npm install -g pm2
pm2 start server/index.js --name tigers-library
pm2 save
pm2 startup

# Nginx config: /etc/nginx/sites-available/tigers-library
```

```nginx
server {
    listen 80;
    server_name library.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 25M;   # for image uploads
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tigers-library /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Add SSL with Let's Encrypt:
sudo certbot --nginx -d library.yourdomain.com
```

---

## Option 4: Render

```bash
# 1. Push to GitHub (already done)
# 2. Go to render.com → New → Web Service → connect your repo
# 3. Settings:
#    Build Command:  npm install && npm run build
#    Start Command:  npm start
#    Environment:    Node
# 4. Add environment variables in the Render dashboard
# 5. Add a Disk: mount path /data, size 1GB
```

---

## After deploying (all options)

1. Open your public URL
2. Log in with `admin` / your `ADMIN_PASSWORD`
3. Go to **Settings** → connect your Google Sheet
4. Your library is live 🏔

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Random 32+ char string. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD` | ✅ | Your admin password. Change from default. |
| `ANTHROPIC_API_KEY` | ✅ | For AI book scanning. Get free at console.anthropic.com |
| `ADMIN_USERNAME` | optional | Default: `admin` |
| `NODE_ENV` | optional | Set to `production` on server |
| `PORT` | optional | Default: `3001`. Railway/Render set this automatically. |
| `JWT_EXPIRY` | optional | Default: `7d` |
