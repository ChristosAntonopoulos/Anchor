# POS Backend Deployment Guide

This guide covers deploying the POS (Personal Operating System) backend API to Kubernetes on an Ubuntu server using Azure DevOps CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [Azure DevOps Configuration](#azure-devops-configuration)
5. [Kubernetes Setup](#kubernetes-setup)
6. [Deployment Process](#deployment-process)
7. [Mobile App Configuration](#mobile-app-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## Prerequisites

### Infrastructure

- **Ubuntu Server** (20.04 LTS or later) with Kubernetes cluster
  - Kubernetes version 1.24 or later
  - `kubectl` installed and configured
  - Network access to the cluster from Azure DevOps agent

### Accounts and Services

- **Docker Hub** account (or Azure Container Registry)
  - Username and password for pushing images
- **Azure DevOps** account
  - Project with pipeline permissions
  - Agent pool with `kubectl` and `docker` installed

### MongoDB

Choose one:
- **MongoDB Atlas** (cloud) - Recommended for simplicity
- **MongoDB on Ubuntu server** - Separate installation
- **MongoDB in Kubernetes** - Using provided StatefulSet

## Architecture Overview

```
┌─────────────────────────────────────┐
│     Azure DevOps Pipeline           │
│  Build → Package → Deploy           │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Kubernetes Cluster (Ubuntu)       │
│  ┌──────────┐  ┌──────────┐        │
│  │  Backend │  │ MongoDB   │        │
│  │  API     │  │ (Optional)│        │
│  └──────────┘  └──────────┘        │
│       │                              │
│       ▼                              │
│  LoadBalancer (Public IP)            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Mobile Device (Expo Go)            │
│   Connects via Public API URL       │
└─────────────────────────────────────┘
```

## Pre-Deployment Setup

### 1. Set Up Kubernetes Cluster

On your Ubuntu server:

```bash
# Install kubectl (if not already installed)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client

# Configure kubectl to access your cluster
# (Follow your Kubernetes distribution's instructions)
```

### 2. Set Up MongoDB

#### Option A: MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create database user
4. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pos?retryWrites=true&w=majority
   ```

#### Option B: MongoDB on Ubuntu Server

```bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongosh
use pos
db.createUser({user: "posuser", pwd: "password", roles: ["readWrite"]})
```

Connection string: `mongodb://posuser:password@localhost:27017/pos`

#### Option C: MongoDB in Kubernetes

See `k8s/README.md` for instructions on deploying MongoDB StatefulSet.

### 3. Configure Azure DevOps

#### Create Variable Group

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Name: `POS-Secrets`
4. Add variables (mark secrets as "Keep this value secret"):
   - `DOCKER_USERNAME` - Your Docker Hub username
   - `DOCKER_PASSWORD` - Your Docker Hub password/token
   - `MONGO_CONNECTION_STRING` - MongoDB connection string with credentials

#### Update Pipeline Variables

In `azure-pipelines.yml`, update:
```yaml
- name: dockerRegistry
  value: 'your-dockerhub-username'  # Change this
```

## Azure DevOps Configuration

### Pipeline Setup

1. **Create Pipeline**:
   - Go to **Pipelines** → **Pipelines**
   - Click **New pipeline**
   - Select your repository
   - Choose "Existing Azure Pipelines YAML file"
   - Path: `azure-pipelines.yml`

2. **Configure Agent**:
   - Ensure agent has:
     - `docker` installed
     - `kubectl` installed
     - Access to Kubernetes cluster (kubeconfig configured)

3. **Set Up Service Connection** (Optional):
   - For Kubernetes deployment, you may need a service connection
   - Or configure `kubectl` directly on the agent

### Pipeline Variables

The pipeline uses these variables (set in Variable Group or pipeline):

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `myusername` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_...` |
| `MONGO_CONNECTION_STRING` | MongoDB connection string | `mongodb+srv://...` |

## Kubernetes Setup

### 1. Apply Manifests

```bash
# Navigate to backend directory
cd backend

# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Apply configmap
kubectl apply -f k8s/configmap.yaml

# Create secrets (manually or via pipeline)
kubectl create secret generic pos-api-secrets \
  --from-literal=ConnectionStrings__MongoDb="your-connection-string" \
  --namespace=pos
```

### 2. Deploy API

The pipeline will automatically:
- Build Docker image
- Push to Docker Hub
- Apply deployment and service
- Update image tag

Or deploy manually:
```bash
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
```

### 3. Get Public IP

After deployment, get the LoadBalancer IP:

```bash
kubectl get service pos-api-service -n pos
```

**Production Server**: `http://185.193.66.50:35555/api`

The service is exposed on port `35555` (not the default 80) to avoid conflicts with other services.

## Deployment Process

### Automatic Deployment (CI/CD)

1. **Push to main/master branch**
2. **Pipeline triggers automatically**
3. **Stages execute**:
   - Build: Compiles .NET solution
   - Package: Builds and pushes Docker image
   - Deploy: Applies Kubernetes manifests
   - Health Check: Verifies deployment

### Manual Deployment

```bash
# Build Docker image
docker build -t your-username/pos-api:latest -f backend/Dockerfile backend

# Push to registry
docker push your-username/pos-api:latest

# Update deployment
kubectl set image deployment/pos-api api=your-username/pos-api:latest -n pos

# Wait for rollout
kubectl rollout status deployment/pos-api -n pos
```

## Mobile App Configuration

### For Expo Go

**Production API URL**: `http://185.193.66.50:35555/api`

1. **Update Mobile Config**:
   
   Option A: Set environment variable when running:
   ```bash
   EXPO_PUBLIC_API_URL=http://185.193.66.50:35555/api npx expo start
   ```
   
   Option B: Update `mobile/constants/apiConfig.ts` (already configured):
   ```typescript
   const PROD_API_BASE_URL = 'http://185.193.66.50:35555/api';
   ```

3. **Test Connection**:
   - Start Expo Go on your device
   - Scan QR code
   - App should connect to deployed backend

### For Production Builds

Set `EXPO_PUBLIC_API_URL` during build:
```bash
expo build:android --env EXPO_PUBLIC_API_URL=http://185.193.66.50:35555/api
expo build:ios --env EXPO_PUBLIC_API_URL=http://185.193.66.50:35555/api
```

## Troubleshooting

### Pipeline Fails

**Docker Login Fails**:
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` are set correctly
- Check Docker Hub account permissions

**Kubernetes Deploy Fails**:
- Verify `kubectl` is configured on agent
- Check cluster access: `kubectl get nodes`
- Verify namespace exists: `kubectl get namespace pos`

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n pos

# Describe pod for details
kubectl describe pod <pod-name> -n pos

# Check logs
kubectl logs <pod-name> -n pos

# Common issues:
# - Image pull errors: Check Docker registry access
# - ConfigMap/Secret missing: Verify secrets created
# - Resource limits: Check pod resource requests
```

### Database Connection Issues

```bash
# Verify MongoDB connection string in secret
kubectl get secret pos-api-secrets -n pos -o jsonpath='{.data.ConnectionStrings__MongoDb}' | base64 -d

# Test MongoDB connectivity from pod
kubectl exec -it <pod-name> -n pos -- curl http://localhost:5000/health
```

### Service Not Accessible

```bash
# Check service
kubectl get service pos-api-service -n pos

# Check endpoints
kubectl get endpoints pos-api-service -n pos

# Port forward for testing
kubectl port-forward service/pos-api-service 8080:35555 -n pos
# Test: curl http://localhost:8080/health
```

### Mobile App Can't Connect

1. **Verify CORS**: Check backend logs for CORS errors
2. **Check API URL**: Ensure mobile app uses correct URL
3. **Network**: Verify device can reach Kubernetes LoadBalancer IP
4. **HTTPS**: If using HTTPS, ensure certificate is valid

## Maintenance

### Update Application

1. Push code changes to repository
2. Pipeline automatically builds and deploys
3. Or manually update image tag in deployment

### Scale Deployment

```bash
# Scale to 3 replicas
kubectl scale deployment pos-api --replicas=3 -n pos
```

### View Logs

```bash
# All pods
kubectl logs -f -l app=pos-api -n pos

# Specific pod
kubectl logs -f <pod-name> -n pos
```

### Backup MongoDB

If using MongoDB in Kubernetes:
```bash
# Create backup
kubectl exec -it mongodb-0 -n pos -- mongodump --out=/data/backup

# Or use MongoDB Atlas backup (if using Atlas)
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/pos-api -n pos

# Rollback to previous version
kubectl rollout undo deployment/pos-api -n pos
```

## Security Considerations

1. **Secrets Management**: Never commit secrets to repository
2. **CORS**: Production CORS allows all origins (acceptable for mobile API)
3. **HTTPS**: Consider adding Ingress with TLS for HTTPS
4. **Authentication**: Implement authentication for production use
5. **Rate Limiting**: Consider adding rate limiting middleware
6. **Network Policies**: Implement Kubernetes network policies if needed

## Next Steps

1. Set up domain and SSL certificate
2. Configure Ingress for HTTPS
3. Set up monitoring (Prometheus, Grafana)
4. Implement authentication/authorization
5. Set up staging environment
6. Configure automated backups

## Support

For issues or questions:
- Check `k8s/README.md` for Kubernetes-specific help
- Review pipeline logs in Azure DevOps
- Check application logs: `kubectl logs -l app=pos-api -n pos`
