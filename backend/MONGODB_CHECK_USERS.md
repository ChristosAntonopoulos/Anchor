# MongoDB User Inspection Commands

Commands to check users and their roles/permissions.

## Connect to MongoDB

```bash
# Connect as admin (try these until one works)
mongosh "mongodb://admin:admin@localhost:27017/admin"
# Or
mongosh "mongodb://root:root@localhost:27017/admin"
# Or if no auth needed
mongosh
```

## Check Users in Admin Database

```javascript
// Switch to admin database
use admin

// List all users in admin database
db.getUsers()

// Get specific user details
db.getUser("posuser")

// Get specific user details (verbose)
db.getUser("posuser", { showCredentials: true })

// Check current user
db.runCommand({ connectionStatus: 1 })
```

## Check Users in POS Database

```javascript
// Switch to pos database
use pos

// List all users in pos database
db.getUsers()

// Get specific user details
db.getUser("posuser")
```

## Check User Roles and Permissions

```javascript
// Get user with full role details
db.getUser("posuser")

// This will show:
// - user: username
// - roles: array of roles with database
// - mechanisms: authentication mechanisms
```

## List All Users Across All Databases

```javascript
// In admin database
use admin

// Get all users
db.getUsers()

// For each user, you'll see:
// {
//   _id: "admin.posuser",
//   userId: UUID("..."),
//   user: "posuser",
//   db: "admin",  // <-- This is the authSource!
//   roles: [
//     { role: "readWrite", db: "pos" },
//     { role: "dbAdmin", db: "pos" }
//   ],
//   mechanisms: [ "SCRAM-SHA-1", "SCRAM-SHA-256" ]
// }
```

## Quick Check: Find AuthSource

```javascript
// Connect and check
use admin
db.getUser("posuser")

// Look at the "db" field - that's your authSource!
// If it shows: db: "admin" → use authSource=admin
// If it shows: db: "pos" → use authSource=pos
```

## Check What Database User Was Created In

```javascript
// Method 1: Check admin database
use admin
db.getUsers().forEach(user => {
  if (user.user === "posuser") {
    print("User found in: " + user.db);
    print("AuthSource should be: " + user.db);
  }
})

// Method 2: Check pos database
use pos
db.getUsers().forEach(user => {
  if (user.user === "posuser") {
    print("User found in: " + user.db);
    print("AuthSource should be: " + user.db);
  }
})
```

## Complete User Inspection Script

```javascript
// Run this to see all users and their authSource
print("=== Users in Admin Database ===");
use admin
db.getUsers().forEach(user => {
  print("\nUser: " + user.user);
  print("AuthSource (db): " + user.db);
  print("Roles:");
  user.roles.forEach(role => {
    print("  - " + role.role + " on " + role.db);
  });
});

print("\n=== Users in POS Database ===");
use pos
db.getUsers().forEach(user => {
  print("\nUser: " + user.user);
  print("AuthSource (db): " + user.db);
  print("Roles:");
  user.roles.forEach(role => {
    print("  - " + role.role + " on " + role.db);
  });
});
```

## Quick One-Liner to Find AuthSource

```javascript
// Find posuser and show authSource
use admin; db.getUsers().find(u => u.user === "posuser").forEach(u => print("AuthSource: " + u.db))
```

## After Finding AuthSource

Once you know the authSource (the `db` field from `getUser()`), use it in your connection string:

```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=<the-db-value>
```
