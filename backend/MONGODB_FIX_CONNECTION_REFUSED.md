# Fix MongoDB Connection Refused Error

The error "target machine actively refused it" means MongoDB is not accessible from your local machine.

## Quick Fix on Server

SSH into the server and run these commands:

### Step 1: Check MongoDB Configuration

```bash
# Check what MongoDB is listening on
cat /etc/mongod.conf | grep -A 2 "net:"

# Check if MongoDB is running
sudo systemctl status mongod
```

### Step 2: Update MongoDB to Listen on All Interfaces

```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Find the net: section and change:
# net:
#   bindIp: 127.0.0.1
# To:
# net:
#   bindIp: 0.0.0.0
#   port: 27017

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 3: Restart MongoDB

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

### Step 4: Verify MongoDB is Listening on All Interfaces

```bash
# Check what MongoDB is listening on
sudo netstat -tlnp | grep 27017
# Should show: 0.0.0.0:27017 (not 127.0.0.1:27017)

# Or using ss command
sudo ss -tlnp | grep 27017
```

### Step 5: Open Firewall Port

```bash
# Check firewall status
sudo ufw status

# Allow MongoDB port
sudo ufw allow 27017/tcp

# Or if using firewalld
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --reload
```

### Step 6: Test from Server

```bash
# Test connection from server itself
mongosh "mongodb://localhost:27017/pos"
```

## Alternative: Use SSH Tunnel (If You Can't Modify Server)

If you can't change MongoDB config, use SSH tunnel:

```powershell
# On your local machine, create tunnel (keep this terminal open)
ssh -L 27017:localhost:27017 root@185.193.66.50
```

Then update connection string to:
```
mongodb://localhost:27017/pos
```

## Verify Fix

After making changes, test from your local machine:

```powershell
# Test port connectivity
Test-NetConnection -ComputerName 185.193.66.50 -Port 27017
```

If `TcpTestSucceeded : True`, the connection should work!

## Common Issues

1. **MongoDB only on localhost**: Change `bindIp: 127.0.0.1` to `bindIp: 0.0.0.0`
2. **Firewall blocking**: Open port 27017
3. **MongoDB not running**: `sudo systemctl start mongod`
