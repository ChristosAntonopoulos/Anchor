# MongoDB Connection Timeout Troubleshooting

The timeout error means your local machine can't reach the MongoDB server at `185.193.66.50:27017`.

## Common Causes

1. **MongoDB only listening on localhost** (not external IP)
2. **Firewall blocking port 27017**
3. **Network connectivity issues**
4. **MongoDB not running**

## Solutions

### Solution 1: Check if MongoDB is Listening on External IP

On the server, check MongoDB configuration:

```bash
# SSH into server
ssh user@185.193.66.50

# Check MongoDB config
cat /etc/mongod.conf | grep bindIp

# If it shows: bindIp: 127.0.0.1
# MongoDB is only listening on localhost (not accessible externally)
```

**Fix**: Update MongoDB to listen on all interfaces:

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Change:
# net:
#   bindIp: 127.0.0.1
# To:
# net:
#   bindIp: 0.0.0.0

# Restart MongoDB
sudo systemctl restart mongod
```

### Solution 2: Check Firewall

On the server, check if port 27017 is open:

```bash
# Check firewall status
sudo ufw status
# Or
sudo firewall-cmd --list-all

# Open port 27017 if needed
sudo ufw allow 27017/tcp
# Or
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --reload
```

### Solution 3: Test Connection from Server

On the server itself, test if MongoDB is accessible:

```bash
# From the server
mongosh "mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin"
```

If this works, the issue is network/firewall, not MongoDB.

### Solution 4: Use SSH Tunnel (Temporary Solution)

If you can't change MongoDB config, use SSH tunnel:

```bash
# On your local machine, create SSH tunnel
ssh -L 27017:localhost:27017 user@185.193.66.50

# Keep this terminal open, then use localhost in connection string
```

Then update connection string to:
```
mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin
```

### Solution 5: Check MongoDB is Running

```bash
# On server
sudo systemctl status mongod
sudo systemctl start mongod  # If not running
```

## Quick Test Commands

### From Your Local Machine

```powershell
# Test if port is open
Test-NetConnection -ComputerName 185.193.66.50 -Port 27017

# Or using telnet
telnet 185.193.66.50 27017
```

### From Server

```bash
# Check what MongoDB is listening on
sudo netstat -tlnp | grep 27017
# Or
sudo ss -tlnp | grep 27017

# Should show: 0.0.0.0:27017 (all interfaces)
# Not: 127.0.0.1:27017 (localhost only)
```

## Recommended Fix

**Most likely issue**: MongoDB is only listening on `127.0.0.1` (localhost).

**Fix on server**:

1. Edit MongoDB config:
   ```bash
   sudo nano /etc/mongod.conf
   ```

2. Find the `net:` section and change:
   ```yaml
   net:
     bindIp: 0.0.0.0  # Listen on all interfaces
     port: 27017
   ```

3. Restart MongoDB:
   ```bash
   sudo systemctl restart mongod
   ```

4. Open firewall:
   ```bash
   sudo ufw allow 27017/tcp
   ```

5. Test from your local machine:
   ```powershell
   Test-NetConnection -ComputerName 185.193.66.50 -Port 27017
   ```

## Alternative: Use SSH Tunnel for Development

If you can't modify server config, use SSH tunnel for local development:

```powershell
# Create tunnel (keep this running)
ssh -L 27017:localhost:27017 root@185.193.66.50

# Then use localhost in connection string
```

Update `appsettings.Development.json`:
```json
"ConnectionStrings": {
  "MongoDb": "mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin"
}
```
