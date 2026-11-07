namespace POS.Application.Configuration;

public class OpenAiOptions
{
    public const string SectionName = "OpenAI";

    public string? ApiKey { get; set; }
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public string Model { get; set; } = "gpt-4o";
    public int MaxTokens { get; set; } = 1200;
    public int TimeoutSeconds { get; set; } = 45;
}
