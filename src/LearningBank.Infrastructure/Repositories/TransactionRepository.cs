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
        => (await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.ChildId == childId)
            .ToListAsync(ct))
            .OrderByDescending(t => t.PostedAt)
            .ToList();

    public async Task<IReadOnlyList<Transaction>> GetForChildAccountAsync(Guid childId, AccountType account, CancellationToken ct = default)
        => (await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.ChildId == childId && t.Account == account)
            .ToListAsync(ct))
            .OrderByDescending(t => t.PostedAt)
            .ToList();

    public Task<Transaction?> FindByIdAsync(Guid transactionId, CancellationToken ct = default)
        => _db.Transactions
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == transactionId, ct);

    public Task<bool> ExistsByRelatedTransactionIdAsync(Guid relatedTransactionId, CancellationToken ct = default)
        => _db.Transactions.AnyAsync(t => t.RelatedTransactionId == relatedTransactionId, ct);

    public async Task AddAsync(Transaction transaction, CancellationToken ct = default)
        => await _db.Transactions.AddAsync(transaction, ct);

    public async Task AddRangeAsync(IEnumerable<Transaction> transactions, CancellationToken ct = default)
        => await _db.Transactions.AddRangeAsync(transactions, ct);
}
