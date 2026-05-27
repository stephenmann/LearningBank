namespace LearningBank.Domain.Entities;

/// <summary>
/// Links a parent user to a child user they are authorised to manage.
/// </summary>
public sealed class ChildLink
{
    public Guid Id { get; private set; }
    public Guid ParentId { get; private set; }
    public Guid ChildId { get; private set; }
    public DateTimeOffset LinkedAt { get; private set; }

    public User? Parent { get; private set; }
    public User? Child { get; private set; }

    private ChildLink() { }

    public static ChildLink Create(Guid parentId, Guid childId)
    {
        if (parentId == childId) throw new ArgumentException("A user cannot be linked to themselves.");
        return new ChildLink
        {
            Id = Guid.NewGuid(),
            ParentId = parentId,
            ChildId = childId,
            LinkedAt = DateTimeOffset.UtcNow
        };
    }
}
