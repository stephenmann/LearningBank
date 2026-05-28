using System.Security.Claims;
using FluentAssertions;
using LearningBank.Api.Auth;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;

namespace LearningBank.Api.Tests;

public sealed class LearningBankClaimsTransformerTests
{
    [Fact]
    public async Task TransformAsync_UsesPendingChildWhenExistingParentHasNoLinks()
    {
        var email = "child@example.com";
        var parent = User.Create("google-sub", "Google", email, "Wrong Parent", UserRole.Parent);
        var pendingChild = User.Create(Guid.NewGuid().ToString(), "Pending", email, "Real Child", UserRole.Child);

        var users = new FakeUserRepository(parent, pendingChild, parentHasChildren: false);
        var sut = new LearningBankClaimsTransformer(users, new FakeUnitOfWork());

        var principal = BuildPrincipal("google-sub", "https://accounts.google.com", email, "Kid Name");

        var transformed = await sut.TransformAsync(principal);

        transformed.FindFirst(AuthHelpers.InternalUserIdClaim)!.Value.Should().Be(pendingChild.Id.ToString());
        transformed.FindFirst(ClaimTypes.Role)!.Value.Should().Be(UserRole.Child.ToString());
    }

    [Fact]
    public async Task TransformAsync_LinksPendingParentByEmail()
    {
        var email = "parent@example.com";
        var pendingParent = User.Create(Guid.NewGuid().ToString(), "Pending", email, "Pending Parent", UserRole.Parent);
        var users = new FakeUserRepository(null, pendingParent, parentHasChildren: false);
        var sut = new LearningBankClaimsTransformer(users, new FakeUnitOfWork());

        var principal = BuildPrincipal("google-parent-sub", "https://accounts.google.com", email, "Parent Name");

        var transformed = await sut.TransformAsync(principal);

        transformed.FindFirst(AuthHelpers.InternalUserIdClaim)!.Value.Should().Be(pendingParent.Id.ToString());
        transformed.FindFirst(ClaimTypes.Role)!.Value.Should().Be(UserRole.Parent.ToString());
        pendingParent.Provider.Should().Be("Google");
        pendingParent.ExternalId.Should().Be("google-parent-sub");
    }

    private static ClaimsPrincipal BuildPrincipal(string sub, string issuer, string email, string name)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim("sub", sub),
            new Claim("iss", issuer),
            new Claim("email", email),
            new Claim("name", name),
        ],
        "test");

        return new ClaimsPrincipal(identity);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(0);
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        private readonly List<User> _users;
        private readonly bool _parentHasChildren;

        public FakeUserRepository(User? matchedParent, User? pendingChild, bool parentHasChildren)
        {
            _users = [];
            if (matchedParent is not null) _users.Add(matchedParent);
            if (pendingChild is not null) _users.Add(pendingChild);
            _parentHasChildren = parentHasChildren;
        }

        public Task<User?> FindByIdAsync(Guid id, CancellationToken ct = default)
            => Task.FromResult(_users.FirstOrDefault(u => u.Id == id));

        public Task<User?> FindByExternalIdAsync(string externalId, string provider, CancellationToken ct = default)
            => Task.FromResult(_users.FirstOrDefault(u => u.ExternalId == externalId && u.Provider == provider));

        public Task<User?> FindByEmailAsync(string email, CancellationToken ct = default)
            => Task.FromResult(_users.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)));

        public Task<User?> FindPendingChildByEmailAsync(string email, CancellationToken ct = default)
            => Task.FromResult(_users.FirstOrDefault(u =>
                string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)
                && u.Role == UserRole.Child
                && u.Provider == "Pending"));

        public Task<bool> ParentHasLinkedChildrenAsync(Guid parentId, CancellationToken ct = default)
            => Task.FromResult(_parentHasChildren);

        public Task<IReadOnlyList<ChildLink>> GetChildLinksForParentAsync(Guid parentId, CancellationToken ct = default)
            => Task.FromResult((IReadOnlyList<ChildLink>)[]);

        public Task<IReadOnlyList<ChildLink>> GetChildLinksForChildAsync(Guid childId, CancellationToken ct = default)
            => Task.FromResult((IReadOnlyList<ChildLink>)[]);

        public Task<IReadOnlyList<User>> GetChildrenForParentAsync(Guid parentId, CancellationToken ct = default)
            => Task.FromResult((IReadOnlyList<User>)[]);

        public Task<IReadOnlyList<User>> GetCoAdminParentsAsync(Guid parentId, CancellationToken ct = default)
            => Task.FromResult((IReadOnlyList<User>)[]);

        public Task<string> GetPreferenceScopeKeyAsync(Guid actorId, UserRole actorRole, CancellationToken ct = default)
            => Task.FromResult($"test:{actorId:N}");

        public Task AddAsync(User user, CancellationToken ct = default)
        {
            _users.Add(user);
            return Task.CompletedTask;
        }

        public Task<ChildLink?> FindChildLinkAsync(Guid parentId, Guid childId, CancellationToken ct = default)
            => Task.FromResult<ChildLink?>(null);

        public Task AddChildLinkAsync(ChildLink link, CancellationToken ct = default)
            => Task.CompletedTask;
    }
}
