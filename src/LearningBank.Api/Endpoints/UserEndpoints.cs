using System.Security.Claims;
using LearningBank.Api.Auth;
using LearningBank.Api.Dtos;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace LearningBank.Api.Endpoints;

public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/me", GetCurrentUser)
            .RequireAuthorization()
            .WithName("GetCurrentUser");

        group.MapGet("/children", GetChildren)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("GetChildren");

        group.MapPost("/children", CreateChild)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("CreateChild");

        return group;
    }

    private static async Task<Results<Ok<UserDto>, NotFound>> GetCurrentUser(
        ClaimsPrincipal user,
        IUserRepository userRepo,
        CancellationToken ct)
    {
        var id = user.GetUserId();
        var dbUser = await userRepo.FindByIdAsync(id, ct);
        if (dbUser is null) return TypedResults.NotFound();
        return TypedResults.Ok(new UserDto(dbUser.Id, dbUser.DisplayName, dbUser.Email, dbUser.Role.ToString(), dbUser.IsActive));
    }

    private static async Task<Ok<IReadOnlyList<ChildDto>>> GetChildren(
        ClaimsPrincipal user,
        IUserRepository userRepo,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();
        var children = await userRepo.GetChildrenForParentAsync(parentId, ct);
        return TypedResults.Ok(children.Select(c => new ChildDto(c.Id, c.DisplayName, c.Email, c.IsActive)).ToList() as IReadOnlyList<ChildDto>);
    }

    private static async Task<Results<Created<ChildDto>, ForbidHttpResult>> CreateChild(
        [FromBody] CreateChildRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();

        // Create child account (no external IdP yet — email used to match on first login)
        var child = User.Create(
            externalId: Guid.NewGuid().ToString(), // placeholder until child logs in
            provider: "Pending",
            email: req.Email,
            displayName: req.DisplayName,
            role: UserRole.Child);

        var link = ChildLink.Create(parentId, child.Id);

        await userRepo.AddAsync(child, ct);
        await userRepo.AddChildLinkAsync(link, ct);
        await auditRepo.AddAsync(AuditLog.Create(parentId, "CreateChild", nameof(User), child.Id, after: req.Email), ct);
        await uow.SaveChangesAsync(ct);

        return TypedResults.Created(
            $"/api/v1/children/{child.Id}",
            new ChildDto(child.Id, child.DisplayName, child.Email, child.IsActive));
    }
}
