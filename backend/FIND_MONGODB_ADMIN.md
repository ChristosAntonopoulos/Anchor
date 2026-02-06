# Finding MongoDB Admin Credentials

The MongoDB server is at `185.193.66.50:27017`. Here are ways to find the admin credentials:

## Option 1: Check MongoDB Configuration Files (If You Have SSH Access)

If you can SSH into the server:

```bash
# SSH into the MongoDB server
ssh user@185.193.66.50

# Check MongoDB configuration
sudo cat /etc/mongod.conf
# Or
sudo cat /etc/mongodb.conf

# Check for environment variables
sudo cat /etc/environment
sudo systemctl show mongod | grep Environment

# Check MongoDB logs for connection info
sudo tail -100 /var/log/mongodb/mongod.log
```

## Option 2: Check if MongoDB Allows Local Connections Without Auth

Try connecting without authentication first:

```bash
# From the server itself
mongosh "mongodb://localhost:27017/admin"

# Or from your machine (if network allows)
mongosh "mongodb://185.193.66.50:27017/admin"
```

If this works, you can create the admin user or use it directly.

## Option 3: Check Existing Connection Strings

Since you mentioned `TradingBotTests` database exists, check:

1. **TradingBot application config** - Look for MongoDB connection strings in:
   - Application config files
   - Environment variables
   - Docker compose files
   - Kubernetes secrets/configmaps

2. **Check the tradingbot user** - The connection string you provided earlier:
   ```
   mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/TradingBotTests?authsource=tradingbot
   ```
   
   This suggests:
   - User: `tradingbot`
   - Password: `YourtradingbotPassword123`
   - Auth source: `tradingbot` database

## Option 4: Try Common Default Credentials

Common MongoDB admin setups:

```bash
# Try common defaults
mongosh "mongodb://admin:admin@185.193.66.50:27017/admin"
mongosh "mongodb://root:root@185.193.66.50:27017/admin"
mongosh "mongodb://mongodb:mongodb@185.193.66.50:27017/admin"
```

## Option 5: Check Docker/Kubernetes Setup (If MongoDB is Containerized)

If MongoDB is running in Docker/Kubernetes:

```bash
# Check Docker containers
docker ps | grep mongo
docker inspect <container-id> | grep -i password
docker exec <container-id> env | grep -i mongo

# Check Kubernetes secrets
kubectl get secrets -A | grep mongo
kubectl get secret <mongo-secret-name> -o yaml
```

## Option 6: Use TradingBot User to Create New User

If the `tradingbot` user has admin privileges, you might be able to use it:

```javascript
// Connect as tradingbot
mongosh "mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot"

// Check if user has admin privileges
use admin
db.getUsers()

// If it works, create posuser
db.createUser({
  user: "posuser",
  pwd: "PosUserPassword123!",
  roles: [
    { role: "readWrite", db: "pos" },
    { role: "dbAdmin", db: "pos" }
  ]
})
```

## Option 7: Check Server Documentation/Notes

- Check any setup documentation
- Check password managers
- Ask the person who set up the server
- Check server setup scripts

## Quick Test Script

Create a test script to try common credentials:

```powershell
# Test different admin credentials
$servers = @(
    "mongodb://admin:admin@185.193.66.50:27017/admin",
    "mongodb://root:root@185.193.66.50:27017/admin",
    "mongodb://admin:password@185.193.66.50:27017/admin",
    "mongodb://mongodb:mongodb@185.193.66.50:27017/admin"
)

foreach ($conn in $servers) {
    Write-Host "Trying: $conn"
    # Try connection (you'd need mongosh or a test tool)
}
```

## Recommended Approach

1. **First**: Try connecting without auth (if server allows)
2. **Second**: Check if `tradingbot` user can create users (try with `authSource=admin`)
3. **Third**: SSH into server and check MongoDB config files
4. **Fourth**: Check Docker/Kubernetes setup if MongoDB is containerized

## After Finding Admin Credentials

Update the C# tool:
- Edit `backend/src/POS.Tools/CreateMongoUser/Program.cs`
- Line 12: Update with actual admin credentials
- Run: `cd backend/src/POS.Tools/CreateMongoUser && dotnet run`
