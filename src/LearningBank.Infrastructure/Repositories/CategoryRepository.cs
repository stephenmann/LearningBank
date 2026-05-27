using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Repositories;

public sealed class CategoryRepository : ICategoryRepository
{
    private readonly LearningBankDbContext _db;
    public CategoryRepository(LearningBankDbContext db) => _db = db;

    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken ct = default)
        => await _db.Categories.OrderBy(c => c.Name).ToListAsync(ct);

    public async Task<IReadOnlyList<Category>> GetActiveChildAllowedAsync(CancellationToken ct = default)
        => await _db.Categories
            .Where(c => !c.IsArchived && c.IsChildAllowed)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

    public Task<Category?> FindByIdAsync(Guid id, CancellationToken ct = default)
        => _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Category category, CancellationToken ct = default)
        => await _db.Categories.AddAsync(category, ct);
}
