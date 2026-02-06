# MongoDB Connection Setup

## Connection Details

**Server**: `185.193.66.50:27017`  
**Database**: `pos`  
**Username**: `posuser`  
**Auth Source**: `admin`

## Connection String

For Azure DevOps Variable Group `POS-Secrets`:

```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```

## Azure DevOps Variable Group Setup

### Variable Group: `POS-Secrets`

| Variable Name | Value | Secret? |
|--------------|-------|---------|
| `MONGO_CONNECTION_STRING` | `mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin` | ✅ Yes |
| `DOCKER_USERNAME` | Your Docker Hub username | No |
| `DOCKER_PASSWORD` | Your Docker Hub password/token | ✅ Yes |

## Database Creation

The database `pos` will be automatically created when the application first connects to MongoDB. No manual creation is required.

## Verification

To verify the connection string works:

```bash
# Test connection
mongosh "mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin"

# Or using mongo client
mongo "mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin"
```

## Security Notes

- ✅ Connection string is stored in Azure DevOps Variable Group as a secret
- ✅ Never commit the connection string to git
- ✅ The password is only visible in Azure DevOps (encrypted)
- ✅ Kubernetes secrets are created from the variable group during deployment
