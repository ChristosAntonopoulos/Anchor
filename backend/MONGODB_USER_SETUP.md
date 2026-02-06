# MongoDB User Setup for POS Database

## Create New MongoDB User

Since the `tradingbot` user might not exist or doesn't have access to create the `pos` database, we'll create a new user specifically for the POS application.

## Option 1: Create User via MongoDB Shell (Recommended)

### Step 1: Connect to MongoDB as Admin

You need to connect to MongoDB with admin privileges. If you have access to the server:

```bash
# Connect to MongoDB (you may need admin credentials)
mongosh "mongodb://admin:adminpassword@185.193.66.50:27017/admin"
```

Or if you can SSH into the server:
```bash
ssh user@185.193.66.50
mongosh
```

### Step 2: Create User for POS Database

Once connected, run these commands:

```javascript
// Switch to admin database
use admin

// Create user for pos database
db.createUser({
  user: "posuser",
  pwd: "PosUserPassword123!",
  roles: [
    {
      role: "readWrite",
      db: "pos"
    },
    {
      role: "dbAdmin",
      db: "pos"
    }
  ]
})
```

### Step 3: Verify User Creation

```javascript
// Check if user was created
use admin
db.getUsers()

// Or check user in pos database
use pos
db.getUsers()
```

## Option 2: Create User via MongoDB Compass or GUI

1. Connect to MongoDB server: `185.193.66.50:27017`
2. Authenticate as admin
3. Go to Database Access
4. Add New Database User:
   - Username: `posuser`
   - Password: `PosUserPassword123!`
   - Database: `pos`
   - Roles: `readWrite`, `dbAdmin`

## Option 3: Use Existing TradingBot User (If Available)

If the `tradingbot` user exists and has permissions, you can grant it access to the `pos` database:

```javascript
use admin
db.grantRolesToUser("tradingbot", [
  { role: "readWrite", db: "pos" },
  { role: "dbAdmin", db: "pos" }
])
```

## Updated Connection Strings

### New User (Recommended)
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```

### If Using TradingBot User (After Granting Permissions)
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=admin
```

## User Permissions Explained

- **readWrite**: Allows reading and writing data to the `pos` database
- **dbAdmin**: Allows administrative operations (creating indexes, etc.)

## Security Notes

- ✅ Use strong passwords in production
- ✅ Store connection strings in Azure DevOps secrets (not in code)
- ✅ Limit user permissions to only what's needed
- ✅ Consider using MongoDB Atlas for managed security

## Next Steps

1. Create the user using one of the methods above
2. Update `appsettings.Development.json` with the new connection string
3. Test the connection locally
4. Update Azure DevOps variable group with the working connection string
