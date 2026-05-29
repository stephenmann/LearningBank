using FluentValidation;
using LearningBank.Api.Dtos;

namespace LearningBank.Api.Validators;

public sealed class CreateDepositValidator : AbstractValidator<CreateDepositRequest>
{
    public CreateDepositValidator()
    {
        RuleFor(x => x.ChildId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive.");
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}

public sealed class CreateWithdrawalValidator : AbstractValidator<CreateWithdrawalRequest>
{
    public CreateWithdrawalValidator()
    {
        RuleFor(x => x.ChildId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive.");
        RuleFor(x => x.Description).NotEmpty().MaximumLength(500);
    }
}

public sealed class DeleteTransactionValidator : AbstractValidator<DeleteTransactionRequest>
{
    public DeleteTransactionValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
    }
}

public sealed class CreateTransferToSavingsValidator : AbstractValidator<CreateTransferToSavingsRequest>
{
    public CreateTransferToSavingsValidator()
    {
        RuleFor(x => x.ChildId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive.");
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public sealed class CreateSavingsWithdrawalRequestValidator : AbstractValidator<CreateSavingsWithdrawalRequestDto>
{
    public CreateSavingsWithdrawalRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be positive.");
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public sealed class CreateCategoryValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public sealed class UpdateCategoryValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateChildValidator : AbstractValidator<CreateChildRequest>
{
    public CreateChildValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}

public sealed class CreateParentAdminValidator : AbstractValidator<CreateParentAdminRequest>
{
    public CreateParentAdminValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}

public sealed class CreateLearningTaskValidator : AbstractValidator<CreateLearningTaskRequest>
{
    public CreateLearningTaskValidator()
    {
        RuleFor(x => x.ChildId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.MonetaryValue).GreaterThan(0).WithMessage("Monetary value must be positive.");
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.TargetAccount).NotEmpty();
        RuleFor(x => x.RecurrenceType).NotEmpty();
        RuleFor(x => x.Frequency).MaximumLength(40);
        RuleFor(x => x.MaxOccurrences)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage("Maximum occurrences must be positive.");
        RuleFor(x => x.DaysOfWeek)
            .Must(days => days is null || days.All(d => d is >= 0 and <= 6))
            .WithMessage("Days of week must be between 0 and 6.");
    }
}

public sealed class TaskCompletionReviewValidator : AbstractValidator<TaskCompletionReviewRequest>
{
    public TaskCompletionReviewValidator()
    {
        RuleFor(x => x.ReviewNote).MaximumLength(500);
    }
}

public sealed class UpdateLearningTaskValidator : AbstractValidator<UpdateLearningTaskRequest>
{
    public UpdateLearningTaskValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.MonetaryValue).GreaterThan(0).WithMessage("Monetary value must be positive.");
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.TargetAccount).NotEmpty();
        RuleFor(x => x.RecurrenceType).NotEmpty();
        RuleFor(x => x.Frequency).MaximumLength(40);
        RuleFor(x => x.MaxOccurrences)
            .Must(v => !v.HasValue || v.Value > 0)
            .WithMessage("Maximum occurrences must be positive.");
        RuleFor(x => x.DaysOfWeek)
            .Must(days => days is null || days.All(d => d is >= 0 and <= 6))
            .WithMessage("Days of week must be between 0 and 6.");
    }
}
