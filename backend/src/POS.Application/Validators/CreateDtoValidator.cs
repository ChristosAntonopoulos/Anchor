using FluentValidation;
using POS.Application.DTOs;

namespace POS.Application.Validators;

/// <summary>
/// Base validator for create DTOs
/// </summary>
public abstract class CreateDtoValidator<T> : BaseValidator<T> where T : CreateDto
{
    protected CreateDtoValidator()
    {
        // Common create validation rules
        // Id should not be set on create
    }
}
