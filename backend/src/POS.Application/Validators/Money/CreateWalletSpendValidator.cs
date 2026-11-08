using FluentValidation;
using POS.Application.DTOs.Money;

namespace POS.Application.Validators.Money;

public class CreateWalletSpendValidator : BaseValidator<CreateWalletSpendRequest>
{
    public CreateWalletSpendValidator()
    {
        RuleFor(x => x.Date)
            .NotEmpty()
            .Matches(@"^\d{4}-\d{2}-\d{2}$")
            .Must(BeValidDate).WithMessage("Date must be a valid date");

        RuleFor(x => x.Merchant)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Amount)
            .GreaterThan(0);

        RuleFor(x => x.Currency)
            .NotEmpty()
            .Length(3);

        RuleFor(x => x.SourceNotificationId)
            .NotEmpty()
            .MaximumLength(300);
    }

    private static bool BeValidDate(string date) =>
        DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out _);
}
