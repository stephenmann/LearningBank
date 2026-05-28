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

        group.MapPost("/parents/admins", AddParentAdmin)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("AddParentAdmin");

        group.MapGet("/parents/admins", GetCoAdminParents)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("GetCoAdminParents");

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
        var preferenceScopeId = await userRepo.GetPreferenceScopeKeyAsync(dbUser.Id, dbUser.Role, ct);
        return TypedResults.Ok(new UserDto(
            dbUser.Id,
            dbUser.DisplayName,
            dbUser.Email,
            dbUser.Role.ToString(),
            dbUser.IsActive,
            preferenceScopeId));
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

    private static async Task<Results<Created<ParentAdminDto>, ProblemHttpResult>> AddParentAdmin(
        [FromBody] CreateParentAdminRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var actingParentId = user.GetUserId();
        var normalizedEmail = req.Email.Trim().ToLowerInvariant();
        var parentLinks = await userRepo.GetChildLinksForParentAsync(actingParentId, ct);

        if (parentLinks.Count == 0)
            return TypedResults.Problem("You need at least one linked child account before adding another parent admin.", statusCode: 422);

        var existingUser = await userRepo.FindByEmailAsync(normalizedEmail, ct);
        User targetParent;
        var isNewAccount = false;

        if (existingUser is not null)
        {
            if (existingUser.Role != UserRole.Parent)
                return TypedResults.Problem("This email belongs to a child account and cannot be added as a parent admin.", statusCode: 422);

            if (existingUser.Id == actingParentId)
                return TypedResults.Problem("You are already an admin.", statusCode: 422);

            targetParent = existingUser;
        }
        else
        {
            targetParent = User.Create(
                externalId: Guid.NewGuid().ToString(),
                provider: "Pending",
                email: normalizedEmail,
                displayName: req.DisplayName,
                role: UserRole.Parent);

            await userRepo.AddAsync(targetParent, ct);
            isNewAccount = true;
        }

        var linkedCount = 0;
        foreach (var link in parentLinks)
        {
            var exists = await userRepo.FindChildLinkAsync(targetParent.Id, link.ChildId, ct);
            if (exists is not null) continue;

            await userRepo.AddChildLinkAsync(ChildLink.Create(targetParent.Id, link.ChildId), ct);
            linkedCount++;
        }

        await auditRepo.AddAsync(AuditLog.Create(
            actingParentId,
            "AddParentAdmin",
            nameof(User),
            targetParent.Id,
            after: $"{normalizedEmail};linkedChildren={linkedCount}"), ct);

        await uow.SaveChangesAsync(ct);

        return TypedResults.Created(
            $"/api/v1/parents/admins/{targetParent.Id}",
            new ParentAdminDto(
                targetParent.Id,
                targetParent.DisplayName,
                targetParent.Email,
                targetParent.IsActive,
                linkedCount,
                isNewAccount));
    }

    private static async Task<Ok<IReadOnlyList<ParentAdminDto>>> GetCoAdminParents(
        ClaimsPrincipal user,
        IUserRepository userRepo,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();
        var coAdmins = await userRepo.GetCoAdminParentsAsync(parentId, ct);
        var childLinks = await userRepo.GetChildLinksForParentAsync(parentId, ct);

        var dtos = coAdmins.Select(admin =>
        {
            var adminChildCount = childLinks.Count;
            return new ParentAdminDto(admin.Id, admin.DisplayName, admin.Email, admin.IsActive, adminChildCount, false);
        }).ToList();

        return TypedResults.Ok((IReadOnlyList<ParentAdminDto>)dtos);
    }
}
