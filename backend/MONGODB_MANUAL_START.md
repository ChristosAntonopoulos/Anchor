# Start MongoDB Manually to See Full Error

Since systemd isn't showing the full error, start MongoDB manually:

## Step 1: Start MongoDB Manually

```bash
# Start MongoDB as the mongodb user to see full error
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf
```

This will show the complete error message in the terminal. Don't use `--fork` so you can see the error.

## Step 2: Check Data Directory Permissions

While checking, also verify data directory:

```bash
# Check data directory permissions
ls -la /var/lib/mongodb/

# Fix if needed
sudo chown -R mongodb:mongodb /var/lib/mongodb/
sudo chmod 755 /var/lib/mongodb/

# Remove any lock files
sudo rm -f /var/lib/mongodb/*.lock
```

## Step 3: Check Config File

```bash
# Verify config file is valid
cat /etc/mongod.conf | grep -A 10 "net:"
cat /etc/mongod.conf | grep -A 5 "storage:"
cat /etc/mongod.conf | grep -A 5 "systemLog:"
```

## Common Exit Code 14 Causes

1. **Data directory permissions** - MongoDB can't write to data directory
2. **Lock file** - Old lock file preventing startup
3. **Config file error** - Invalid configuration
4. **Port conflict** - Port already in use (but we checked this)

## After Seeing Error

Once you see the full error from manual start, we can fix it specifically.
