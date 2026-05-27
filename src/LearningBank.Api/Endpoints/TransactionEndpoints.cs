using System.Security.Claims;
using LearningBank.Api.Auth;
using LearningBank.Api.Dtos;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Exceptions;
using LearningBank.Domain.Repositories;
using LearningBank.Domain.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace LearningBank.Api.Endpoints;

public static class TransactionEndpoints
{
    public static RouteGroupBuilder MapTransactionEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/deposits", CreateDeposit)
            .RequireAuthorization()
            .WithName("CreateDeposit");

        group.MapPost("/withdrawals", CreateWithdrawal)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("CreateWithdrawal");

        group.MapPost("/transfers/checking-to-savings", CheckingToSavings)
            .RequireAuthorization()
            .WithName("CheckingToSavings");

        group.MapPost("/transfers/savings-to-checking", RequestSavingsToChecking)
            .RequireAuthorization()
            .WithName("RequestSavingsToChecking");

        group.MapGet("/transfers/requests/pending", GetPendingRequests)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("GetPendingRequests");

        group.MapGet("/children/{childId}/transfers/requests", GetChildTransferRequests)
            .RequireAuthorization()
            .WithName("GetChildTransferRequests");

        group.MapPost("/transfers/requests/{requestId}/review", ReviewTransferRequest)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("ReviewTransferRequest");

        group.MapDelete("/transfers/requests/{requestId}", CancelTransferRequest)
            .RequireAuthorization()
            .WithName("CancelTransferRequest");

