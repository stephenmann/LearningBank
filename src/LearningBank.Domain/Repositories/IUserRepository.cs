using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Repositories;

public interface IUserRepository
{
    Task<User?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task<User?> FindByExternalIdAsync(string externalId, string provider, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetChildrenForParentAsync(Guid parentId, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    Task<ChildLink?> FindChildLinkAsync(Guid parentId, Guid childId, CancellationToken ct = default);
    Task AddChildLinkAsync(ChildLink link, CancellationToken ct = default);
}
