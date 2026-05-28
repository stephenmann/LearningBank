using FluentAssertions;
using System.Reflection;
using LearningBank.Domain.Entities;
using LearningBank.Infrastructure.Data;
using LearningBank.Infrastructure.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Api.Tests;

public sealed class TransactionRepositoryTests
{
    [Fact]
    public async Task GetForChildAccountAsync_OrdersByPostedAtDescending_OnSqlite()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<LearningBankDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new LearningBankDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var child = User.Create("child-ext", "Microsoft", "child@example.com", "Child", UserRole.Child);
        db.Users.Add(child);
        await db.SaveChangesAsync();

        var childId = child.Id;
        var older = Transaction.CreateWithdrawal(childId, 5m, "older", Guid.NewGuid());
        var newer = Transaction.CreateWithdrawal(childId, 10m, "newer", Guid.NewGuid());

        SetPostedAt(older, new DateTimeOffset(2026, 5, 27, 12, 0, 0, TimeSpan.Zero));
        SetPostedAt(newer, new DateTimeOffset(2026, 5, 28, 12, 0, 0, TimeSpan.Zero));

        db.Transactions.AddRange(older, newer);
        await db.SaveChangesAsync();

        var repository = new TransactionRepository(db);

        var result = await repository.GetForChildAccountAsync(childId, AccountType.Checking);

        result.Select(t => t.Description).Should().Equal("newer", "older");
    }

    [Fact]
    public async Task FindByIdAsync_ReturnsTransaction_WhenItExists()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<LearningBankDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new LearningBankDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var child = User.Create("child-ext", "Microsoft", "child@example.com", "Child", UserRole.Child);
        var category = Category.Create("Allowance", true);
        db.Users.Add(child);
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var original = Transaction.CreateDeposit(child.Id, 15m, "Gift", category.Id, null);
        db.Transactions.Add(original);
        await db.SaveChangesAsync();

        var repository = new TransactionRepository(db);

        var result = await repository.FindByIdAsync(original.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(original.Id);
    }

    [Fact]
    public async Task ExistsByRelatedTransactionIdAsync_ReturnsTrue_WhenReversalExists()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<LearningBankDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new LearningBankDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var child = User.Create("child-ext", "Microsoft", "child@example.com", "Child", UserRole.Child);
        var category = Category.Create("Allowance", true);
        db.Users.Add(child);
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var parentId = Guid.NewGuid();
        var original = Transaction.CreateDeposit(child.Id, 15m, "Gift", category.Id, parentId);
        var reversal = Transaction.CreateReversal(original, parentId, "Accidental entry");

        db.Transactions.AddRange(original, reversal);
        await db.SaveChangesAsync();

        var repository = new TransactionRepository(db);

        var exists = await repository.ExistsByRelatedTransactionIdAsync(original.Id);

        exists.Should().BeTrue();
    }

    private static void SetPostedAt(Transaction transaction, DateTimeOffset value)
    {
        var property = typeof(Transaction).GetProperty(nameof(Transaction.PostedAt), BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
        property!.SetValue(transaction, value);
    }
}