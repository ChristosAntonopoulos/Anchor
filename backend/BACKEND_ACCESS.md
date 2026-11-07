# Backend Access Guide

## Production Backend (Deployed)

### API Base URL
```
http://185.193.66.50:31247/api
```

### Health Check Endpoint
```
http://185.193.66.50:31247/api/health
```

### Test in Browser
Open this URL in your browser:
```
http://185.193.66.50:31247/api/health
```

You should see a JSON response like:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-XX...",
  "database": "connected"
}
```

### Test with curl
```bash
curl http://185.193.66.50:31247/api/health
```

### Available Endpoints

- **Health**: `GET /api/health`
- **Today**: `GET /api/today`
- **Tasks**: `GET /api/tasks`
- **Schedule**: `GET /api/schedule`
- **Discipline**: `GET /api/discipline`
- **Money**: `GET /api/money/summary`
- **Deadlines**: `GET /api/deadlines`
- **Weekly Review**: `GET /api/weekly-review`

### Check Deployment Status

If you have `kubectl` access:

```bash
# Check if backend is running
kubectl get pods -n pos

# Check service
kubectl get service pos-api-service -n pos

# View logs
kubectl logs -n pos -l app=pos-api --tail=50
```

## Local Development Backend

### Run Locally
```bash
cd backend/src/POS.Api
dotnet run
```

### Local API URL
```
http://localhost:5000/api
```

### Local Health Check
```
http://localhost:5000/api/health
```

### Network Access (for mobile testing)
If your computer's IP is `192.168.1.43`:
```
http://192.168.1.43:5000/api
```

## Backend Code Location

### Repository Structure
```
backend/
├── src/
│   ├── POS.Api/          # Main API project
│   │   ├── Controllers/  # API controllers
│   │   ├── Program.cs    # Application entry point
│   │   └── appsettings.json
│   ├── POS.Core/         # Domain models
│   ├── POS.Application/  # Business logic
│   └── POS.Infrastructure/ # Data access
├── k8s/                  # Kubernetes deployment files
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   └── configmap.yaml
└── Dockerfile            # Docker build configuration
```

### Main API Project
- **Path**: `backend/src/POS.Api/`
- **Entry Point**: `Program.cs`
- **Configuration**: `appsettings.json`, `appsettings.Development.json`

## Deployment Information

### Kubernetes
- **Namespace**: `pos`
- **Deployment**: `pos-api`
- **Service**: `pos-api-service`
- **Replicas**: 1
- **Container Port**: 5000
- **NodePort**: 31247

### Docker Image
- **Registry**: Docker Hub
- **Image**: `[your-username]/pos-api:latest`
- **Built by**: Azure Pipeline automatically

## Troubleshooting

### Backend Not Accessible

1. **Check if backend is deployed**:
   ```bash
   kubectl get pods -n pos
   ```

2. **Check service**:
   ```bash
   kubectl get service pos-api-service -n pos
   ```

3. **Check logs**:
   ```bash
   kubectl logs -n pos -l app=pos-api --tail=100
   ```

4. **Test from inside cluster**:
   ```bash
   kubectl exec -n pos -it <pod-name> -- curl http://localhost:5000/api/health
   ```

### Connection Refused

- Backend pod might not be running
- Service might not be configured correctly
- Firewall might be blocking port 31247
- Check if NodePort is accessible from outside

### Database Connection Issues

- Check MongoDB connection string in Kubernetes secret:
  ```bash
  kubectl get secret pos-api-secrets -n pos -o jsonpath='{.data.ConnectionStrings__MongoDb}' | base64 -d
  ```

## Quick Access Links

- **Production API**: http://185.193.66.50:31247/api
- **Health Check**: http://185.193.66.50:31247/api/health
- **Local Development**: http://localhost:5000/api
