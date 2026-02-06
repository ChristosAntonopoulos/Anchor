# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the POS (Personal Operating System) backend API.

## Prerequisites

- Kubernetes cluster (v1.24+) running on Ubuntu server
- `kubectl` configured to access the cluster
- Docker registry access (Docker Hub or Azure Container Registry)
- MongoDB instance (in-cluster or external)

## MongoDB Deployment Options

### Option A: MongoDB in Kubernetes (In-Cluster)

Deploy MongoDB as a StatefulSet within the Kubernetes cluster:

```bash
# 1. Create MongoDB secrets
kubectl create secret generic mongodb-secrets \
  --from-literal=username="admin" \
  --from-literal=password="your-secure-password" \
  --namespace=pos

# 2. Deploy MongoDB
kubectl apply -f mongodb-statefulset.yaml
kubectl apply -f mongodb-service.yaml

# 3. Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n pos --timeout=300s
```

**Connection String**: `mongodb://admin:password@mongodb-service:27017/pos?authSource=admin`

### Option B: External MongoDB (Recommended)

Use MongoDB Atlas or a MongoDB instance running outside Kubernetes:

1. Set up MongoDB Atlas account or install MongoDB on Ubuntu server
2. Get connection string from MongoDB provider
3. Use connection string in API secrets (see below)

**Connection String Examples**:
- Local: `mongodb://localhost:27017/pos`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/pos?retryWrites=true&w=majority`
- Remote: `mongodb://username:password@mongodb-host:27017/pos?authSource=admin`

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

**For API Secrets** (MongoDB connection string):
```bash
kubectl create secret generic pos-api-secrets \
  --from-literal=ConnectionStrings__MongoDb="mongodb://username:password@host:port/database" \
  --namespace=pos
```

**For MongoDB Secrets** (if using Option A):
```bash
kubectl create secret generic mongodb-secrets \
  --from-literal=username="admin" \
  --from-literal=password="your-secure-password" \
  --namespace=pos
```

### 3. Apply ConfigMap

```bash
kubectl apply -f configmap.yaml
```

### 4. Deploy API

```bash
# Apply deployment
kubectl apply -f api-deployment.yaml

# Apply service
kubectl apply -f api-service.yaml

# Wait for deployment
kubectl rollout status deployment/pos-api -n pos --timeout=300s
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n pos

# Check services
kubectl get services -n pos

# Check logs
kubectl logs -f deployment/pos-api -n pos

# Test health endpoint
kubectl port-forward service/pos-api-service 8080:35555 -n pos
curl http://localhost:8080/health
```

## Service Access

### LoadBalancer Service

The `api-service.yaml` uses `LoadBalancer` type, which will:
- Get an external IP from your cloud provider
- Make the API accessible from outside the cluster
- Use port 35555 (maps to container port 5000)

**Production Server**: `http://185.193.66.50:35555/api`

**Get External IP**:
```bash
kubectl get service pos-api-service -n pos
```

**Access API**:
- Production: `http://185.193.66.50:35555/api`
- Or use external IP from service: `http://<EXTERNAL_IP>:35555/api`

### Alternative: Ingress

If you prefer using Ingress instead of LoadBalancer:
1. Install an Ingress controller (e.g., NGINX Ingress)
2. Create `api-ingress.yaml` with your domain
3. Update service type to `ClusterIP`

## Environment Variables

The deployment uses:
- **ConfigMap** (`pos-api-config`): Non-sensitive configuration
- **Secrets** (`pos-api-secrets`): Sensitive data (MongoDB connection string)

## Scaling

Scale the API deployment:
```bash
kubectl scale deployment pos-api --replicas=3 -n pos
```

## Updates

Update the API image:
```bash
kubectl set image deployment/pos-api api=pos-api:new-tag -n pos
kubectl rollout status deployment/pos-api -n pos
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n pos

# Check logs
kubectl logs <pod-name> -n pos

# Check events
kubectl get events -n pos --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Verify MongoDB is accessible
kubectl exec -it <api-pod-name> -n pos -- curl http://localhost:5000/health

# Check MongoDB connection string in secrets
kubectl get secret pos-api-secrets -n pos -o jsonpath='{.data.ConnectionStrings__MongoDb}' | base64 -d
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints pos-api-service -n pos

# Port forward for testing
kubectl port-forward service/pos-api-service 8080:35555 -n pos
```

## Cleanup

To remove all resources:
```bash
kubectl delete namespace pos
```

Or delete individually:
```bash
kubectl delete -f api-deployment.yaml
kubectl delete -f api-service.yaml
kubectl delete -f configmap.yaml
kubectl delete secret pos-api-secrets -n pos
```
