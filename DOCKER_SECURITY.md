# Docker Deployment & Security Guide

## Security Updates ✅

Your Docker setup has been updated with the following security improvements:

### 1. **Localhost-Only Port Binding**
- Backend: `127.0.0.1:8000:8000` (was `8000:8000`)
- Frontend: `127.0.0.1:3000:80` (was `3000:80`)
- **Effect**: Services are only accessible from localhost, not from public internet

### 2. **Health Checks Added**
```yaml
# Backend health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/chat/health"]
  interval: 30s
  timeout: 10s
  retries: 3

# Frontend health check
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3

# Database health check
healthcheck:
  test: ["CMD", "test", "-f", "/data/pipeline.db"]
  interval: 30s
  timeout: 10s
```

### 3. **CORS Configuration**
```yaml
environment:
  - CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```
- Only allows requests from localhost frontend
- Prevents unauthorized cross-origin requests

### 4. **Environment File Management**
- `.env` file added to `.gitignore` ✓
- `.env.example` created for documentation
- **Never commit actual `.env` with secrets**

## Setup Instructions

### 1. Create .env File
```bash
# Copy the example file
cp .env.example .env

# Edit with your actual credentials
# nano .env
# or
# code .env
```

### 2. Build Docker Images
```bash
docker-compose build
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify Services
```bash
# Check all services are healthy
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs backend
docker-compose logs frontend
```

## Docker Container Networking

**Important:** Inside Docker containers, `localhost` refers to **the container itself**, not the host machine.

```
┌─────────────────────────────────────────┐
│         HOST MACHINE                    │
│  ┌─────────────────────────────────┐   │
│  │ localhost:3000 → Frontend Port  │   │
│  │ localhost:8000 → Backend Port   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
          ↓ (port binding)
┌──────────────────────────────────────────────────┐
│         DOCKER CONTAINERS (pipeline-network)     │
│                                                  │
│  ┌──────────────────┐   ┌──────────────────┐   │
│  │  frontend        │   │  backend         │   │
│  │  localhost:3000  │──→│  localhost:8000  │   │
│  │  (inside cont.)  │   │  (inside cont.)  │   │
│  └──────────────────┘   └──────────────────┘   │
│        ↕ service-to-service communication      │
│        (using service names: backend:8000)     │
└──────────────────────────────────────────────────┘
```

### Local Access (From Host Machine)
```bash
# Frontend
http://localhost:3000
http://127.0.0.1:3000

# Backend API
http://localhost:8000
http://127.0.0.1:8000

# API Documentation
http://localhost:8000/docs
```

### Container-to-Container Communication
```bash
# Backend health check (runs inside backend container)
curl http://localhost:8000/chat/health  ✅ WORKS

# Frontend to Backend (runs inside frontend container)
fetch('http://backend:8000/chat')  ✅ WORKS (service name)
fetch('http://localhost:8000/chat')  ❌ FAILS (wrong container)
```

### From Other Machines (Not Accessible)
❌ `http://your-ip-address:8000` - **BLOCKED** (localhost binding)
❌ `http://your-ip-address:3000` - **BLOCKED** (localhost binding)

## Public Internet Deployment

For public deployment, use a **reverse proxy**:

### Option 1: Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt-get install nginx

# Create config at /etc/nginx/sites-available/pipeline
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Docker Compose with Nginx (Recommended)
Add to `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  container_name: pipeline_nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./certs:/etc/nginx/certs:ro
  depends_on:
    - frontend
    - backend
  networks:
    - pipeline-network
```

## Secret Management

### Current Setup
- `.env` contains secrets
- `.env.example` shows structure (safe to commit)
- `.gitignore` prevents `.env` from being committed

### Production Setup (Optional)
```bash
# Use Docker secrets for Swarm
docker secret create db_password ./secrets/db_password.txt

# Or use environment variables in CI/CD
# GitHub Actions example
secrets:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
```

## Health Check Monitoring

### Manual Check
```bash
# Backend health
curl -f http://localhost:8000/chat/health

# Frontend health
curl -f http://localhost:3000/

# Database health
docker-compose exec db test -f /data/pipeline.db
```

### Docker Check
```bash
# View health status
docker-compose ps

# View health logs
docker inspect pipeline_backend | grep -A 10 '"Health"'
```

## Troubleshooting

### Can't connect from another machine
**This is expected.** Ports are bound to localhost only.

**Solutions:**
1. Use reverse proxy (Nginx) for public access
2. SSH tunnel: `ssh -L 3000:127.0.0.1:3000 user@server`
3. Change port binding in `docker-compose.yml` (less secure)

### Secret accidentally committed
```bash
# Remove from git history
git filter-branch --tree-filter 'rm -f .env' HEAD

# Or use git-filter-repo (better)
git filter-repo --path .env
```

### Port already in use
```bash
# Find process using port
lsof -i :8000
lsof -i :3000

# Or change port in docker-compose.yml
ports:
  - "127.0.0.1:8001:8000"  # Use 8001 instead
```

## Monitoring & Logging

### View Real-time Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 50 lines
docker-compose logs -f --tail=50 backend
```

### Log Rotation
Configured in `docker-compose.yml`:
- Max file size: 10MB
- Max files: 3
- Automatic rotation

## Performance Tips

1. **Use health checks** - Automatically restarts failed services
2. **Monitor logs** - Catch issues early
3. **Check resource usage** - `docker stats`
4. **Keep secrets safe** - Never commit `.env`
5. **Use reverse proxy** - For production internet access

## Files Changed

✅ `Dockerfile.backend` - Fixed health check URL
✅ `docker-compose.yml` - Added security configs, health checks, CORS
✅ `.env.example` - Created for documentation
✅ `.gitignore` - Already includes `.env`

## Next Steps

1. Update `.env` with actual credentials
2. Test with `docker-compose up`
3. Verify health checks pass
4. Set up reverse proxy for public access
5. Configure SSL certificates (Let's Encrypt)
6. Set up monitoring/alerting
