using FluentValidation;

namespace LearningBank.Api.Validators;

/// <summary>
/// Runs any registered FluentValidation <see cref="IValidator{T}"/> against the bound
/// request arguments before the endpoint handler executes. Without this filter the
/// validators are registered in DI but never invoked for minimal-API endpoints.
/// </summary>
public sealed class ValidationEndpointFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        foreach (var argument in context.Arguments)
        {
            if (argument is null)
                continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (context.HttpContext.RequestServices.GetService(validatorType) is not IValidator validator)
                continue;

            var validationContext = new ValidationContext<object>(argument);
            var result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);

            if (!result.IsValid)
            {
                var errors = result.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

                return TypedResults.ValidationProblem(errors);
            }
        }

        return await next(context);
    }
}
