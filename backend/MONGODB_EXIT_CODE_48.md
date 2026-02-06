# MongoDB Exit Code 48 - Already Initialized

Exit code 48 usually means MongoDB thinks it's already running or there's a lock file.

## Check if MongoDB is Running

```bash
# Check if MongoDB process is running
ps aux | grep mongod | grep -v grep

# Check what's listening on port 27017
sudo netstat -tlnp | grep 27017
sudo ss -tlnp | grep 27017
```

## If MongoDB is Running

If you see a mongod process, it means MongoDB started successfully (maybe from the manual start). Check:

```bash
# Check status
sudo systemctl status mongod

# Check what it's listening on
sudo netstat -tlnp | grep 27017
# Should show: 0.0.0.0:27017
```

## If MongoDB is NOT Running

Exit code 48 can also mean lock file issue:

```bash
# Remove all lock files
sudo rm -f /var/lib/mongodb/*.lock
sudo rm -f /var/lib/mongodb/mongod.lock

# Check for any MongoDB processes
ps aux | grep mongod

# Try starting again
sudo systemctl start mongod
```

## Verify Connection

Once MongoDB is running:

```bash
# From server, test connection
mongosh "mongodb://localhost:27017/pos"

# Check what it's listening on
sudo netstat -tlnp | grep 27017
```
