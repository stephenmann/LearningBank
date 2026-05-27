using System.Security.Claims;
using LearningBank.Api.Auth;
using LearningBank.Api.Dtos;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace LearningBank.Api.Endpoints;

public static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/categories", GetCategories)
            .RequireAuthorization()
            .WithName("GetCategories");

        group.MapPost("/categories", CreateCategory)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("CreateCategory");

        group.MapPut("/categories/{id}", UpdateCategory)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("UpdateCategory");

        group.MapPost("/categories/{id}/archive", ArchiveCategory)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("ArchiveCategory");

        group.MapPost("/categories/{id}/unarchive", UnarchiveCategory)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("UnarchiveCategory");

        return group;
    }

    private static async Task<Ok<IReadOnlyList<CategoryDto>>> GetCategories(
        ClaimsPrincipal user,
        ICategoryRepository catRepo,
        CancellationToken ct)
    {
        var role = user.GetRole();
        IReadOnlyList<Category> cats = role == nameof(UserRole.Parent)
            ? await catRepo.GetAllAsync(ct)
            : await catRepo.GetActiveChildAllowedAsync(ct);

        return TypedResults.Ok(cats.Select(c => new CategoryDto(c.Id, c.Name, c.IsChildAllowed, c.IsArchived)).ToList() as IReadOnlyList<CategoryDto>);
    }

    private static async Task<Created<CategoryDto>> CreateCategory(
        [FromBody] CreateCategoryRequest req,
        ClaimsPrincipal user,
        ICategoryRepository catRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var cat = Category.Create(req.Name, req.IsChildAllowed);
        await catRepo.AddAsync(cat, ct);
        await auditRepo.AddAsync(AuditLog.Create(user.GetUserId(), "CreateCategory", nameof(Category), cat.Id, after: cat.Name), ct);
        await uow.SaveChangesAsync(ct);
        return TypedResults.Created($"/api/v1/categories/{cat.Id}", new CategoryDto(cat.Id, cat.Name, cat.IsChildAllowed, cat.IsArchived));
    }

    private static async Task<Results<Ok<CategoryDto>, NotFound>> UpdateCategory(
        Guid id,
        [FromBody] UpdateCategoryRequest req,
        ClaimsPrincipal user,
        ICategoryRepository catRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var cat = await catRepo.FindByIdAsync(id, ct);
        if (cat is null) return TypedResults.NotFound();

        var before = cat.Name;
        cat.Update(req.Name, req.IsChildAllowed);
        await auditRepo.AddAsync(AuditLog.Create(user.GetUserId(), "UpdateCategory", nameof(Category), cat.Id, before, cat.Name), ct);
        await uow.SaveChangesAsync(ct);
        return TypedResults.Ok(new CategoryDto(cat.Id, cat.Name, cat.IsChildAllowed, cat.IsArchived));
    }

    private static async Task<Results<NoContent, NotFound>> ArchiveCategory(
        Guid id,
        ClaimsPrincipal user,
        ICategoryRepository catRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var cat = await catRepo.FindByIdAsync(id, ct);
        if (cat is null) return TypedResults.NotFound();
        cat.Archive();
        await auditRepo.AddAsync(AuditLog.Create(user.GetUserId(), "ArchiveCategory", nameof(Category), cat.Id), ct);
        await uow.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, NotFound>> UnarchiveCategory(
        Guid id,
        ClaimsPrincipal user,
        ICategoryRepository catRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var cat = await catRepo.FindByIdAsync(id, ct);
        if (cat is null) return TypedResults.NotFound();
        cat.Unarchive();
        await auditRepo.AddAsync(AuditLog.Create(user.GetUserId(), "UnarchiveCategory", nameof(Category), cat.Id), ct);
        await uow.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }
}
