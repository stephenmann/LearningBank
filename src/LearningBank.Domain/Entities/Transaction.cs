namespace LearningBank.Domain.Entities;

/// <summary>
/// An immutable financial transaction. Once posted it must never be edited;
/// corrections are issued as new offsetting entries (Domain Rule 2).
/// Money amounts are always decimal (Domain Rule 1).
/// </summary>
public sealed class Transaction
{
    public Guid Id { get; private set; }
    public Guid ChildId { get; private set; }
    public AccountType Account { get; private set; }
    public TransactionType Type { get; private set; }

    /// <summary>Positive = credit to account; Negative = debit from account.</summary>
    public decimal Amount { get; private set; }

    public string Description { get; private set; }
    public Guid? CategoryId { get; private set; }
    public Guid? RelatedTransactionId { get; private set; }
    public Guid? EnteredByParentId { get; private set; }
    public DateTimeOffset PostedAt { get; private set; }

    // Navigation properties
    public User? Child { get; private set; }
    public Category? Category { get; private set; }

    private Transaction() { Description = ""; }

    public static Transaction CreateDeposit(
        Guid childId,
        decimal amount,
        string description,
        Guid categoryId,
        Guid? enteredByParentId)
    {
        if (amount <= 0) throw new ArgumentException("Deposit amount must be positive.", nameof(amount));
        return new Transaction
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            Account = AccountType.Checking,
            Type = TransactionType.Deposit,
            Amount = amount,
            Description = description,
            CategoryId = categoryId,
            EnteredByParentId = enteredByParentId,
            PostedAt = DateTimeOffset.UtcNow
        };
    }

    public static Transaction CreateWithdrawal(
        Guid childId,
        decimal amount,
        string description,
        Guid enteredByParentId)
    {
        if (amount <= 0) throw new ArgumentException("Withdrawal amount must be positive.", nameof(amount));
        return new Transaction
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            Account = AccountType.Checking,
            Type = TransactionType.Withdrawal,
            Amount = -amount,      // debit
            Description = description,
            EnteredByParentId = enteredByParentId,
            PostedAt = DateTimeOffset.UtcNow
        };
    }

    /// <summary>Creates the matching pair for a checking-to-savings transfer.</summary>
    public static (Transaction debit, Transaction credit) CreateCheckingToSavingsTransfer(
        Guid childId,
        decimal amount,
        string description)
    {
        if (amount <= 0) throw new ArgumentException("Transfer amount must be positive.", nameof(amount));
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var debit = new Transaction
        {
            Id = id1,
            ChildId = childId,
            Account = AccountType.Checking,
            Type = TransactionType.TransferDebit,
            Amount = -amount,
            Description = description,
            RelatedTransactionId = id2,
            PostedAt = now
        };
        var credit = new Transaction
        {
            Id = id2,
            ChildId = childId,
            Account = AccountType.Savings,
            Type = TransactionType.TransferCredit,
            Amount = amount,
            Description = description,
            RelatedTransactionId = id1,
            PostedAt = now
        };
        return (debit, credit);
    }

    /// <summary>Creates the matching pair for an approved savings-to-checking transfer.</summary>
    public static (Transaction debit, Transaction credit) CreateSavingsToCheckingTransfer(
        Guid childId,
        decimal amount,
        string description)
    {
        if (amount <= 0) throw new ArgumentException("Transfer amount must be positive.", nameof(amount));
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var debit = new Transaction
        {
            Id = id1,
            ChildId = childId,
            Account = AccountType.Savings,
            Type = TransactionType.TransferDebit,
            Amount = -amount,
            Description = description,
            RelatedTransactionId = id2,
            PostedAt = now
        };
        var credit = new Transaction
        {
            Id = id2,
            ChildId = childId,
            Account = AccountType.Checking,
            Type = TransactionType.TransferCredit,
            Amount = amount,
            Description = description,
            RelatedTransactionId = id1,
            PostedAt = now
        };
        return (debit, credit);
    }
}
