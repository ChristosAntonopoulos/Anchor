# MongoDB Authentication Reset - Root Access Solution

Since you have root access and used defaults, let's either find the credentials or temporarily disable auth to create the user.

## Option 1: Check MongoDB Configuration

```bash
# Check MongoDB config file
cat /etc/mongod.conf | grep -A 10 -i security
cat /etc/mongod.conf | grep -A 10 -i auth

# Check if there's a users file or setup script
ls -la /etc/mongodb/
ls -la /root/ | grep -i mongo
find /root -name "*mongo*" -type f 2>/dev/null
```

## Option 2: Temporarily Disable Authentication (Create User, Then Re-enable)

Since you have root access, you can temporarily disable authentication:

### Step 1: Stop MongoDB

```bash
systemctl stop mongod
```

### Step 2: Start MongoDB Without Authentication

```bash
# Start MongoDB without auth (temporary)
mongod --noauth --dbpath /var/lib/mongodb --fork --logpath /var/log/mongodb/mongod.log
```

Or edit the config:

```bash
# Backup config
cp /etc/mongod.conf /etc/mongod.conf.backup

# Edit config to disable auth temporarily
nano /etc/mongod.conf
# Comment out or remove the security/authorization section
# Look for lines like:
# security:
#   authorization: enabled
# Change to:
# # security:
# #   authorization: enabled

# Restart MongoDB
systemctl start mongod
```

### Step 3: Connect Without Auth and Create User

```bash
mongosh
```

Then in mongosh:

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "admin",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" },
    { role: "clusterAdmin", db: "admin" }
  ]
})

// Create posuser
db.createUser({
  user: "posuser",
  pwd: "PosUserPassword123!",
  roles: [
    { role: "readWrite", db: "pos" },
    { role: "dbAdmin", db: "pos" }
  ]
})

// Verify
db.getUsers()
exit
```

### Step 4: Re-enable Authentication

```bash
# Restore config
cp /etc/mongod.conf.backup /etc/mongod.conf

# Or manually edit to re-enable auth
nano /etc/mongod.conf
# Uncomment the security section

# Restart MongoDB
systemctl restart mongod
```

## Option 3: Check What Users Actually Exist

Try to see what's in the MongoDB database:

```bash
# Check MongoDB data directory
ls -la /var/lib/mongodb/

# Try to see if there are any user documents
# (This might require stopping MongoDB and checking files)
```

## Option 4: Reset Admin Password (If You Know the Database)

If you can access the MongoDB data files directly:

```bash
# Stop MongoDB
systemctl stop mongod

# MongoDB stores users in admin.system.users collection
# But you'd need special tools to modify this directly
```

## Recommended: Quick Fix

**Easiest approach** - Temporarily disable auth, create users, re-enable:

```bash
# 1. Stop MongoDB
systemctl stop mongod

# 2. Start without auth (one-time)
mongod --noauth --dbpath /var/lib/mongodb --fork --logpath /var/log/mongodb/mongod.log

# 3. Connect and create users
mongosh
# (Then run the createUser commands above)

# 4. Stop the no-auth instance
pkill mongod

# 5. Start normally (with auth)
systemctl start mongod
```

## After Creating Users

Test the connection:

```bash
mongosh "mongodb://admin:admin@localhost:27017/admin"
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin"
```

## Connection String for Your App

```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```
