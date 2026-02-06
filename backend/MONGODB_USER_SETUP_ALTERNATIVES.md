# MongoDB User Setup - Alternative Methods

Since `mongosh` is not installed locally, here are alternative ways to create the MongoDB user:

## Option 1: Install MongoDB Shell (mongosh)

### Windows Installation

1. **Download MongoDB Shell**:
   - Go to: https://www.mongodb.com/try/download/shell
   - Download the Windows installer
   - Or use Chocolatey: `choco install mongosh`

2. **Install and use**:
   ```powershell
   # After installation, use mongosh
   mongosh "mongodb://admin:adminpassword@185.193.66.50:27017/admin"
   ```

## Option 2: Use MongoDB Compass (GUI - Easiest)

1. **Download MongoDB Compass**:
   - Go to: https://www.mongodb.com/try/download/compass
   - Install the application

2. **Connect to MongoDB**:
   - Connection String: `mongodb://admin:adminpassword@185.193.66.50:27017/admin`
   - Click "Connect"

3. **Create User**:
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `posuser`
   - Password: `PosUserPassword123!`
   - Authentication Database: `admin`
   - User Privileges: Custom Role
     - Database: `pos`
     - Role: `readWrite`
   - Click "Add User"

## Option 3: SSH into Server and Use MongoDB There

If you have SSH access to the server:

```bash
# SSH into the server
ssh user@185.193.66.50

# MongoDB is usually installed on the server
mongosh

# Or connect directly
mongosh "mongodb://localhost:27017/admin" -u admin -p adminpassword

# Then create user
use admin
db.createUser({
  user: "posuser",
  pwd: "PosUserPassword123!",
  roles: [
    { role: "readWrite", db: "pos" },
    { role: "dbAdmin", db: "pos" }
  ]
})
```

## Option 4: Use Docker (If Available)

If you have Docker installed:

```powershell
# Run MongoDB shell in a container
docker run -it --rm mongo:latest mongosh "mongodb://admin:adminpassword@185.193.66.50:27017/admin"
```

## Option 5: Create User via .NET Code (Temporary Script)

I can create a temporary C# script that connects and creates the user. This would be a one-time script you run locally.

## Recommended: MongoDB Compass

**MongoDB Compass is the easiest option** - it's a GUI tool that doesn't require command-line setup.

### Quick Steps with Compass:

1. Download and install MongoDB Compass
2. Connect using: `mongodb://admin:adminpassword@185.193.66.50:27017/admin`
3. Navigate to Database Access
4. Create new user: `posuser` with password `PosUserPassword123!`
5. Grant `readWrite` and `dbAdmin` roles on `pos` database

## After Creating User

Once the user is created, update the connection string:

```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```
