# MongoDB Exit Code 14 - Troubleshooting

Exit code 14 usually means a configuration or initialization error. Check the full error message.

## Check Full Error

```bash
# Get the complete error message
sudo journalctl -u mongod -n 20 --no-pager | grep -A 5 -B 5 "error\|Error\|ERROR\|FATAL\|F"

# Or check MongoDB log directly
sudo tail -20 /var/log/mongodb/mongod.log 2>/dev/null || echo "Log file doesn't exist"
```

## Common Causes of Exit Code 14

### 1. Configuration File Error

```bash
# Test the config file
sudo mongod --config /etc/mongod.conf --test

# This will show the exact error
```

### 2. Data Directory Permissions

```bash
# Check data directory
ls -la /var/lib/mongodb/

# Fix permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb/
sudo chmod 755 /var/lib/mongodb/
```

### 3. Port Already in Use

```bash
# Check if port 27017 is in use
sudo netstat -tlnp | grep 27017
sudo lsof -i :27017

# If something is using it, kill it
sudo kill <PID>
```

### 4. Corrupted Lock File

```bash
# Check for lock file
ls -la /var/lib/mongodb/*.lock

# Remove lock file if exists
sudo rm -f /var/lib/mongodb/*.lock
```

## Quick Diagnostic

Run this to see what's wrong:

```bash
# Try starting MongoDB manually to see full error
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf --fork --logpath /var/log/mongodb/mongod.log
```

This will show the exact error message.
