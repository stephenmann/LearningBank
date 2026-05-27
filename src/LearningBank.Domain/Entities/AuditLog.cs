namespace LearningBank.Domain.Entities;

/// <summary>Audit record for every administrative action (Domain Rule 9).</summary>
public sealed class AuditLog
{
    public Guid Id { get; private set; }
    public Guid ActorId { get; private set; }
    public string Action { get; private set; }
    public string EntityType { get; private set; }
    public Guid EntityId { get; private set; }
    public string? Before { get; private set; }   // JSON snapshot
    public string? After { get; private set; }    // JSON snapshot
    public DateTimeOffset OccurredAt { get; private set; }

    private AuditLog() { Action = ""; EntityType = ""; }

    public static AuditLog Create(
        Guid actorId,
        string action,
        string entityType,
        Guid entityId,
        string? before = null,
        string? after = null)
    {
        return new AuditLog
        {
            Id = Guid.NewGuid(),
            ActorId = actorId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Before = before,
            After = after,
            OccurredAt = DateTimeOffset.UtcNow
        };
    }
}
