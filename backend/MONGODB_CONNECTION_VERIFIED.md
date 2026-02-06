# MongoDB Connection Verified

## User Details Confirmed

From `db.getUser("posuser")`:
- ✅ **User**: `posuser`
- ✅ **AuthSource**: `admin` (db: 'admin')
- ✅ **Roles**: `dbAdmin` and `readWrite` on `pos` database
- ✅ **Connection String**: `mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin`

## Connection String is Correct

Your connection string in `appsettings.Development.json` is correct:
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```

## The Issue is Network/Firewall

Since the user exists and credentials are correct, the timeout error means:
- MongoDB is not accessible from your local machine
- Likely causes:
  1. MongoDB only listening on `127.0.0.1` (localhost)
  2. Firewall blocking port `27017`
  3. Network connectivity issue

## Solutions

### Solution 1: Configure MongoDB to Listen on All Interfaces (Recommended)

On the server:

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Find and change:
# net:
#   bindIp: 127.0.0.1
# To:
# net:
#   bindIp: 0.0.0.0

# Restart MongoDB
sudo systemctl restart mongod

# Verify it's listening on all interfaces
sudo netstat -tlnp | grep 27017
# Should show: 0.0.0.0:27017 (not 127.0.0.1:27017)
```

### Solution 2: Open Firewall Port

```bash
# Allow MongoDB port
sudo ufw allow 27017/tcp

# Or if using firewalld
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --reload
```

### Solution 3: Use SSH Tunnel (Temporary for Development)

If you can't modify server config, use SSH tunnel:

```powershell
# On your local machine, create tunnel (keep this running)
ssh -L 27017:localhost:27017 root@185.193.66.50
```

Then update connection string to use `localhost`:
```
mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin
```

## Test Connection

After fixing network/firewall:

```powershell
# Test from your local machine
Test-NetConnection -ComputerName 185.193.66.50 -Port 27017
```

If `TcpTestSucceeded : True`, the connection should work!
