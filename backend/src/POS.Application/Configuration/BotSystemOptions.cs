namespace POS.Application.Configuration;

public class BotSystemOptions
{
    public const string SectionName = "BotSystem";

    public string BaseUrl { get; set; } = "http://localhost:5201";
    public string IntakeBotKey { get; set; } = "anchor.intake";
    public string DayStartBotKey { get; set; } = "anchor.day-start";
}
