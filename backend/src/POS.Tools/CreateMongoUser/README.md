# MongoDB User Creation Tool

This is a temporary tool to create a MongoDB user for the POS database.

## Usage

1. **Update admin credentials** in `Program.cs`:
   ```csharp
   var adminConnectionString = "mongodb://admin:adminpassword@185.193.66.50:27017/admin";
   ```
   Replace `admin` and `adminpassword` with your actual admin credentials.

2. **Run the tool**:
   ```powershell
   cd backend/src/POS.Tools/CreateMongoUser
   dotnet run
   ```

3. **The tool will**:
   - Connect to MongoDB as admin
   - Create user `posuser` with password `PosUserPassword123!`
   - Grant `readWrite` and `dbAdmin` roles on `pos` database
   - Test the connection
   - Display the connection string to use

4. **After successful creation**:
   - Update `appsettings.Development.json` with the connection string
   - Update Azure DevOps variable group
   - **Delete this tool** (it's temporary)

## Connection String Output

After successful creation, use this connection string:
```
mongodb://posuser:PosUserPassword123!@185.193.66.50:27017/pos?authSource=admin
```
