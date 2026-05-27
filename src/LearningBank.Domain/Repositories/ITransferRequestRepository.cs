using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Repositories;

public interface ITransferRequestRepository
{
    Task<IReadOnlyList<TransferRequest>> GetForChildAsync(Guid childId, CancellationToken ct = default);
    Task<IReadOnlyList<TransferRequest>> GetPendingForParentAsync(Guid parentId, CancellationToken ct = default);
    Task<TransferRequest?> FindByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(TransferRequest request, CancellationToken ct = default);
}
