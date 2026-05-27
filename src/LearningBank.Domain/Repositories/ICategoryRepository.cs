using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Category>> GetActiveChildAllowedAsync(CancellationToken ct = default);
    Task<Category?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
}