        return group;
    }

    private static async Task<Results<Created, ValidationProblem, ForbidHttpResult, ProblemHttpResult>> CreateDeposit(
        [FromBody] CreateDepositRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransactionRepository txRepo,
        ICategoryRepository catRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var role = user.GetRole();

        // A child can only deposit to themselves
        if (role == nameof(UserRole.Child) && actorId != req.ChildId)
            return TypedResults.Forbid();

        // Parent must be linked
        if (role == nameof(UserRole.Parent) && !await userRepo.IsLinkedToChildAsync(actorId, req.ChildId, ct))
            return TypedResults.Forbid();

        // Validate category at submission time (Domain Rule 3)
        var category = await catRepo.FindByIdAsync(req.CategoryId, ct);
        if (category is null || category.IsArchived || (role == nameof(UserRole.Child) && !category.IsChildAllowed))
            return TypedResults.Problem("Category is not available.", statusCode: 422);

        var tx = Transaction.CreateDeposit(
            req.ChildId,
            req.Amount,
            req.Description,
            req.CategoryId,
            role == nameof(UserRole.Parent) ? actorId : null);

        await txRepo.AddAsync(tx, ct);
        await uow.SaveChangesAsync(ct);

        return TypedResults.Created($"/api/v1/transactions/{tx.Id}");
    }

    private static async Task<Results<Created, ForbidHttpResult>> CreateWithdrawal(
        [FromBody] CreateWithdrawalRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransactionRepository txRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();

        if (!await userRepo.IsLinkedToChildAsync(actorId, req.ChildId, ct))
            return TypedResults.Forbid();

        var tx = Transaction.CreateWithdrawal(req.ChildId, req.Amount, req.Description, actorId);

        await txRepo.AddAsync(tx, ct);
        await auditRepo.AddAsync(AuditLog.Create(actorId, "Withdrawal", nameof(Transaction), tx.Id, after: req.Description), ct);
        await uow.SaveChangesAsync(ct);

        return TypedResults.Created($"/api/v1/transactions/{tx.Id}");
    }

    private static async Task<Results<Created, ForbidHttpResult, ProblemHttpResult>> CheckingToSavings(
        [FromBody] CreateTransferToSavingsRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransactionRepository txRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var role = user.GetRole();

        if (role == nameof(UserRole.Child) && actorId != req.ChildId)
            return TypedResults.Forbid();
        if (role == nameof(UserRole.Parent) && !await userRepo.IsLinkedToChildAsync(actorId, req.ChildId, ct))
            return TypedResults.Forbid();

        var existing = await txRepo.GetForChildAsync(req.ChildId, ct);

        try
        {
            var (debit, credit) = AccountService.CheckingToSavings(existing, req.ChildId, req.Amount, req.Description);
            await txRepo.AddRangeAsync([debit, credit], ct);
            await uow.SaveChangesAsync(ct);
            return TypedResults.Created($"/api/v1/transactions/{debit.Id}");
        }
        catch (InsufficientFundsException ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: 422);
        }
    }

    private static async Task<Results<Created, ForbidHttpResult>> RequestSavingsToChecking(
        [FromBody] CreateSavingsWithdrawalRequestDto req,
        ClaimsPrincipal user,
        ITransferRequestRepository requestRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var transferReq = TransferRequest.Create(actorId, req.Amount, req.Note);

        await requestRepo.AddAsync(transferReq, ct);
        await uow.SaveChangesAsync(ct);

        return TypedResults.Created($"/api/v1/transfers/requests/{transferReq.Id}");
    }

    private static async Task<Ok<IReadOnlyList<TransferRequestDto>>> GetPendingRequests(
        ClaimsPrincipal user,
        ITransferRequestRepository requestRepo,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();
        var requests = await requestRepo.GetPendingForParentAsync(parentId, ct);
        return TypedResults.Ok(MapRequests(requests));
    }

    private static async Task<Results<Ok<IReadOnlyList<TransferRequestDto>>, ForbidHttpResult>> GetChildTransferRequests(
        Guid childId,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransferRequestRepository requestRepo,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var role = user.GetRole();

        if (role == nameof(UserRole.Child) && actorId != childId)
            return TypedResults.Forbid();
        if (role == nameof(UserRole.Parent) && !await userRepo.IsLinkedToChildAsync(actorId, childId, ct))
            return TypedResults.Forbid();

        var requests = await requestRepo.GetForChildAsync(childId, ct);
        return TypedResults.Ok(MapRequests(requests));
    }

    private static async Task<Results<NoContent, ForbidHttpResult, NotFound, ProblemHttpResult>> ReviewTransferRequest(
        Guid requestId,
        [FromBody] ReviewTransferRequestDto req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ITransferRequestRepository requestRepo,
        ITransactionRepository txRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();
        var transferReq = await requestRepo.FindByIdAsync(requestId, ct);
        if (transferReq is null) return TypedResults.NotFound();

        if (!await userRepo.IsLinkedToChildAsync(parentId, transferReq.ChildId, ct))
            return TypedResults.Forbid();

        if (req.Approve)
        {
            var existing = await txRepo.GetForChildAsync(transferReq.ChildId, ct);
            try
            {
                var (debit, credit) = AccountService.SavingsToChecking(
                    existing, transferReq.ChildId, transferReq.Amount, "Savings withdrawal approved");
                transferReq.Approve(parentId, req.ReviewNote);
                await txRepo.AddRangeAsync([debit, credit], ct);
            }
            catch (InsufficientFundsException ex)
            {
                return TypedResults.Problem(ex.Message, statusCode: 422);
            }
        }
        else
        {
            transferReq.Reject(parentId, req.ReviewNote);
        }

        await auditRepo.AddAsync(AuditLog.Create(
            parentId,
            req.Approve ? "ApproveTransfer" : "RejectTransfer",
            nameof(TransferRequest),
            transferReq.Id), ct);

        await uow.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, ForbidHttpResult, NotFound, ProblemHttpResult>> CancelTransferRequest(
        Guid requestId,
        ClaimsPrincipal user,
        ITransferRequestRepository requestRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var transferReq = await requestRepo.FindByIdAsync(requestId, ct);
        if (transferReq is null) return TypedResults.NotFound();
        if (transferReq.ChildId != actorId) return TypedResults.Forbid();

        try
        {
            transferReq.Cancel();
        }
        catch (DomainException ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: 422);
        }

        await uow.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static IReadOnlyList<TransferRequestDto> MapRequests(IReadOnlyList<Domain.Entities.TransferRequest> requests)
        => requests.Select(r => new TransferRequestDto(
            r.Id,
            r.ChildId,
            r.Child?.DisplayName,
            r.Amount.ToString("F2"),
            r.Note,
            r.Status.ToString(),
            r.RequestedAt,
            r.ReviewedAt,
            r.ReviewNote)).ToList();
}
