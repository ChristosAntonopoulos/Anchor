# Test MongoDB Connection on Server

## Exit mongosh First

If you're in mongosh, type `exit` to get back to bash.

## Test Connection with Proper Escaping

The `!` character in the password causes bash history expansion. Use single quotes:

```bash
# Exit mongosh if you're in it
exit

# Test connection with single quotes (prevents ! expansion)
mongosh 'mongodb://posuser:PosUserPassword123!@localhost:27017/pos?authSource=admin'

# Or escape the !
mongosh "mongodb://posuser:PosUserPassword123\!@localhost:27017/pos?authSource=admin"
```

## Check if Authentication is Enabled

```bash
# Check MongoDB config
cat /etc/mongod.conf | grep -A 3 "security:"

# If you see "authorization: enabled", auth is ON
# If not present, auth is OFF
```

## If Connection Works Without Auth

If `mongosh "mongodb://localhost:27017/pos"` worked, MongoDB doesn't have authentication enabled.

Use connection string without credentials:
```
mongodb://185.193.66.50:27017/pos
```
