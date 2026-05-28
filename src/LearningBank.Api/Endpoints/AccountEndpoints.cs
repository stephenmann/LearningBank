using System.Security.Claims;
using LearningBank.Api.Auth;
using LearningBank.Api.Dtos;
using LearningBank.Api.Services;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using Microsoft.AspNetCore.Http.HttpResults;

namespace LearningBank.Api.Endpoints;

public static class AccountEndpoints
{
    public static RouteGroupBuilder MapAccountEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/children/{childId}/accounts/checking", GetCheckingAccount)
            .RequireAuthorization()
            .WithName("GetCheckingAccount");

        group.MapGet("/children/{childId}/accounts/savings", GetSavingsAccount)
            .RequireAuthorization()
            .WithName("GetSavingsAccount");

        return group;
    }

    private static async Task<Results<Ok<AccountSummaryDto>, ForbidHttpResult, NotFound>> GetCheckingAccount(
        Guid childId,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransactionRepository txRepo,
        CancellationToken ct)
        => await GetAccountSummary(childId, AccountType.Checking, user, userRepo, txRepo, ct);

    private static async Task<Results<Ok<AccountSummaryDto>, ForbidHttpResult, NotFound>> GetSavingsAccount(
        Guid childId,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransactionRepository txRepo,
        CancellationToken ct)
        => await GetAccountSummary(childId, AccountType.Savings, user, userRepo, txRepo, ct);

    private static async Task<Results<Ok<AccountSummaryDto>, ForbidHttpResult, NotFound>> GetAccountSummary(
        Guid childId,
        AccountType account,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransactionRepository txRepo,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var role = user.GetRole();

        // A child can only see their own accounts
        if (role == nameof(UserRole.Child) && actorId != childId)
            return TypedResults.Forbid();

        // A parent must be linked to the child
        if (role == nameof(UserRole.Parent) && !await userRepo.IsLinkedToChildAsync(actorId, childId, ct))
            return TypedResults.Forbid();

        var transactions = await txRepo.GetForChildAccountAsync(childId, account, ct);
        if (role == nameof(UserRole.Child))
            transactions = TransactionVisibilityService.ForChildView(transactions);

        var balance = transactions.Sum(t => t.Amount);

        var dtos = transactions.Select(t => new TransactionDto(
            t.Id,
            t.Account.ToString(),
            t.Type.ToString(),
            t.Amount.ToString("F2"),
            t.Description,
            t.Category?.Name,
            t.PostedAt)).ToList();

        return TypedResults.Ok(new AccountSummaryDto(balance.ToString("F2"), dtos));
    }
}
