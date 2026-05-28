using FluentAssertions;
using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Tests;

public sealed class UserTests
{
    [Fact]
    public void LinkExternalIdentity_UpdatesPendingUser()
    {
        var user = User.Create(
            externalId: Guid.NewGuid().ToString(),
            provider: "Pending",
            email: "child@example.com",
            displayName: "Child",
            role: UserRole.Child);

        user.LinkExternalIdentity("google-subject", "Google");

        user.ExternalId.Should().Be("google-subject");
        user.Provider.Should().Be("Google");
    }

    [Fact]
    public void LinkExternalIdentity_ThrowsWhenAlreadyLinkedToAnotherIdentity()
    {
        var user = User.Create(
            externalId: "existing-subject",
            provider: "Google",
            email: "child@example.com",
            displayName: "Child",
            role: UserRole.Child);

        var act = () => user.LinkExternalIdentity("new-subject", "Google");

        act.Should().Throw<InvalidOperationException>();
    }
}
