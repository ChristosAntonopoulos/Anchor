using FluentValidation;
using POS.Application.DTOs.BetterToday;
using POS.Application.Services.Category;
using POS.Application.Validators;

namespace POS.Application.Validators.BetterToday;

/// <summary>
/// Validator for CreateBetterItemDto
/// </summary>
public class CreateBetterItemValidator : BaseValidator<CreateBetterItemDto>
{
    private readonly CategoryService _categoryService;

    public CreateBetterItemValidator(CategoryService categoryService)
    {
        _categoryService = categoryService;

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .MustAsync(async (category, cancellation) => await _categoryService.ValidateCategoryAsync(category))
            .WithMessage("Category must be a valid active category");
    }
}
