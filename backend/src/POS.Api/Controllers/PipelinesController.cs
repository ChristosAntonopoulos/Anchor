using Microsoft.AspNetCore.Mvc;
using POS.Application.Services.Pipelines;

namespace POS.Api.Controllers;

/// <summary>
/// Org-wide Azure DevOps pipeline status for the home launcher widget.
/// </summary>
[ApiController]
[Route("api/pipelines")]
[Tags("Pipelines")]
public class PipelinesController : BaseController
{
    private readonly AzureDevOpsLatestPipelineService _pipelines;

    public PipelinesController(AzureDevOpsLatestPipelineService pipelines)
    {
        _pipelines = pipelines;
    }

    /// <summary>
    /// Latest pipeline run across the entire Azure DevOps organization.
    /// </summary>
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest(CancellationToken cancellationToken)
    {
        var latest = await _pipelines.GetLatestAsync(cancellationToken);
        return Success(latest);
    }
}
