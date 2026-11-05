using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http.Features;
using POS.Api.Services;

namespace POS.Api.Controllers;

/// <summary>
/// Publishes and downloads the Android APK the phone installs on open.
/// </summary>
[ApiController]
[Route("api/app/release")]
[Tags("App")]
public class AppReleaseController : ControllerBase
{
    private const long MaxApkBytes = 262_144_000;

    private readonly AppReleaseService _releases;
    private readonly IConfiguration _configuration;

    public AppReleaseController(AppReleaseService releases, IConfiguration configuration)
    {
        _releases = releases;
        _configuration = configuration;
    }

    /// <summary>
    /// Current published release. 204 when nothing has been published yet.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var current = await _releases.GetCurrentAsync(cancellationToken);
        if (current == null)
        {
            return NoContent();
        }

        return Ok(ToResponse(current));
    }

    /// <summary>
    /// APK bytes for the current release.
    /// </summary>
    [HttpGet("apk")]
    public async Task<IActionResult> Download(CancellationToken cancellationToken)
    {
        var current = await _releases.GetCurrentAsync(cancellationToken);
        if (current == null)
        {
            return NotFound();
        }

        HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();
        var stream = await _releases.OpenApkAsync(current.GridFsId, cancellationToken);
        return File(stream, "application/vnd.android.package-archive", $"pos-{current.VersionCode}.apk");
    }

    /// <summary>
    /// Replace the current APK. Requires the deploy-time upload token.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxApkBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxApkBytes)]
    public async Task<IActionResult> Publish(
        [FromForm] string version,
        [FromForm] int versionCode,
        IFormFile? apk,
        CancellationToken cancellationToken)
    {
        var expectedToken = _configuration["AppRelease:UploadToken"];
        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "App updates are not configured."
            });
        }

        if (!TokenMatches(expectedToken, Request.Headers["X-Release-Token"].ToString()))
        {
            return Unauthorized(new { message = "Upload token was rejected." });
        }

        if (!IsVersion(version) || versionCode <= 0)
        {
            return BadRequest(new { message = "Version and versionCode are required." });
        }

        if (apk == null || apk.Length <= 0 || apk.Length > MaxApkBytes)
        {
            return BadRequest(new { message = "An APK file is required." });
        }

        await using var stream = apk.OpenReadStream();
        if (!await HasZipHeaderAsync(stream, cancellationToken))
        {
            return BadRequest(new { message = "The uploaded file is not an APK." });
        }

        try
        {
            var published = await _releases.PublishAsync(version.Trim(), versionCode, stream, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, ToResponse(published));
        }
        catch (OlderAppReleaseException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    private static object ToResponse(AppReleaseInfo release)
    {
        return new
        {
            version = release.Version,
            versionCode = release.VersionCode,
            releasedAt = release.ReleasedAt
        };
    }

    private static bool TokenMatches(string expected, string provided)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var providedBytes = Encoding.UTF8.GetBytes(provided);
        return expectedBytes.Length == providedBytes.Length
            && CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }

    private static bool IsVersion(string? version)
    {
        if (string.IsNullOrWhiteSpace(version) || version.Length > 32)
        {
            return false;
        }

        foreach (var character in version.Trim())
        {
            var allowed = char.IsAsciiLetterOrDigit(character)
                || character is '.' or '_' or '+' or '-';
            if (!allowed)
            {
                return false;
            }
        }

        return true;
    }

    private static async Task<bool> HasZipHeaderAsync(Stream stream, CancellationToken cancellationToken)
    {
        if (!stream.CanSeek)
        {
            return false;
        }

        var header = new byte[2];
        var read = await stream.ReadAsync(header, cancellationToken);
        stream.Position = 0;
        return read == 2 && header[0] == 0x50 && header[1] == 0x4B;
    }
}
