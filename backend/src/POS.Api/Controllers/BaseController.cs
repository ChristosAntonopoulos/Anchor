using Microsoft.AspNetCore.Mvc;
using POS.Application.DTOs;
using POS.Core.Constants;
using POS.Core.Entities;
using POS.Shared.Results;

namespace POS.Api.Controllers;

/// <summary>
/// Base controller with common functionality
/// </summary>
[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// Gets the current user ID from the request context
    /// TODO: Replace with actual authentication/authorization implementation
    /// </summary>
    protected string GetUserId()
    {
        // For now, return a default user ID
        // In production, extract from JWT token or claims
        return User?.Identity?.Name ?? AppConstants.DefaultUserId;
    }

    /// <summary>
    /// Creates a standardized success response
    /// </summary>
    protected IActionResult Success<T>(T data, string? message = null)
    {
        return Ok(ApiResponse<T>.SuccessResponse(data, message));
    }

    /// <summary>
    /// Creates a standardized success response without data
    /// </summary>
    protected IActionResult Success(string? message = null)
    {
        return Ok(ApiResponse.SuccessResponse(message));
    }

    /// <summary>
    /// Creates a standardized error response
    /// </summary>
    protected IActionResult Error(string message, List<ErrorDetail>? errors = null, int statusCode = 400)
    {
        var response = ApiResponse.ErrorResponse(message, errors);
        return StatusCode(statusCode, response);
    }

    /// <summary>
    /// Creates a standardized error response from validation errors
    /// </summary>
    protected IActionResult ValidationError(List<ErrorDetail> errors)
    {
        return Error("Validation failed", errors, 400);
    }

    /// <summary>
    /// Creates a not found response
    /// </summary>
    protected IActionResult NotFound(string message = "Resource not found")
    {
        return NotFound(ApiResponse.ErrorResponse(message));
    }

    /// <summary>
    /// Creates a bad request response
    /// </summary>
    protected IActionResult BadRequest(string message, List<ErrorDetail>? errors = null)
    {
        return base.BadRequest(ApiResponse.ErrorResponse(message, errors));
    }
}
