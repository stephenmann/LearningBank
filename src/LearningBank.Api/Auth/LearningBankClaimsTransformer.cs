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
               ?? principal.FindFirst("sub")?.Value;
        var provider = principal.FindFirst("provider")?.Value
                    ?? principal.FindFirst("iss")?.Value
                    ?? "Unknown";

        if (string.IsNullOrEmpty(sub)) return principal;

        // Normalize provider name
        provider = provider.Contains("google") ? "Google" : "Microsoft";

        var user = await _users.FindByExternalIdAsync(sub, provider);
        if (user is null)
        {
            var email = principal.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var name = principal.FindFirst(ClaimTypes.Name)?.Value
                    ?? principal.FindFirst("name")?.Value
                    ?? email;

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
