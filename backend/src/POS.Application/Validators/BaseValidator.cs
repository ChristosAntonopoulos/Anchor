using FluentValidation;

namespace POS.Application.Validators;

/// <summary>
/// Base validator class with common validation rules
/// </summary>
public abstract class BaseValidator<T> : AbstractValidator<T>
{
    protected BaseValidator()
    {
        // Common validation rules can be added here
    }
}
