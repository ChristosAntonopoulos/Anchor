# Test MongoDB Authentication

Authentication is failing. Let's verify the user and test the connection.

## Test Connection on Server

SSH into the server and test the connection:

```bash
# Test connection with posuser
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin"

# If that fails, try without authSource
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/pos"

# If that fails, check if user exists
mongosh
use admin
db.getUser("posuser")
```

## Verify User Password

If authentication fails, the password might be wrong. Check:

```bash
# Connect as admin (if you have admin credentials)
mongosh "mongodb://admin:admin@localhost:27017/admin"

# Then check posuser
use admin
db.getUser("posuser")

# Try to change password if needed
db.changeUserPassword("posuser", "PosUserPassword123!")
```

## Alternative: Disable Authentication Temporarily

If you need to get it working quickly, you can disable authentication:

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Comment out or remove the security section:
# security:
#   authorization: enabled

# Restart MongoDB (if using systemd)
# Or if running manually, stop and restart without auth
```

Then use connection string without credentials:
```
mongodb://185.193.66.50:27017/pos
```
