# MongoDB Default Admin Credentials

## Important: MongoDB Has NO Built-in Defaults

**MongoDB does NOT come with default admin username/password.** You must create an admin user during initial setup, or authentication might be disabled.

## Common Scenarios

### Scenario 1: Authentication Disabled (No Credentials Needed)

If MongoDB was set up without authentication, you can connect without credentials:

```
mongodb://185.193.66.50:27017/admin
```

**Test this first** - it's the most common setup for development servers.

### Scenario 2: Common Defaults People Use

If someone set up MongoDB and created an admin user, they often use these common defaults:

| Username | Password | Connection String |
|----------|----------|-------------------|
| `admin` | `admin` | `mongodb://admin:admin@185.193.66.50:27017/admin` |
| `admin` | `password` | `mongodb://admin:password@185.193.66.50:27017/admin` |
| `root` | `root` | `mongodb://root:root@185.193.66.50:27017/admin` |
| `root` | `password` | `mongodb://root:password@185.193.66.50:27017/admin` |
| `mongodb` | `mongodb` | `mongodb://mongodb:mongodb@185.193.66.50:27017/admin` |
| `admin` | `123456` | `mongodb://admin:123456@185.193.66.50:27017/admin` |

### Scenario 3: Server-Specific Defaults

If this is a managed server or specific setup, check:

- **Server documentation**
- **Setup scripts** used to install MongoDB
- **Docker Compose files** (if MongoDB is containerized)
- **Kubernetes configs** (if in K8s)

## How to Test

### Option 1: Use the C# Tool

The tool will let you try different connection strings:

```powershell
cd backend/src/POS.Tools/CreateMongoUser
dotnet run
```

Then try these connection strings one by one:
1. `mongodb://185.193.66.50:27017/admin` (no auth)
2. `mongodb://admin:admin@185.193.66.50:27017/admin`
3. `mongodb://admin:password@185.193.66.50:27017/admin`
4. `mongodb://root:root@185.193.66.50:27017/admin`

### Option 2: Test with MongoDB Compass

1. Download MongoDB Compass
2. Try connecting with each of the common defaults above
3. See which one works

### Option 3: Check Server Configuration

If you have SSH access:

```bash
ssh user@185.193.66.50

# Check if auth is enabled
sudo cat /etc/mongod.conf | grep -i "authorization\|security"

# If you see "authorization: enabled" or "security:" then auth is ON
# If not present or "authorization: disabled", then auth is OFF
```

## Most Likely Scenarios for Your Server

### 1. Authentication Disabled (Try This First!)
```
mongodb://185.193.66.50:27017/admin
```

### 2. Common Default: admin/admin
```
mongodb://admin:admin@185.193.66.50:27017/admin
```

### 3. Using TradingBot User as Admin
Since you have `tradingbot` user, it might have admin privileges:
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot
```

## Quick Test Script

Create a PowerShell script to test common credentials:

```powershell
$connectionStrings = @(
    "mongodb://185.193.66.50:27017/admin",
    "mongodb://admin:admin@185.193.66.50:27017/admin",
    "mongodb://admin:password@185.193.66.50:27017/admin",
    "mongodb://root:root@185.193.66.50:27017/admin",
    "mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot"
)

foreach ($conn in $connectionStrings) {
    Write-Host "Testing: $conn"
    # You'd need mongosh or a test tool to actually test
    # Or use the C# tool
}
```

## Recommended Approach

1. **First**: Try no authentication (most common for dev servers)
   ```
   mongodb://185.193.66.50:27017/admin
   ```

2. **Second**: Try `admin:admin`
   ```
   mongodb://admin:admin@185.193.66.50:27017/admin
   ```

3. **Third**: Try `tradingbot` user with admin authSource
   ```
   mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot
   ```

4. **Fourth**: Try other common defaults from the table above

## If None Work

1. **Check with server administrator** - They should know the credentials
2. **Check server setup documentation** - Look for MongoDB setup notes
3. **Check if you can reset/create admin user** - If you have server access

## After Finding Working Credentials

Update the C# tool or use it interactively to create the `posuser`:

```powershell
cd backend/src/POS.Tools/CreateMongoUser
dotnet run
# Enter the working connection string when prompted
```
