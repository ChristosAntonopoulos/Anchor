# MongoDB is Running - Fix systemd to Start Automatically

MongoDB is running manually but systemd can't start it. Let's fix systemd so it starts automatically.

## Current Status

✅ MongoDB is running (PID 3916529)
✅ Listening on `0.0.0.0:27017` (accessible from all interfaces)
✅ Firewall port 27017 is open

## Fix systemd to Start MongoDB Automatically

### Option 1: Stop Manual Process and Fix systemd

```bash
# Stop the manual MongoDB process
sudo kill 3916529

# Wait a moment
sleep 2

# Remove any lock files
sudo rm -f /var/lib/mongodb/*.lock

# Try starting via systemd
sudo systemctl start mongod
sudo systemctl status mongod
```

### Option 2: If systemd Still Fails

Check the exact error:

```bash
# Get the latest error
sudo journalctl -u mongod -n 20 --no-pager

# Or try starting manually to see error
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf --fork --logpath /var/log/mongodb/mongod.log
```

### Option 3: Keep Manual Start (Temporary)

If systemd keeps failing, you can keep MongoDB running manually for now:

```bash
# Start MongoDB in background
sudo -u mongodb /usr/bin/mongod --config /etc/mongod.conf --fork --logpath /var/log/mongodb/mongod.log

# Verify it's running
ps aux | grep mongod | grep -v grep
sudo netstat -tlnp | grep 27017
```

## Test Connection from Local Machine

Now that MongoDB is listening on `0.0.0.0:27017`, test from your local machine:

```powershell
# Test port connectivity
Test-NetConnection -ComputerName 185.193.66.50 -Port 27017

# Should show: TcpTestSucceeded : True
```

## Connection String

Your connection string is correct:
```
mongodb://185.193.66.50:27017/pos
```

Your backend should now be able to connect!
