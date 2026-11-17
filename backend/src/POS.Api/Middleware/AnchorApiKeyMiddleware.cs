using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using POS.Application.Configuration;
using POS.Shared.Results;

namespace POS.Api.Middleware;

/// <summary>
/// Requires header X-Anchor-Key for protected write routes when AnchorApi:Key is configured.
/// </summary>
public class AnchorApiKeyMiddleware
{
    private readonly RequestDelegate _next;

    public AnchorApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IOptions<AnchorApiOptions> optionsAccessor)
    {
        var options = optionsAccessor.Value;
        var expected = options.Key?.Trim();
        if (string.IsNullOrEmpty(expected))
        {
            await _next(context);
            return;
        }

        if (!RequiresKey(context.Request, options.ProtectAllWrites))
        {
            await _next(context);
            return;
        }

        var provided = context.Request.Headers[AnchorApiOptions.HeaderName].ToString();
        if (!TokenMatches(expected, provided))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var body = ApiResponse.ErrorResponse($"Missing or invalid {AnchorApiOptions.HeaderName} header.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
            return;
        }

        await _next(context);
    }

    private static bool RequiresKey(HttpRequest request, bool protectAllWrites)
    {
        var method = request.Method;
        var isWrite = HttpMethods.IsPost(method)
            || HttpMethods.IsPut(method)
            || HttpMethods.IsPatch(method)
            || HttpMethods.IsDelete(method);
        if (!isWrite)
        {
            return false;
        }

        var path = request.Path.Value ?? string.Empty;
        if (IsExempt(path))
        {
            return false;
        }

        if (IsAssistantSurface(path))
        {
            return true;
        }

        return protectAllWrites;
    }

    private static bool IsExempt(string path)
    {
        return path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/health", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/app/release", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAssistantSurface(string path)
    {
        return path.StartsWith("/api/assistant", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/api/notifications/push", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/api/notification/push", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TokenMatches(string expected, string provided)
    {
        if (string.IsNullOrEmpty(provided))
        {
            return false;
        }

        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var providedBytes = Encoding.UTF8.GetBytes(provided);
        return expectedBytes.Length == providedBytes.Length
            && CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes);
    }
}
