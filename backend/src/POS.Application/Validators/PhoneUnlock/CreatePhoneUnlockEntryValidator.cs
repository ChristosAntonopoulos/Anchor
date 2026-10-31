using FluentValidation;
using POS.Application.DTOs.PhoneUnlock;
using POS.Application.Validators;

namespace POS.Application.Validators.PhoneUnlock;

public class CreatePhoneUnlockEntryValidator : BaseValidator<CreatePhoneUnlockEntryRequest>
{
    private static readonly HashSet<string> Statuses =
    [
        "pending", "answered", "skipped", "dismissed", "interrupted"
    ];

    private static readonly HashSet<string> Actions =
    [
        "continue", "put_down", "skip"
    ];

    private static readonly HashSet<string> SubmissionPaths =
    [
        "quick_choice", "context_form", "direct_action"
    ];

    private static readonly HashSet<string> PutDownExecutions =
    [
        "lock_requested", "overlay_dismissed", "failed"
    ];

    public CreatePhoneUnlockEntryValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Reason is required")
            .When(x => x.SchemaVersion < 2);

        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Reason cannot exceed 500 characters");

        RuleFor(x => x.Note)
            .MaximumLength(200)
            .WithMessage("Note cannot exceed 200 characters");

        RuleFor(x => x.UnlockMethod)
            .MaximumLength(50)
            .When(x => x.UnlockMethod != null);

        RuleFor(x => x.Status)
            .Must(value => value == null || Statuses.Contains(value))
            .WithMessage("Status is not a supported value");

        RuleFor(x => x.Action)
            .Must(value => value == null || Actions.Contains(value))
            .WithMessage("Action is not a supported value");

        RuleFor(x => x.SubmissionPath)
            .Must(value => value == null || SubmissionPaths.Contains(value))
            .WithMessage("Submission path is not a supported value");

        RuleFor(x => x.PutDownExecution)
            .Must(value => value == null || PutDownExecutions.Contains(value))
            .WithMessage("Put down execution is not a supported value");
    }
}
