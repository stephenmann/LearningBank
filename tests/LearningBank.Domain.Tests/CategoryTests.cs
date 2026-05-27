using FluentAssertions;
using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Tests;

public sealed class CategoryTests
{
    [Fact]
    public void Create_SetsExpectedDefaults()
    {
        var cat = Category.Create("Allowance", isChildAllowed: true);

        cat.Name.Should().Be("Allowance");
        cat.IsChildAllowed.Should().BeTrue();
        cat.IsArchived.Should().BeFalse();
    }

    [Fact]
    public void Archive_SetsIsArchivedTrue()
    {
        var cat = Category.Create("Allowance", true);
        cat.Archive();
        cat.IsArchived.Should().BeTrue();
    }

    [Fact]
    public void Unarchive_SetsIsArchivedFalse()
    {
        var cat = Category.Create("Allowance", true);
        cat.Archive();
        cat.Unarchive();
        cat.IsArchived.Should().BeFalse();
    }

    [Fact]
    public void Create_ThrowsOnEmptyName()
    {
        var act = () => Category.Create("", true);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Update_ChangesNameAndPermission()
    {
        var cat = Category.Create("Old Name", false);
        cat.Update("New Name", true);

        cat.Name.Should().Be("New Name");
        cat.IsChildAllowed.Should().BeTrue();
    }
}
