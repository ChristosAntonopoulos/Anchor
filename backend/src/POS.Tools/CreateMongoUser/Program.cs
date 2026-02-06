using MongoDB.Driver;

namespace POS.Tools.CreateMongoUser;

/// <summary>
/// Temporary tool to create MongoDB user for POS database
/// Run this once to create the user, then delete this project
/// </summary>
class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("MongoDB User Creation Tool");
        Console.WriteLine("==========================\n");

        // Admin connection string - UPDATE WITH YOUR ADMIN CREDENTIALS
        // Try these options:
        // 1. If you know admin credentials: mongodb://admin:password@185.193.66.50:27017/admin
        // 2. Try tradingbot with admin authSource: mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot
        // 3. Try no auth (if server allows): mongodb://185.193.66.50:27017/admin
        
        Console.WriteLine("Enter admin connection string (or press Enter to try tradingbot user):");
        Console.WriteLine("Examples:");
        Console.WriteLine("  - mongodb://admin:password@185.193.66.50:27017/admin");
        Console.WriteLine("  - mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot");
        Console.WriteLine("  - mongodb://185.193.66.50:27017/admin (no auth)");
        Console.Write("\nConnection string: ");
        
        var input = Console.ReadLine();
        var adminConnectionString = string.IsNullOrWhiteSpace(input) 
            ? "mongodb://tradingbot:YourtradingbotPassword123@185.193.66.50:27017/admin?authSource=tradingbot"
            : input;
        
        // New user credentials
        var newUsername = "posuser";
        var newPassword = "PosUserPassword123!";
        var targetDatabase = "pos";

        Console.WriteLine($"Connecting to MongoDB as admin...");
        Console.WriteLine($"Server: 185.193.66.50:27017");
        Console.WriteLine($"Creating user: {newUsername}");
        Console.WriteLine($"Target database: {targetDatabase}\n");

        try
        {
            var adminClient = new MongoClient(adminConnectionString);
            var adminDatabase = adminClient.GetDatabase("admin");

            // Check if user already exists
            var existingUsers = await adminDatabase.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                new MongoDB.Bson.BsonDocument("usersInfo", newUsername));

            if (existingUsers["users"].AsBsonArray.Count > 0)
            {
                Console.WriteLine($"⚠️  User '{newUsername}' already exists!");
                Console.WriteLine("Do you want to update the password? (y/n): ");
                var response = Console.ReadLine();
                
                if (response?.ToLower() == "y")
                {
                    // Update password
                    await adminDatabase.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                        new MongoDB.Bson.BsonDocument
                        {
                            { "updateUser", newUsername },
                            { "pwd", newPassword }
                        });
                    Console.WriteLine($"✅ Password updated for user '{newUsername}'");
                }
                else
                {
                    Console.WriteLine("Skipping user creation.");
                    return;
                }
            }
            else
            {
                // Create new user
                var createUserCommand = new MongoDB.Bson.BsonDocument
                {
                    { "createUser", newUsername },
                    { "pwd", newPassword },
                    { "roles", new MongoDB.Bson.BsonArray
                        {
                            new MongoDB.Bson.BsonDocument
                            {
                                { "role", "readWrite" },
                                { "db", targetDatabase }
                            },
                            new MongoDB.Bson.BsonDocument
                            {
                                { "role", "dbAdmin" },
                                { "db", targetDatabase }
                            }
                        }
                    }
                };

                await adminDatabase.RunCommandAsync<MongoDB.Bson.BsonDocument>(createUserCommand);
                Console.WriteLine($"✅ User '{newUsername}' created successfully!");
            }

            // Test connection with new user
            Console.WriteLine("\nTesting connection with new user...");
            var testConnectionString = $"mongodb://{newUsername}:{newPassword}@185.193.66.50:27017/{targetDatabase}?authSource=admin";
            var testClient = new MongoClient(testConnectionString);
            var testDatabase = testClient.GetDatabase(targetDatabase);
            
            // Try to run a simple command
            await testDatabase.RunCommandAsync<MongoDB.Bson.BsonDocument>(
                new MongoDB.Bson.BsonDocument("ping", 1));
            
            Console.WriteLine("✅ Connection test successful!");
            Console.WriteLine("\n📋 Connection String for your application:");
            Console.WriteLine($"   {testConnectionString}");
            Console.WriteLine("\n⚠️  Remember to update:");
            Console.WriteLine("   1. appsettings.Development.json");
            Console.WriteLine("   2. Azure DevOps variable group 'POS-Secrets'");
        }
        catch (MongoAuthenticationException ex)
        {
            Console.WriteLine($"❌ Authentication failed!");
            Console.WriteLine($"   Error: {ex.Message}");
            Console.WriteLine("\n💡 Check:");
            Console.WriteLine("   - Admin username and password are correct");
            Console.WriteLine("   - MongoDB server is accessible");
            Console.WriteLine("   - Admin user has permission to create users");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Console.WriteLine($"   Stack: {ex.StackTrace}");
        }
    }
}
