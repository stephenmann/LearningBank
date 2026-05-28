using System.Security.Claims;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Api.Auth;

/// <summary>
/// On every authenticated request, look up the user in our database and inject
/// the LearningBank role (Parent/Child) as a claim. Creates the user record on
/// first login.
/// </summary>
public sealed class LearningBankClaimsTransformer : IClaimsTransformation
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;

    public LearningBankClaimsTransformer(IUserRepository users, IUnitOfWork uow)
    {
        _users = users;
        _uow = uow;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (!principal.Identity?.IsAuthenticated ?? true) return principal;

         var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
             ?? principal.FindFirst("sub")?.Value
             ?? principal.FindFirst("oid")?.Value;
        var provider = principal.FindFirst("provider")?.Value
                    ?? principal.FindFirst("iss")?.Value
                    ?? "Unknown";

        if (string.IsNullOrEmpty(sub)) return principal;

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
             ?? principal.FindFirst("email")?.Value
             ?? principal.FindFirst("preferred_username")?.Value
             ?? principal.FindFirst(ClaimTypes.Upn)?.Value
             ?? principal.FindFirst("upn")?.Value
             ?? $"{sub}@placeholder.local";

        var name = principal.FindFirst(ClaimTypes.Name)?.Value
            ?? principal.FindFirst("name")?.Value
            ?? principal.FindFirst("preferred_username")?.Value
            ?? email;

        // Normalize provider name
        provider = provider.Contains("google") ? "Google" : "Microsoft";

        var user = await _users.FindByExternalIdAsync(sub, provider);
        var pendingChildByEmail = await _users.FindPendingChildByEmailAsync(email);

        if (user is not null && pendingChildByEmail is not null && user.Role == UserRole.Parent)
        {
            var hasLinkedChildren = await _users.ParentHasLinkedChildrenAsync(user.Id);
            if (!hasLinkedChildren)
            {
                // Compatibility path for accounts auto-created as parent before pending-child linking existed.
                // We intentionally choose the pending child profile for authorization on this request.
                user = pendingChildByEmail;
            }
        }

        if (user is null)
        {
            if (pendingChildByEmail is not null)
            {
                pendingChildByEmail.LinkExternalIdentity(sub, provider);
                user = pendingChildByEmail;
                await _uow.SaveChangesAsync();
            }
        }

        if (user is null)
        {
            var pendingParentByEmail = await _users.FindByEmailAsync(email);
            if (pendingParentByEmail is not null
                && pendingParentByEmail.Role == UserRole.Parent
                && pendingParentByEmail.Provider.Equals("Pending", StringComparison.OrdinalIgnoreCase))
            {
                pendingParentByEmail.LinkExternalIdentity(sub, provider);
                user = pendingParentByEmail;
                await _uow.SaveChangesAsync();
            }
        }

        if (user is null)
        {
            try
            {
                user = User.Create(sub, provider, email, name, UserRole.Parent);
                await _users.AddAsync(user);
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                user = await _users.FindByExternalIdAsync(sub, provider);
                if (user is null)
                {
                    throw;
                }
            }
        }

        var identity = new ClaimsIdentity();
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
        identity.AddClaim(new Claim(AuthHelpers.InternalUserIdClaim, user.Id.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Email, user.Email));
        identity.AddClaim(new Claim(ClaimTypes.Name, user.DisplayName));

        var clone = principal.Clone();
        clone.AddIdentity(identity);
        return clone;
    }
}
