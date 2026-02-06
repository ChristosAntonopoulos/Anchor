# Get Full MongoDB Error Message

MongoDB is failing with exit code 14. We need to see the complete error message.

## Get Full Error

```bash
# Get the complete error from journalctl
sudo journalctl -u mongod -n 50 --no-pager | tail -20

# Or try starting manually to see the full error
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf

# This will show the exact error message in the terminal
```

## Common Issues with Exit Code 14

### 1. Data Directory Permissions
```bash
# Check and fix data directory
ls -la /var/lib/mongodb/
sudo chown -R mongodb:mongodb /var/lib/mongodb/
sudo chmod 755 /var/lib/mongodb/
```

### 2. Log Directory Permissions
```bash
# Check and fix log directory
ls -la /var/log/mongodb/
sudo chown -R mongodb:mongodb /var/log/mongodb/
sudo chmod 755 /var/log/mongodb/
sudo rm -f /var/log/mongodb/mongod.log
```

### 3. Lock File
```bash
# Remove lock files
sudo rm -f /var/lib/mongodb/*.lock
```

### 4. Config File Syntax
```bash
# Test config file
sudo mongod --config /etc/mongod.conf --test
```

## Quick Fix: Try All Permissions

```bash
# Fix all MongoDB directories
sudo chown -R mongodb:mongodb /var/lib/mongodb/
sudo chown -R mongodb:mongodb /var/log/mongodb/
sudo chmod 755 /var/lib/mongodb/
sudo chmod 755 /var/log/mongodb/
sudo rm -f /var/lib/mongodb/*.lock
sudo rm -f /var/log/mongodb/mongod.log

# Restart
sudo systemctl restart mongod
sudo systemctl status mongod
```
