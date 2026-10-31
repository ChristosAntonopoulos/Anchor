using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;

namespace POS.Api.Services;

/// <summary>
/// Stores the current Android APK in GridFS so a pod restart does not drop it.
/// </summary>
public class AppReleaseService
{
    public const string BucketName = "appReleaseApks";
    private const string CurrentId = "current";

    private readonly IMongoDatabase _database;
    private readonly ILogger<AppReleaseService> _logger;

    public AppReleaseService(IMongoDatabase database, ILogger<AppReleaseService> logger)
    {
        _database = database;
        _logger = logger;
    }

    public async Task<AppReleaseInfo?> GetCurrentAsync(CancellationToken cancellationToken)
    {
        var document = await CurrentCollection()
            .Find(Builders<BsonDocument>.Filter.Eq("_id", CurrentId))
            .FirstOrDefaultAsync(cancellationToken);

        if (document == null)
        {
            return null;
        }

        return new AppReleaseInfo(
            document["version"].AsString,
            document["versionCode"].ToInt32(),
            document["gridFsId"].AsObjectId,
            document["releasedAt"].ToUniversalTime());
    }

    public async Task<AppReleaseInfo> PublishAsync(
        string version,
        int versionCode,
        Stream apkStream,
        CancellationToken cancellationToken)
    {
        var current = await GetCurrentAsync(cancellationToken);
        if (current != null && versionCode < current.VersionCode)
        {
            throw new OlderAppReleaseException(current.VersionCode);
        }

        var bucket = CreateBucket();
        ObjectId gridFsId;
        try
        {
            gridFsId = await bucket.UploadFromStreamAsync(
                $"pos-{versionCode}.apk",
                apkStream,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store app release {VersionCode}", versionCode);
            throw;
        }

        var releasedAt = DateTime.UtcNow;
        var document = new BsonDocument
        {
            { "_id", CurrentId },
            { "version", version },
            { "versionCode", versionCode },
            { "gridFsId", gridFsId },
            { "releasedAt", releasedAt }
        };

        try
        {
            await CurrentCollection().ReplaceOneAsync(
                Builders<BsonDocument>.Filter.Eq("_id", CurrentId),
                document,
                new ReplaceOptions { IsUpsert = true },
                cancellationToken);
        }
        catch
        {
            await DeleteQuietlyAsync(bucket, gridFsId, cancellationToken);
            throw;
        }

        if (current != null && current.GridFsId != gridFsId)
        {
            await DeleteQuietlyAsync(bucket, current.GridFsId, cancellationToken);
        }

        _logger.LogInformation("Published app release {Version} ({VersionCode})", version, versionCode);
        return new AppReleaseInfo(version, versionCode, gridFsId, releasedAt);
    }

    public async Task<Stream> OpenApkAsync(ObjectId gridFsId, CancellationToken cancellationToken)
    {
        return await CreateBucket().OpenDownloadStreamAsync(gridFsId, cancellationToken: cancellationToken);
    }

    private IMongoCollection<BsonDocument> CurrentCollection()
    {
        return _database.GetCollection<BsonDocument>("appReleases");
    }

    private GridFSBucket CreateBucket()
    {
        return new GridFSBucket(_database, new GridFSBucketOptions
        {
            BucketName = BucketName
        });
    }

    private async Task DeleteQuietlyAsync(GridFSBucket bucket, ObjectId gridFsId, CancellationToken cancellationToken)
    {
        try
        {
            await bucket.DeleteAsync(gridFsId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not delete previous app release file {GridFsId}", gridFsId);
        }
    }
}

public sealed record AppReleaseInfo(string Version, int VersionCode, ObjectId GridFsId, DateTime ReleasedAt);

public sealed class OlderAppReleaseException : Exception
{
    public OlderAppReleaseException(int currentVersionCode)
        : base($"Version {currentVersionCode} is already published.")
    {
        CurrentVersionCode = currentVersionCode;
    }

    public int CurrentVersionCode { get; }
}
