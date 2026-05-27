using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Repositories;

public sealed class TransactionRepository : ITransactionRepository
{
    private readonly LearningBankDbContext _db;
    public TransactionRepository(LearningBankDbContext db) => _db = db;

    public async Task<IReadOnlyList<Transaction>> GetForChildAsync(Guid childId, CancellationToken ct = default)
        => await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.ChildId == childId)
            .OrderByDescending(t => t.PostedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Transaction>> GetForChildAccountAsync(Guid childId, AccountType account, CancellationToken ct = default)
        => await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.ChildId == childId && t.Account == account)
            .OrderByDescending(t => t.PostedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Transaction transaction, CancellationToken ct = default)
        => await _db.Transactions.AddAsync(transaction, ct);

    public async Task AddRangeAsync(IEnumerable<Transaction> transactions, CancellationToken ct = default)
        => await _db.Transactions.AddRangeAsync(transactions, ct);
}
