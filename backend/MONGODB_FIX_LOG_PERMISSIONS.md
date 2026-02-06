# Fix MongoDB Log File Permissions

The error shows MongoDB cannot write to `/var/log/mongodb/mongod.log`.

## Quick Fix

Run these commands on the server:

```bash
# 1. Check current permissions
ls -la /var/log/mongodb/

# 2. Fix ownership (MongoDB user needs to own the log directory)
sudo chown -R mongodb:mongodb /var/log/mongodb/

# 3. Fix permissions
sudo chmod 755 /var/log/mongodb/
sudo chmod 644 /var/log/mongodb/mongod.log 2>/dev/null || true

# 4. If log file exists but has wrong permissions, remove it (MongoDB will recreate)
sudo rm -f /var/log/mongodb/mongod.log

# 5. Restart MongoDB
sudo systemctl restart mongod
sudo systemctl status mongod
```

## Alternative: Remove Log File

If the above doesn't work:

```bash
# Remove the problematic log file
sudo rm -f /var/log/mongodb/mongod.log

# Ensure directory permissions are correct
sudo chown -R mongodb:mongodb /var/log/mongodb/
sudo chmod 755 /var/log/mongodb/

# Restart MongoDB (it will create a new log file)
sudo systemctl restart mongod
```

## Verify Fix

```bash
# Check MongoDB status
sudo systemctl status mongod

# Should show: Active: active (running)
# Not: Active: failed
```
