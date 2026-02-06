# Checking MongoDB AuthSource

When you create a user in MongoDB, the `authSource` is the database where the user was created. Let's find out which one was used.

## Check on Server

SSH into the server and check:

```bash
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/admin?authSource=admin"
```

If that fails, try:

```bash
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=pos"
```

Or check what database the user is in:

```javascript
// Connect as admin first
mongosh "mongodb://admin:admin@localhost:27017/admin"

// Then check where posuser is stored
use admin
db.getUser("posuser")

// This will show which database the user belongs to
```

## Common AuthSource Options

Try these connection strings in order:

### Option 1: authSource=admin (Most Common)
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```

### Option 2: authSource=pos (If user was created in pos database)
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=pos
```

### Option 3: No authSource (Uses default)
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos
```

## Quick Test

Update your `appsettings.Development.json` and try each option:

1. First try: `authSource=admin`
2. If that fails: `authSource=pos`
3. If that fails: Remove authSource parameter
