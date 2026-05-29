using System.Data;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Repositories;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly LearningBankDbContext _db;
    public UnitOfWork(LearningBankDbContext db) => _db = db;

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);

    public async Task<T> ExecuteSerializableAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken ct = default)
    {
        var strategy = _db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
            var result = await operation(ct);
            await transaction.CommitAsync(ct);
            return result;
        });
    }
}
