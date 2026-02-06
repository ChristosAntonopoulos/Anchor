# Disable MongoDB Authentication

Since authentication is enabled but you don't have admin credentials, let's disable it.

## Step 1: Stop MongoDB

```bash
# Find and kill MongoDB process
ps aux | grep mongod | grep -v grep
# Note the PID, then:
sudo kill <PID>

# Or kill all mongod processes
sudo pkill mongod
```

## Step 2: Disable Authentication in Config

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Find the security section and comment it out:
# security:
#   authorization: enabled
# Change to:
# #security:
# #  authorization: enabled

# Or remove the security section entirely
```

## Step 3: Start MongoDB Without Auth

```bash
# Start MongoDB
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf --fork --logpath /var/log/mongodb/mongod.log

# Verify it's running
ps aux | grep mongod | grep -v grep
sudo netstat -tlnp | grep 27017
```

## Step 4: Test Connection

```bash
# Test without auth
mongosh "mongodb://localhost:27017/pos"
```

## Connection String

After disabling auth, use:
```
mongodb://185.193.66.50:27017/pos
```
