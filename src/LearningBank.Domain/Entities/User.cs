namespace LearningBank.Domain.Entities;

public sealed class User
{
    public Guid Id { get; private set; }
    public string ExternalId { get; private set; }     // IdP subject claim
    public string Provider { get; private set; }       // "Google" | "Microsoft"
    public string Email { get; private set; }
    public string DisplayName { get; private set; }
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private readonly List<ChildLink> _parentLinks = [];
    public IReadOnlyList<ChildLink> ParentLinks => _parentLinks.AsReadOnly();

    private User() { ExternalId = ""; Provider = ""; Email = ""; DisplayName = ""; }

    public static User Create(
        string externalId,
        string provider,
        string email,
        string displayName,
        UserRole role)
    {
        if (string.IsNullOrWhiteSpace(externalId)) throw new ArgumentException("ExternalId is required.", nameof(externalId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("Provider is required.", nameof(provider));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required.", nameof(email));

        return new User
        {
            Id = Guid.NewGuid(),
            ExternalId = externalId,
            Provider = provider,
            Email = email,
            DisplayName = displayName,
            Role = role,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
    public void UpdateDisplayName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("DisplayName is required.", nameof(name));
        DisplayName = name;
    }
}
