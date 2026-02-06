using FluentValidation;
using POS.Application.DTOs.WeeklyReview;
using POS.Application.Validators;

namespace POS.Application.Validators.WeeklyReview;

/// <summary>
/// Validator for SubmitWeeklyReviewRequest
/// </summary>
public class SubmitWeeklyReviewValidator : BaseValidator<SubmitWeeklyReviewRequest>
{
    public SubmitWeeklyReviewValidator()
    {
        RuleFor(x => x.Shipped)
            .NotEmpty().WithMessage("Shipped is required")
            .MaximumLength(1000).WithMessage("Shipped must not exceed 1000 characters");

        RuleFor(x => x.Improved)
            .NotEmpty().WithMessage("Improved is required")
            .MaximumLength(1000).WithMessage("Improved must not exceed 1000 characters");

        RuleFor(x => x.Avoided)
            .NotEmpty().WithMessage("Avoided is required")
            .MaximumLength(1000).WithMessage("Avoided must not exceed 1000 characters");

        RuleFor(x => x.NextFocus)
            .NotEmpty().WithMessage("NextFocus is required")
            .MaximumLength(1000).WithMessage("NextFocus must not exceed 1000 characters");
    }
}
