# Docker Deployment Guide

## Overview
This guide provides instructions for building and deploying the Reconciliation Pipeline using Docker and Docker Compose.

## Prerequisites
- Docker 20.10+
- Docker Compose 1.29+
- 4GB RAM minimum
- 2GB disk space

## Quick Start

### 1. Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### 2. Start Services
```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 4. Stop Services
```bash
docker-compose down

# Remove volumes
docker-compose down -v
```

## Service Architecture

### Backend Service
- **Image**: pipeline:backend-latest
- **Port**: 8000
- **Framework**: FastAPI
- **Workers**: 2 (production)
- **Health Check**: /chat/health endpoint
- **Volumes**: 
  - ./uploads:/app/uploads (CSV data)
  - ./backend:/app/backend (source code)

### Frontend Service
- **Image**: pipeline:frontend-latest
- **Port**: 3000 → 80 (Nginx)
- **Framework**: React 18
- **Features**: SPA routing, gzip compression, caching
- **Build**: Multi-stage (optimized)

### Database Service
- **Image**: sqlite:latest
- **Container**: pipeline_db
- **Volume**: db-data (persistent)
- **Purpose**: User management

## Environment Configuration

### Backend Environment Variables
Create `.env` in project root:
```env
GEMINI_API_KEY=your_api_key_here
SECRET_KEY=RaoChJQYyYtuvO7-MzhI8nvRkBRcArbXdvEKcwE6WQA
```

### Frontend Environment Variables
Create `frontend/.env`:
```env
REACT_APP_BACKEND_PORT=8000
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Production Considerations

### Security
- Use secrets management (Docker secrets or Vault)
- Enable HTTPS with reverse proxy
- Implement rate limiting
- Use environment-specific builds

### Scaling
- Increase worker count in uvicorn (backend)
- Use load balancer (nginx/traefik)
- Implement database clustering
- Add Redis for caching

### Monitoring
- Check health endpoints: `curl http://localhost:8000/chat/health`
- Monitor logs: `docker-compose logs --tail=100 backend`
- Track resource usage: `docker stats`

### Performance Optimization
- Frontend: Gzip enabled, caching configured
- Backend: 2-worker setup, connection pooling
- Database: Indexed queries, prepared statements
- Network: Internal Docker network (pipeline-network)

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache backend
docker-compose up backend
```

### Port conflicts
```bash
# Change port mapping in docker-compose.yml
# Edit ports section for affected service
# Example: "8001:8000" instead of "8000:8000"
```

### Database issues
```bash
# Clear persistent volume
docker volume rm pipeline_v2_db-data

# Rebuild and restart
docker-compose up --force-recreate
```

### Network issues
```bash
# Check network
docker network ls

# Inspect pipeline-network
docker network inspect pipeline_v2_pipeline-network
```

## Development vs Production

### Development
```bash
# Mount source for live reload
docker-compose -f docker-compose.yml up
```

### Production
```bash
# Use production compose file (if available)
docker-compose -f docker-compose.prod.yml up -d

# Tag images
docker tag pipeline:backend-latest myregistry/pipeline:backend-1.0.0
docker tag pipeline:frontend-latest myregistry/pipeline:frontend-1.0.0

# Push to registry
docker push myregistry/pipeline:backend-1.0.0
docker push myregistry/pipeline:frontend-1.0.0
```

## Logging

All services use JSON file logging with rotation:
- Max file size: 10MB
- Max files: 3
- Location: `/var/lib/docker/containers/*/`

View logs:
```bash
docker-compose logs -f --tail=50 backend
```

## Performance Tips

1. **Use .dockerignore**: Reduces build context size
2. **Multi-stage builds**: Frontend uses 2-stage build for optimization
3. **Layer caching**: Requirements copied before source code
4. **Health checks**: All services monitored automatically
5. **Structured logging**: JSON format for log aggregation

## Useful Commands

```bash
# Build with progress
docker-compose build --progress=plain

# Start in foreground
docker-compose up

# Run command in container
docker-compose exec backend bash

# Remove everything
docker-compose down -v --rmi all

# Check resource usage
docker stats

# View image size
docker images pipeline:*

# Rebuild without cache
docker-compose build --no-cache
```

## Next Steps

1. Configure environment variables
2. Verify uploads folder permissions
3. Test API connectivity
4. Review logs for errors
5. Set up monitoring/logging aggregation
6. Plan for backups (database volume)
