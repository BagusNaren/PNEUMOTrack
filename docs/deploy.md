# Backend deployment guide (VPS)

> **Status: not executed.** No VPS/domain credentials were available. Everything below is ready to run; the checklist marks what still needs a human with server access.

Target: Biznet Gio VPS, Ubuntu 24.04, ≥ 2 GB RAM, domain/subdomain, HTTPS.

## 1. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx ufw
sudo usermod -aG docker "$USER"   # re-login afterwards
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

## 2. Build and run the API

```bash
git clone <repo> /opt/pneumotrack && cd /opt/pneumotrack
docker build -t pneumotrack-api server_side
docker run -d --name pneumotrack-api --restart always \
  -p 127.0.0.1:8000:8000 \
  -e CORS_ORIGINS="https://your-app-domain" \
  pneumotrack-api
```

Model loads at startup; allow 30–60 s before `/health` returns ok.

### Option B — systemd + venv (no Docker)

```ini
# /etc/systemd/system/pneumotrack-api.service
[Unit]
Description=PNEUMOTrack FastAPI
After=network.target

[Service]
User=pneumotrack
WorkingDirectory=/opt/pneumotrack/server_side
Environment=CORS_ORIGINS=https://your-app-domain
ExecStart=/opt/pneumotrack/server_side/.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000 --workers 1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now pneumotrack-api
```

## 3. Nginx + HTTPS

```nginx
# /etc/nginx/sites-available/pneumotrack
server {
    listen 80;
    server_name api.your-domain.example;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pneumotrack /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.your-domain.example
```

Verify from a phone on mobile data:

```bash
curl https://api.your-domain.example/health
```

## 4. Logging & monitoring

- Docker: `docker logs --since 1h pneumotrack-api` (request id, status, timing only — no filenames or child data).
- `logrotate` for systemd deployments:

```conf
/var/log/pneumotrack-api.log {
  daily
  rotate 7
  compress
  missingok
  notifempty
}
```

- Watch memory (`docker stats`): TensorFlow CPU usually needs ~800 MB–1.2 GB RSS.
- Target response time < 10 s per request; check with `curl -w "%{time_total}"`.

## 5. Checklist

- [ ] DNS A record points to the VPS
- [ ] `docker run` / systemd service starts on boot (`--restart always` / `enable`)
- [ ] `/health` returns ok over HTTPS
- [ ] `client_max_body_size 10m` and 90 s timeouts set
- [ ] `CORS_ORIGINS` set to the app origin in production
- [ ] UFW allows only SSH + HTTP/HTTPS
- [ ] Logs contain no audio, filenames, or child identifiers
- [ ] `EXPO_PUBLIC_API_URL` shared with Member B/C after the domain is live

## 6. Realtime (Supabase)

Realtime for `messages` is enabled by the migration (`alter publication supabase_realtime add table public.messages`). For the hosted project, verify under **Database → Publications** that `messages` is listed. Chat is P2; skip if the team hides it.
