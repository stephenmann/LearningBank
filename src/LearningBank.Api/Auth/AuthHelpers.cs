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
        // Fail-safe to the least-privileged role: a missing role claim must NOT grant Parent.
        // Do not change this default to "Parent".
        => principal.FindFirst(ClaimTypes.Role)?.Value ?? "Child";

    /// <summary>
    /// Masks an email for safe logging, e.g. "alice@example.com" -> "a***@example.com".
    /// No PII is currently logged; use this helper before logging any email address.
    /// </summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return string.Empty;

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0)
            return "***";

        var local = email[..atIndex];
        var domain = email[atIndex..];
        var firstChar = local[0];
        return $"{firstChar}***{domain}";
    }

    /// <summary>Ensures the acting user (parent) is linked to the specified child.</summary>
    public static async Task<bool> IsLinkedToChildAsync(
        this IUserRepository repo,
        Guid parentId,
        Guid childId,
        CancellationToken ct = default)
        => await repo.FindChildLinkAsync(parentId, childId, ct) is not null;
}
