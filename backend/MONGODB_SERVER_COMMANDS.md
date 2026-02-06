# MongoDB Commands for Server Access

Since you're already SSH'd into the server, here are the commands to run:

## Step 1: Connect to MongoDB (Try Without Auth First)

```bash
# Connect to local MongoDB without authentication
mongosh

# Or explicitly connect to localhost
mongosh "mongodb://localhost:27017/admin"
```

## Step 2: If That Works, Create Admin User (If Needed)

```javascript
// Once connected, switch to admin database
use admin

// Create admin user (if it doesn't exist)
db.createUser({
  user: "admin",
  pwd: "adminpassword",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" },
    { role: "clusterAdmin", db: "admin" }
  ]
})
```

## Step 3: Create POS User

```javascript
// Make sure you're in admin database
use admin

// Create user for pos database
db.createUser({
  user: "posuser",
  pwd: "PosUserPassword123!",
  roles: [
    { role: "readWrite", db: "pos" },
    { role: "dbAdmin", db: "pos" }
  ]
})
```

## Step 4: Verify Users

```javascript
// Check all users in admin database
use admin
db.getUsers()

// Check if posuser was created
db.getUser("posuser")
```

## Step 5: Test Connection

```javascript
// Test connection with new user
// Exit mongosh first (type: exit)
// Then connect with new user
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin"
```

## Alternative: If MongoDB Requires Auth

If you can't connect without auth, try:

```bash
# Try with common defaults
mongosh "mongodb://admin:admin@localhost:27017/admin"
mongosh "mongodb://root:root@localhost:27017/admin"

# Or check MongoDB config
cat /etc/mongod.conf | grep -i auth
```

## Quick Command Sequence

```bash
# 1. Connect (no auth)
mongosh

# 2. In mongosh, run:
use admin
db.createUser({
  user: "posuser",
  pwd: "PosUserPassword123!",
  roles: [
    { role: "readWrite", db: "pos" },
    { role: "dbAdmin", db: "pos" }
  ]
})

# 3. Verify
db.getUser("posuser")

# 4. Exit
exit
```

## Connection String for Your App

After creating the user, use this connection string:

```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```
