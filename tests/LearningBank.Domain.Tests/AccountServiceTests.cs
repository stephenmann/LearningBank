using FluentAssertions;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Exceptions;
using LearningBank.Domain.Services;

namespace LearningBank.Domain.Tests;

public sealed class AccountServiceTests
{
    private static IEnumerable<Transaction> CheckingWith(decimal amount)
    {
        yield return Transaction.CreateDeposit(Guid.NewGuid(), amount, "seed", Guid.NewGuid(), null);
    }

    [Fact]
    public void GetBalance_SumsAllTransactionsForAccount()
    {
        var childId = Guid.NewGuid();
        var catId = Guid.NewGuid();
        var txs = new[]
        {
            Transaction.CreateDeposit(childId, 100m, "Allowance", catId, null),
            Transaction.CreateWithdrawal(childId, 30m, "Snacks", Guid.NewGuid()),
        };

        var balance = AccountService.GetBalance(txs, AccountType.Checking);

        balance.Should().Be(70m);
    }

    [Fact]
    public void CheckingToSavings_RejectsWhenInsufficientFunds()
    {
        var childId = Guid.NewGuid();

        var act = () => AccountService.CheckingToSavings(
            CheckingWith(10m), childId, 50m, "transfer");

        act.Should().Throw<InsufficientFundsException>();
    }

    [Fact]
    public void CheckingToSavings_CreatesMatchingDebitAndCredit()
    {
        var childId = Guid.NewGuid();
        var (debit, credit) = AccountService.CheckingToSavings(
            CheckingWith(100m), childId, 40m, "transfer");

        debit.Account.Should().Be(AccountType.Checking);
        debit.Amount.Should().Be(-40m);
        credit.Account.Should().Be(AccountType.Savings);
        credit.Amount.Should().Be(40m);
        debit.RelatedTransactionId.Should().Be(credit.Id);
        credit.RelatedTransactionId.Should().Be(debit.Id);
    }

    [Fact]
    public void SavingsToChecking_RejectsWhenInsufficientFunds()
    {
        var childId = Guid.NewGuid();

        var act = () => AccountService.SavingsToChecking(
            Array.Empty<Transaction>(), childId, 10m, "transfer");

        act.Should().Throw<InsufficientFundsException>();
    }
}
