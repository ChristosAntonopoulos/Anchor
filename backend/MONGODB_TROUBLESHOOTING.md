# MongoDB Authentication Troubleshooting

## Common Authentication Error

**Error**: `MongoDB.Driver.MongoAuthenticationException: 'Unable to authenticate using sasl protocol mechanism SCRAM-SHA-1.'`

## Solutions

### 1. Try Different authSource Values

The `authSource` parameter tells MongoDB which database contains the user credentials. Try these options:

#### Option A: authSource=admin (Most Common)
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=admin
```

#### Option B: authSource=tradingbot (Original)
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=tradingbot
```

#### Option C: No authSource (Uses default)
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos
```

### 2. Verify User Credentials

Test the connection using MongoDB shell:

```bash
# Test with admin authSource
mongosh "mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=admin"

# Test with tradingbot authSource
mongosh "mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=tradingbot"

# Test without authSource
mongosh "mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos"
```

### 3. Check User Permissions

If you have admin access to MongoDB, verify the user exists:

```javascript
// Connect as admin
use admin
db.getUsers()

// Or check in tradingbot database
use tradingbot
db.getUsers()
```

### 4. Connection String Format

**Current (Updated)**: `authSource=admin`
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=admin
```

**Alternative**: If the user is in a different database, specify that:
```
mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/pos?authSource=<actual-auth-database>
```

## Updated Configuration

The connection string has been updated in:
- `backend/src/POS.Api/appsettings.Development.json` - Changed to `authSource=admin`

## For Azure DevOps

Update the `MONGO_CONNECTION_STRING` variable in the `POS-Secrets` variable group with the working connection string.

## Next Steps

1. **Test locally** with the updated connection string (`authSource=admin`)
2. **If it works**: Update Azure DevOps variable group
3. **If it still fails**: Try the other authSource options or verify credentials with your MongoDB administrator
