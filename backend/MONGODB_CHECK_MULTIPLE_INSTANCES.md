# Check for Multiple MongoDB Instances

You might have MongoDB running in multiple places. Let's check:

## Step 1: Check All MongoDB Processes

```bash
# Check all running MongoDB processes
ps aux | grep mongod

# Check all processes listening on port 27017
sudo netstat -tlnp | grep 27017
sudo ss -tlnp | grep 27017

# Check if MongoDB is in a Docker container
docker ps | grep mongo
docker ps -a | grep mongo
```

## Step 2: Check Kubernetes for MongoDB

```bash
# Check if MongoDB is running in Kubernetes
kubectl get pods -A | grep mongo
kubectl get pods -A | grep mongodb

# Check MongoDB services in Kubernetes
kubectl get svc -A | grep mongo

# Check if there's a MongoDB StatefulSet
kubectl get statefulset -A | grep mongo
```

## Step 3: Check MongoDB Config Files

```bash
# Check system MongoDB config
cat /etc/mongod.conf | grep -A 5 "net:"

# Check if there are other MongoDB configs
find /etc -name "*mongo*" 2>/dev/null
find /opt -name "*mongo*" 2>/dev/null
```

## Step 4: Identify Which MongoDB to Use

### Option A: Use System MongoDB (Current One)
- Running on: `127.0.0.1:27017` (localhost only)
- Config: `/etc/mongod.conf`
- Fix: Change `bindIp` to `0.0.0.0` and restart

### Option B: Use Kubernetes MongoDB
- If MongoDB is in Kubernetes, you need:
  - Service name (e.g., `mongodb-service`)
  - Namespace (e.g., `pos`)
  - Connection: `mongodb://mongodb-service:27017/pos` (from within cluster)
  - Or port-forward: `kubectl port-forward svc/mongodb-service 27017:27017 -n pos`

## Step 5: Check Connection Strings

### For System MongoDB (After Fix):
```
mongodb://185.193.66.50:27017/pos
```

### For Kubernetes MongoDB (From Outside):
```bash
# First, port-forward
kubectl port-forward svc/mongodb-service 27017:27017 -n pos

# Then connect to:
mongodb://localhost:27017/pos
```

### For Kubernetes MongoDB (From Inside Cluster):
```
mongodb://mongodb-service.pos.svc.cluster.local:27017/pos
```

## Recommendation

1. **Check if Kubernetes MongoDB exists**: `kubectl get pods -A | grep mongo`
2. **If yes**: Use Kubernetes MongoDB (better for production)
3. **If no**: Fix system MongoDB to listen on `0.0.0.0`
