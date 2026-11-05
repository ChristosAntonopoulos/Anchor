namespace POS.Application.Services.Execution;

public interface ILanguageModelClient
{
    bool IsConfigured { get; }
    string ModelName { get; }
    Task<string?> CompleteJsonAsync(string systemPrompt, string capabilityPrompt, string contextJson, CancellationToken ct = default);
}
