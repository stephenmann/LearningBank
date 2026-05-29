namespace LearningBank.Domain.Repositories;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);

    /// <summary>
    /// Executes <paramref name="operation"/> inside a serializable transaction with the
    /// provider's execution strategy. Used to enforce read-check-write invariants (e.g. the
    /// overdraft check on transfers) atomically against concurrent writers.
    /// </summary>
    Task<T> ExecuteSerializableAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken ct = default);
}
