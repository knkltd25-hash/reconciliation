# EC2 Deployment Configuration

## Public IP: 54.145.92.198

### Configuration Updates for EC2 Deployment

Your Docker files have been updated for EC2 deployment:

#### 1. **docker-compose.yml** ✅
- **Port Bindings**: Changed from `127.0.0.1:xxxx` to `xxxx` (all interfaces)
  - Backend: `8000:8000` (was `127.0.0.1:8000:8000`)
  - Frontend: `3000:80` (was `127.0.0.1:3000:80`)
- **CORS Origins**: Updated to include public IP
  ```
  CORS_ORIGINS=http://54.145.92.198:3000,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000
  ```
- **Frontend Backend URL**: Updated to public IP
  ```
  REACT_APP_BACKEND_URL=http://54.145.92.198:8000
  ```

#### 2. **Dockerfile.backend** ✅
- **Health Check**: Updated to use `127.0.0.1` (internal container reference)
  ```dockerfile
  CMD curl -f http://127.0.0.1:8000/chat/health || exit 1
  ```

#### 3. **.env.example** ✅
- **API_URL**: `http://54.145.92.198:8000`
- **REACT_APP_BACKEND_URL**: `http://54.145.92.198:8000`
- **CORS_ORIGINS**: Includes public IP and localhost fallback

### Push to Git

Run these commands to commit and push:

```bash
cd D:\pipeline_v2

# Stage changes
git add docker-compose.yml Dockerfile.backend .env.example DOCKER_SECURITY.md

# Commit
git commit -m "Update Docker configuration for EC2 deployment with public IP 54.145.92.198"

# Push to repository
git push origin master
```

### EC2 Deployment Steps

Once on your EC2 instance:

```bash
# 1. Clone repository
git clone <your-repo-url>
cd pipeline_v2

# 2. Create .env file from template
cp .env.example .env

# 3. Edit .env with actual secrets (if different from example)
nano .env

# 4. Build Docker images
docker-compose build

# 5. Start services
docker-compose up -d

# 6. Verify services
docker-compose ps
docker-compose logs -f

# 7. Access application
# Frontend: http://54.145.92.198:3000
# Backend API: http://54.145.92.198:8000
# API Docs: http://54.145.92.198:8000/docs
```

### EC2 Instance Prerequisites

Ensure your EC2 instance has:

```bash
# Docker and Docker Compose installed
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Python (if running outside Docker)
sudo apt-get install -y python3 python3-pip

# Git
sudo apt-get install -y git

# Curl (optional, for testing)
sudo apt-get install -y curl
```

### Security Configuration

- **All ports exposed** (0.0.0.0) - Ensure EC2 Security Group allows:
  - Port 3000 (Frontend)
  - Port 8000 (Backend API)
  
**Important:** Restrict access in EC2 Security Group to your IP or VPN

```
Inbound Rules:
- Port 3000: Your IP/CIDR
- Port 8000: Your IP/CIDR
```

### Networking Overview

```
┌─────────────────────────────────────────────┐
│         EC2 Instance (54.145.92.198)        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Docker Network: pipeline-network    │   │
│  │                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐│   │
│  │  │ Frontend     │  │ Backend      ││   │
│  │  │ 3000/80      │  │ 8000         ││   │
│  │  └──────────────┘  └──────────────┘│   │
│  │       ↓                    ↓         │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │ SQLite Database              │  │   │
│  │  │ /data/pipeline.db            │  │   │
│  │  └──────────────────────────────┘  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Port Bindings (Host):                     │
│  - :3000 → 54.145.92.198:3000             │
│  - :8000 → 54.145.92.198:8000             │
└─────────────────────────────────────────────┘
         ↓ (Internet)
    Your Browser
```

### Accessing After Deployment

```
Frontend:   http://54.145.92.198:3000
Backend:    http://54.145.92.198:8000
API Docs:   http://54.145.92.198:8000/docs
```

### Health Checks

Docker will automatically monitor service health:

```bash
# Check service status
docker-compose ps

# View backend logs
docker-compose logs backend

# View frontend logs
docker-compose logs frontend

# Manually test backend
curl http://54.145.92.198:8000/chat/health

# Manually test frontend
curl http://54.145.92.198:3000
```

### Important Notes

1. **Security Groups**: Configure EC2 security group to allow ports 3000 and 8000
2. **Environment Variables**: Set actual secrets in `.env` (not in `.env.example`)
3. **Database**: SQLite database will be persisted in docker volume `db-data`
4. **Logs**: Check `docker-compose logs` for debugging
5. **Domain**: If you have a domain, update DNS to point to 54.145.92.198

### Reverse Proxy (Optional)

For production, consider using a reverse proxy (Nginx/Apache) to:
- Handle SSL/TLS certificates
- Route requests to services
- Hide internal ports

See DOCKER_SECURITY.md for Nginx configuration.
