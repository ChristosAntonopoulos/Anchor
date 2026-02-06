using AutoMapper;
using POS.Shared.Results;

namespace POS.Application.Mappings;

/// <summary>
/// Extension methods for AutoMapper
/// </summary>
public static class MappingExtensions
{
    /// <summary>
    /// Maps a result to an API response
    /// </summary>
    public static ApiResponse<TDto> ToApiResponse<TDto>(this Result<TDto> result)
    {
        if (result.IsSuccess)
        {
            return ApiResponse<TDto>.SuccessResponse(result.Value!);
        }

        return ApiResponse<TDto>.ErrorResponse(result.Error ?? "An error occurred", result.Errors);
    }

    /// <summary>
    /// Maps a result to an API response
    /// </summary>
    public static ApiResponse ToApiResponse(this Result result)
    {
        if (result.IsSuccess)
        {
            return ApiResponse.SuccessResponse();
        }

        return ApiResponse.ErrorResponse(result.Error ?? "An error occurred", result.Errors);
    }
}
