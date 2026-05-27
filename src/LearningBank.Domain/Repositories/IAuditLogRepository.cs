using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Repositories;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog entry, CancellationToken ct = default);
}
