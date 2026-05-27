using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;

namespace LearningBank.Infrastructure.Repositories;

public sealed class AuditLogRepository : IAuditLogRepository
{
    private readonly LearningBankDbContext _db;
    public AuditLogRepository(LearningBankDbContext db) => _db = db;

    public async Task AddAsync(AuditLog entry, CancellationToken ct = default)
        => await _db.AuditLogs.AddAsync(entry, ct);
}
