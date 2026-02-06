using FluentValidation;
using POS.Application.DTOs.Money;
using POS.Application.Validators;

namespace POS.Application.Validators.Money;

/// <summary>
/// Validator for CreateIncomeRequest
/// </summary>
public class CreateIncomeValidator : BaseValidator<CreateIncomeRequest>
{
    public CreateIncomeValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Date is required")
            .Matches(@"^\d{4}-\d{2}-\d{2}$").WithMessage("Date must be in YYYY-MM-DD format")
            .Must(BeValidDate).WithMessage("Date must be a valid date");

        RuleFor(x => x.Source)
            .NotEmpty().WithMessage("Source is required")
            .MaximumLength(200).WithMessage("Source must not exceed 200 characters");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required")
            .Length(3).WithMessage("Currency must be a 3-character code (e.g., EUR, USD)");
    }

    private bool BeValidDate(string date)
    {
        return DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out _);
    }
}
