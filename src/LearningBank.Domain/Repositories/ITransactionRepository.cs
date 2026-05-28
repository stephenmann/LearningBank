using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Repositories;

public interface ITransactionRepository
{
    Task<IReadOnlyList<Transaction>> GetForChildAsync(Guid childId, CancellationToken ct = default);
    Task<IReadOnlyList<Transaction>> GetForChildAccountAsync(Guid childId, AccountType account, CancellationToken ct = default);
    Task<Transaction?> FindByIdAsync(Guid transactionId, CancellationToken ct = default);
    Task<bool> ExistsByRelatedTransactionIdAsync(Guid relatedTransactionId, CancellationToken ct = default);
    Task AddAsync(Transaction transaction, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<Transaction> transactions, CancellationToken ct = default);
}
