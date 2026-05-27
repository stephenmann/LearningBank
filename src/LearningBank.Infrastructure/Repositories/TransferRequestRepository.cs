using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Repositories;

public sealed class TransferRequestRepository : ITransferRequestRepository
{
    private readonly LearningBankDbContext _db;
    public TransferRequestRepository(LearningBankDbContext db) => _db = db;

    public async Task<IReadOnlyList<TransferRequest>> GetForChildAsync(Guid childId, CancellationToken ct = default)
        => (await _db.TransferRequests
            .Where(r => r.ChildId == childId)
            .ToListAsync(ct))
            .OrderByDescending(r => r.RequestedAt)
            .ToList();

    public async Task<IReadOnlyList<TransferRequest>> GetPendingForParentAsync(Guid parentId, CancellationToken ct = default)
    {
        var childIds = await _db.ChildLinks
            .Where(l => l.ParentId == parentId)
            .Select(l => l.ChildId)
            .ToListAsync(ct);

        return (await _db.TransferRequests
            .Include(r => r.Child)
            .Where(r => childIds.Contains(r.ChildId) && r.Status == TransferRequestStatus.Pending)
            .ToListAsync(ct))
            .OrderBy(r => r.RequestedAt)
            .ToList();
    }

    public Task<TransferRequest?> FindByIdAsync(Guid id, CancellationToken ct = default)
        => _db.TransferRequests.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task AddAsync(TransferRequest request, CancellationToken ct = default)
        => await _db.TransferRequests.AddAsync(request, ct);
}
