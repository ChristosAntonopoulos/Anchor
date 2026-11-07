using FluentValidation;
using POS.Application.DTOs.BetterToday;
using POS.Application.Validators;

namespace POS.Application.Validators.BetterToday;

/// <summary>
/// Validator for CreateBetterItemDto.
/// Category checks stay synchronous — FluentValidation auto-validation cannot run MustAsync.
/// </summary>
public class CreateBetterItemValidator : BaseValidator<CreateBetterItemDto>
{
    private static readonly HashSet<string> AllowedCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "work", "leverage", "health", "stability"
    };

    public CreateBetterItemValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .Must(category => AllowedCategories.Contains(category))
            .WithMessage("Category must be one of: work, leverage, health, stability");
    }
}
