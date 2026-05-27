using System.Security.Claims;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;

namespace LearningBank.Api.Auth;

public static class AuthHelpers
{
    public const string ParentPolicy = "ParentOnly";
    public const string ChildPolicy = "ChildOnly";
    public const string InternalUserIdClaim = "lb_user_id";

    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var internalClaim = principal.FindFirst(InternalUserIdClaim)?.Value;
        if (Guid.TryParse(internalClaim, out var internalUserId))
        {
            return internalUserId;
        }

        foreach (var claim in new[]
                 {
                     principal.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                     principal.FindFirst("sub")?.Value,
                 })
        {
            if (Guid.TryParse(claim, out var userId))
            {
                return userId;
            }
        }

        throw new UnauthorizedAccessException("User ID claim not found.");
    }

    public static string GetRole(this ClaimsPrincipal principal)
        => principal.FindFirst(ClaimTypes.Role)?.Value ?? "Child";

    /// <summary>Ensures the acting user (parent) is linked to the specified child.</summary>
    public static async Task<bool> IsLinkedToChildAsync(
        this IUserRepository repo,
        Guid parentId,
        Guid childId,
        CancellationToken ct = default)
        => await repo.FindChildLinkAsync(parentId, childId, ct) is not null;
}
