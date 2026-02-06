# Kubernetes Quick Start Guide

Quick reference for deploying POS backend to Kubernetes.

## Prerequisites Checklist

- [ ] Kubernetes cluster running
- [ ] `kubectl` configured and working
- [ ] Docker Hub account (or ACR)
- [ ] MongoDB instance ready (Atlas, local, or in-cluster)
- [ ] Azure DevOps pipeline configured

## Quick Deploy (5 minutes)

### 1. Create Secrets

```bash
# MongoDB connection string
kubectl create secret generic pos-api-secrets \
  --from-literal=ConnectionStrings__MongoDb="mongodb://user:pass@host:27017/pos" \
  --namespace=pos
```

### 2. Apply Manifests

```bash
cd backend
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
```

### 3. Get API URL

```bash
kubectl get service pos-api-service -n pos
# Use EXTERNAL-IP: http://<EXTERNAL-IP>/api
```

### 4. Update Mobile App

In `mobile/constants/apiConfig.ts`:
```typescript
const PROD_API_BASE_URL = 'http://<EXTERNAL-IP>/api';
```

## Common Commands

```bash
# Check status
kubectl get all -n pos

# View logs
kubectl logs -f -l app=pos-api -n pos

# Restart deployment
kubectl rollout restart deployment/pos-api -n pos

# Scale
kubectl scale deployment pos-api --replicas=3 -n pos

# Delete everything
kubectl delete namespace pos
```

## MongoDB Options

**Atlas (Easiest)**:
- Sign up at mongodb.com/cloud/atlas
- Create cluster, get connection string
- Use in secrets

**Local on Server**:
- Install MongoDB on Ubuntu
- Connection: `mongodb://localhost:27017/pos`

**In Kubernetes**:
- See `mongodb-statefulset.yaml`
- Requires persistent storage

## Troubleshooting

**Pods not starting?**
```bash
kubectl describe pod <pod-name> -n pos
kubectl logs <pod-name> -n pos
```

**Can't connect to API?**
```bash
kubectl port-forward service/pos-api-service 8080:80 -n pos
curl http://localhost:8080/health
```

**Database connection error?**
```bash
# Check secret
kubectl get secret pos-api-secrets -n pos -o yaml
```
