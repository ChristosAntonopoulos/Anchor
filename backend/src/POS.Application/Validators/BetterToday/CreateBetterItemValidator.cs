using FluentValidation;
using POS.Application.DTOs.BetterToday;
using POS.Application.Validators;

namespace POS.Application.Validators.BetterToday;

/// <summary>
/// Validator for CreateBetterItemDto
/// </summary>
public class CreateBetterItemValidator : BaseValidator<CreateBetterItemDto>
{
    public CreateBetterItemValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .Must(c => c == "work" || c == "leverage" || c == "health" || c == "stability")
            .WithMessage("Category must be 'work', 'leverage', 'health', or 'stability'");
    }
}
