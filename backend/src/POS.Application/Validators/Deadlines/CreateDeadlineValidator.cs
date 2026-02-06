using FluentValidation;
using POS.Application.DTOs.Deadlines;
using POS.Application.Validators;

namespace POS.Application.Validators.Deadlines;

/// <summary>
/// Validator for CreateDeadlineRequest
/// </summary>
public class CreateDeadlineValidator : BaseValidator<CreateDeadlineRequest>
{
    public CreateDeadlineValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("DueDate is required")
            .Matches(@"^\d{4}-\d{2}-\d{2}$").WithMessage("DueDate must be in YYYY-MM-DD format")
            .Must(BeValidDate).WithMessage("DueDate must be a valid date")
            .Must(BeFutureDate).WithMessage("DueDate must be a future date");

        RuleFor(x => x.Importance)
            .InclusiveBetween(1, 5)
            .WithMessage("Importance must be between 1 and 5");
    }

    private bool BeValidDate(string date)
    {
        return DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out _);
    }

    private bool BeFutureDate(string date)
    {
        if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var parsedDate))
            return false;
        return parsedDate.Date > DateTime.UtcNow.Date;
    }
}
