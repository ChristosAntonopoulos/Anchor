# MongoDB Security Incident - Recovery Guide

## Current Situation

MongoDB instance at `185.193.66.50:27017` appears to be compromised:
- Ransomware note: "READ__ME_TO_RECOVER_YOUR_DATA"
- Unauthorized databases visible: "TradingBot", "admin"
- Authentication appears to be disabled or compromised

## Immediate Actions Required

### 1. Check POS Database Status

Connect to MongoDB and check if POS database exists:

```bash
# Using MongoDB Compass or mongosh
mongodb://185.193.66.50:27017

# List all databases
show dbs

# Check if 'pos' database exists
use pos
show collections
```

### 2. Secure MongoDB Instance (URGENT)

**Step 1: Restrict Network Access**
```bash
# On the MongoDB server (185.193.66.50)
# Edit MongoDB config to bind only to localhost or specific IPs
sudo nano /etc/mongod.conf

# Set:
net:
  bindIp: 127.0.0.1  # Or specific IPs only
```

**Step 2: Enable Authentication**
```bash
# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "root", db: "admin" } ]
})

# Enable authentication in mongod.conf
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

**Step 3: Change All Passwords**
- Change admin password
- Change posuser password
- Rotate all credentials

**Step 4: Check for Backdoors**
```bash
# Check for unauthorized users
use admin
db.getUsers()

# Check for suspicious collections
db.getCollectionNames()
```

### 3. Assess Damage

**Check POS Database:**
```bash
use pos
db.getCollectionNames()

# Check if data is encrypted/corrupted
db.users.countDocuments()
db.betterItems.countDocuments()
# ... check other collections
```

**Check for Ransom Notes:**
```bash
# Look for README collections
db.getCollectionNames().filter(name => name.includes("README") || name.includes("readme"))

# Check all databases
db.adminCommand('listDatabases')
```

### 4. Recovery Options

**Option A: Restore from Backup**
```bash
# If you have backups, restore immediately
mongorestore --host 185.193.66.50:27017 --db pos /path/to/backup/pos
```

**Option B: Export Current Data (if not encrypted)**
```bash
# Export POS database if it's still accessible
mongodump --host 185.193.66.50:27017 --db pos --out /backup/pos-export
```

**Option C: Start Fresh (if data is lost)**
- Secure the instance first
- Re-seed database using the seeder
- Update connection strings

### 5. Prevent Future Attacks

1. **Enable Authentication** (MUST DO)
2. **Restrict Network Access** (firewall rules)
3. **Use Strong Passwords** (complex, unique)
4. **Regular Backups** (automated daily backups)
5. **Monitor Access Logs** (check for unauthorized access)
6. **Keep MongoDB Updated** (security patches)
7. **Use VPN/SSH Tunnel** (don't expose MongoDB directly to internet)

### 6. Update Application Configuration

After securing MongoDB, update connection strings:

**Development:**
```json
{
  "ConnectionStrings": {
    "MongoDb": "mongodb://posuser:NEW_STRONG_PASSWORD@185.193.66.50:27017/pos?authSource=admin"
  }
}
```

**Production (Kubernetes Secret):**
```bash
kubectl create secret generic pos-api-secrets \
  --from-literal=ConnectionStrings__MongoDb="mongodb://posuser:NEW_STRONG_PASSWORD@185.193.66.50:27017/pos?authSource=admin" \
  --namespace=pos \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Security Best Practices Going Forward

1. **Never expose MongoDB to public internet without authentication**
2. **Use firewall rules to restrict access**
3. **Enable MongoDB authentication (required)**
4. **Use strong, unique passwords**
5. **Regular automated backups**
6. **Monitor access logs**
7. **Keep MongoDB and system updated**
8. **Use VPN or SSH tunnel for remote access**

## Next Steps

1. ✅ Check if POS database exists and is accessible
2. ✅ Secure MongoDB instance (authentication + firewall)
3. ✅ Assess damage to POS database
4. ✅ Restore from backup OR re-seed if needed
5. ✅ Update all connection strings
6. ✅ Monitor for further unauthorized access
