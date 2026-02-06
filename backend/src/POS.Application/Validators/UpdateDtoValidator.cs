using FluentValidation;
using POS.Application.DTOs;

namespace POS.Application.Validators;

/// <summary>
/// Base validator for update DTOs
/// </summary>
public abstract class UpdateDtoValidator<T> : BaseValidator<T> where T : UpdateDto
{
    protected UpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id is required for updates.");
    }
}
