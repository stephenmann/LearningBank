namespace LearningBank.Domain.Entities;

/// <summary>
/// Deposit category (e.g. Allowance, Birthday Gift, Chore Earnings, Gift Card).
/// Managed by parents; children can only use categories where IsChildAllowed = true.
/// </summary>
public sealed class Category
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public bool IsChildAllowed { get; private set; }
    public bool IsArchived { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private Category() { Name = ""; }

    public static Category Create(string name, bool isChildAllowed)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Category name is required.", nameof(name));
        return new Category
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            IsChildAllowed = isChildAllowed,
            IsArchived = false,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, bool isChildAllowed)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Category name is required.", nameof(name));
        Name = name.Trim();
        IsChildAllowed = isChildAllowed;
    }

    public void Archive() => IsArchived = true;
    public void Unarchive() => IsArchived = false;
}
