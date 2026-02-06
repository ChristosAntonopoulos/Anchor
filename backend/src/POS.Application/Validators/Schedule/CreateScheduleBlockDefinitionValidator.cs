using FluentValidation;
using POS.Application.DTOs.Schedule;
using POS.Application.Validators;

namespace POS.Application.Validators.Schedule;

/// <summary>
/// Validator for CreateScheduleBlockDefinitionDto
/// </summary>
public class CreateScheduleBlockDefinitionValidator : BaseValidator<CreateScheduleBlockDefinitionDto>
{
    public CreateScheduleBlockDefinitionValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Kind)
            .NotEmpty().WithMessage("Kind is required")
            .Must(k => k == "fixed" || k == "flexible" || k == "recurring")
            .WithMessage("Kind must be 'fixed', 'flexible', or 'recurring'");

        RuleFor(x => x.Recurrence)
            .NotEmpty().WithMessage("Recurrence is required")
            .Must(r => r == "none" || r == "daily" || r == "weekly")
            .WithMessage("Recurrence must be 'none', 'daily', or 'weekly'");

        RuleFor(x => x.DaysOfWeek)
            .Must((dto, days) => 
                dto.Recurrence != "weekly" || (days != null && days.Length > 0))
            .WithMessage("DaysOfWeek is required when Recurrence is 'weekly'")
            .Must((dto, days) => 
                dto.Recurrence != "weekly" || days == null || days.All(d => d >= 0 && d <= 6))
            .WithMessage("DaysOfWeek must contain values between 0 (Sunday) and 6 (Saturday)");

        RuleFor(x => x.MinPerWeek)
            .Must((dto, min) => 
                dto.Kind != "flexible" || min.HasValue)
            .WithMessage("MinPerWeek is required when Kind is 'flexible'")
            .GreaterThanOrEqualTo(0).When(x => x.MinPerWeek.HasValue)
            .WithMessage("MinPerWeek must be 0 or greater");

        RuleFor(x => x.MaxPerWeek)
            .Must((dto, max) => 
                dto.Kind != "flexible" || max.HasValue)
            .WithMessage("MaxPerWeek is required when Kind is 'flexible'")
            .GreaterThan(0).When(x => x.MaxPerWeek.HasValue)
            .WithMessage("MaxPerWeek must be greater than 0")
            .GreaterThanOrEqualTo(x => x.MinPerWeek ?? 0).When(x => x.MaxPerWeek.HasValue && x.MinPerWeek.HasValue)
            .WithMessage("MaxPerWeek must be greater than or equal to MinPerWeek");

        RuleFor(x => x.FixedStartTime)
            .NotEmpty().When(x => x.Kind == "fixed")
            .WithMessage("FixedStartTime is required when Kind is 'fixed'")
            .Matches(@"^([0-1][0-9]|2[0-3]):[0-5][0-9]$").When(x => !string.IsNullOrEmpty(x.FixedStartTime))
            .WithMessage("FixedStartTime must be in HH:mm format");

        RuleFor(x => x.FixedEndTime)
            .NotEmpty().When(x => x.Kind == "fixed")
            .WithMessage("FixedEndTime is required when Kind is 'fixed'")
            .Matches(@"^([0-1][0-9]|2[0-3]):[0-5][0-9]$").When(x => !string.IsNullOrEmpty(x.FixedEndTime))
            .WithMessage("FixedEndTime must be in HH:mm format");

        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0).When(x => x.DurationMinutes.HasValue)
            .WithMessage("DurationMinutes must be greater than 0");

        RuleFor(x => x.Energy)
            .NotEmpty().WithMessage("Energy is required")
            .Must(e => e == "low" || e == "medium" || e == "high")
            .WithMessage("Energy must be 'low', 'medium', or 'high'");

        RuleFor(x => x.Priority)
            .InclusiveBetween(1, 5)
            .WithMessage("Priority must be between 1 and 5");
    }
}
