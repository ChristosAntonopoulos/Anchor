# MongoDB Authentication Failed - Fix

Authentication is failing. Let's check and fix.

## Step 1: Check if Authentication is Enabled

```bash
# Check MongoDB config
cat /etc/mongod.conf | grep -A 3 "security:"

# If you see "authorization: enabled", auth is ON
# If not present or commented out, auth is OFF
```

## Step 2: If Authentication is Disabled

If authentication is NOT enabled, use connection string without credentials:

```
mongodb://185.193.66.50:27017/pos
```

## Step 3: If Authentication is Enabled - Verify User

```bash
# Connect without auth (if possible) or as admin
mongosh "mongodb://localhost:27017/admin"

# Check if posuser exists
use admin
db.getUser("posuser")

# If user exists, try resetting password
db.changeUserPassword("posuser", "PosUserPassword123!")
```

## Step 4: Test Different AuthSource

Try different authSource values:

```bash
# Try authSource=pos
mongosh 'mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=pos'

# Try without authSource
mongosh 'mongodb://posuser:PosUserPassword123!@localhost:27017/pos'
```

## Quick Solution: Disable Authentication

If you want to disable authentication for development:

```bash
# Edit config
sudo nano /etc/mongod.conf

# Comment out or remove:
# security:
#   authorization: enabled

# Restart MongoDB (kill current and restart)
sudo kill 3916529
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf --fork --logpath /var/log/mongodb/mongod.log
```

Then use: `mongodb://185.193.66.50:27017/pos`
