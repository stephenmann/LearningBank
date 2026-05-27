using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;

namespace LearningBank.Infrastructure.Repositories;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly LearningBankDbContext _db;
    public UnitOfWork(LearningBankDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
