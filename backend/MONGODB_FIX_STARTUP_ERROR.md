# Fix MongoDB Startup Error

MongoDB is failing to start. Check the logs to see the exact error.

## Step 1: Check MongoDB Logs

```bash
# Check systemd logs
sudo journalctl -u mongod -n 50 --no-pager

# Or check MongoDB log file
sudo tail -50 /var/log/mongodb/mongod.log
```

## Step 2: Common Issues and Fixes

### Issue 1: Configuration File Error

If you see "FATAL" error about config:

```bash
# Test MongoDB config syntax
sudo mongod --config /etc/mongod.conf --test

# If there's a syntax error, check the config
sudo cat /etc/mongod.conf
```

### Issue 2: bindIp Format Error

If you changed bindIp, make sure the format is correct:

```bash
# Check current config
cat /etc/mongod.conf | grep -A 3 "net:"

# Should be:
# net:
#   bindIp: 0.0.0.0
#   port: 27017
```

**Common mistake**: Using quotes around 0.0.0.0
- ❌ Wrong: `bindIp: "0.0.0.0"`
- ✅ Correct: `bindIp: 0.0.0.0`

### Issue 3: Data Directory Permissions

```bash
# Check data directory
ls -la /var/lib/mongodb/

# Fix permissions if needed
sudo chown -R mongodb:mongodb /var/lib/mongodb/
sudo chmod 755 /var/lib/mongodb/
```

### Issue 4: Port Already in Use

```bash
# Check if port is in use
sudo netstat -tlnp | grep 27017
sudo lsof -i :27017

# Kill process if needed
sudo kill <PID>
```

## Step 3: Restore Working Config

If you made changes that broke it, restore:

```bash
# Backup current (broken) config
sudo cp /etc/mongod.conf /etc/mongod.conf.broken

# Check if there's a backup
ls -la /etc/mongod.conf*

# Restore default or working config
# You might need to reinstall or restore from backup
```

## Step 4: Manual Start to See Error

```bash
# Try starting manually to see full error
sudo mongod --config /etc/mongod.conf

# This will show the exact error message
```

## Quick Fix: Reset bindIp

If the issue is bindIp, fix it:

```bash
# Edit config
sudo nano /etc/mongod.conf

# Make sure net section looks like this (NO QUOTES):
net:
  bindIp: 0.0.0.0
  port: 27017

# Save and restart
sudo systemctl restart mongod
sudo systemctl status mongod
```
