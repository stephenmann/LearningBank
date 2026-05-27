using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Services;

/// <summary>
/// Encapsulates the domain invariants for account operations.
/// Balance is always derived (Domain Rule 7).
/// </summary>
public static class AccountService
{
    public static decimal GetBalance(IEnumerable<Transaction> transactions, AccountType account)
        => transactions
            .Where(t => t.Account == account)
            .Sum(t => t.Amount);

    public static (Transaction debit, Transaction credit) CheckingToSavings(
        IEnumerable<Transaction> existingTransactions,
        Guid childId,
        decimal amount,
        string description)
    {
        var balance = GetBalance(existingTransactions, AccountType.Checking);
        if (balance < amount)
            throw new Exceptions.InsufficientFundsException(balance, amount);

        return Transaction.CreateCheckingToSavingsTransfer(childId, amount, description);
    }

    public static (Transaction debit, Transaction credit) SavingsToChecking(
        IEnumerable<Transaction> existingTransactions,
        Guid childId,
        decimal amount,
        string description)
    {
        var balance = GetBalance(existingTransactions, AccountType.Savings);
        if (balance < amount)
            throw new Exceptions.InsufficientFundsException(balance, amount);

        return Transaction.CreateSavingsToCheckingTransfer(childId, amount, description);
    }
}
