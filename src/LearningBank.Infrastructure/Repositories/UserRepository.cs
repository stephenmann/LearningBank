using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly LearningBankDbContext _db;
    public UserRepository(LearningBankDbContext db) => _db = db;

    public Task<User?> FindByIdAsync(Guid id, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> FindByExternalIdAsync(string externalId, string provider, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.ExternalId == externalId && u.Provider == provider, ct);

    public async Task<IReadOnlyList<User>> GetChildrenForParentAsync(Guid parentId, CancellationToken ct = default)
    {
        var childIds = await _db.ChildLinks
            .Where(l => l.ParentId == parentId)
            .Select(l => l.ChildId)
            .ToListAsync(ct);

        return await _db.Users
            .Where(u => childIds.Contains(u.Id) && u.IsActive)
            .ToListAsync(ct);
    }

    public async Task AddAsync(User user, CancellationToken ct = default)
        => await _db.Users.AddAsync(user, ct);

    public Task<ChildLink?> FindChildLinkAsync(Guid parentId, Guid childId, CancellationToken ct = default)
        => _db.ChildLinks.FirstOrDefaultAsync(l => l.ParentId == parentId && l.ChildId == childId, ct);

    public async Task AddChildLinkAsync(ChildLink link, CancellationToken ct = default)
        => await _db.ChildLinks.AddAsync(link, ct);
}
