# MongoDB Already Running - Fix

MongoDB is running but only listening on localhost (127.0.0.1). We need to:
1. Stop the existing MongoDB process
2. Update config to listen on all interfaces (0.0.0.0)
3. Restart via systemd

## Step 1: Stop Existing MongoDB Process

```bash
# Kill the existing MongoDB process
sudo kill 3869329

# Or kill all mongod processes
sudo pkill mongod

# Verify it's stopped
sudo netstat -tlnp | grep 27017
# Should show nothing
```

## Step 2: Update MongoDB Config to Listen on All Interfaces

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

## Step 3: Start MongoDB via systemd

```bash
# Start MongoDB
sudo systemctl start mongod

# Check status
sudo systemctl status mongod

# Should show: Active: active (running)
```

## Step 4: Verify It's Listening on All Interfaces

```bash
# Check what MongoDB is listening on
sudo netstat -tlnp | grep 27017

# Should show: 0.0.0.0:27017 (not 127.0.0.1:27017)
```

## Step 5: Open Firewall Port

```bash
# Allow MongoDB port
sudo ufw allow 27017/tcp

# Or if using firewalld
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --reload
```

## After This

Your backend should be able to connect from your local machine!
