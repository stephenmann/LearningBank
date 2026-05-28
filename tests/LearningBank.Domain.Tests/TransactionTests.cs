using FluentAssertions;
using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Tests;

public sealed class TransactionTests
{
    [Fact]
    public void CreateReversal_ForDeposit_CreatesOppositeEntryLinkedToOriginal()
    {
        var childId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var original = Transaction.CreateDeposit(childId, 25m, "Allowance", categoryId, parentId);

        var reversal = Transaction.CreateReversal(original, parentId, "Entered by mistake");

        reversal.ChildId.Should().Be(original.ChildId);
        reversal.Account.Should().Be(original.Account);
        reversal.Type.Should().Be(TransactionType.Withdrawal);
        reversal.Amount.Should().Be(-original.Amount);
        reversal.RelatedTransactionId.Should().Be(original.Id);
        reversal.EnteredByParentId.Should().Be(parentId);
        reversal.CategoryId.Should().Be(categoryId);
        reversal.Description.Should().Contain(original.Id.ToString());
    }

    [Fact]
    public void CreateReversal_ThrowsForTransferTransactions()
    {
        var childId = Guid.NewGuid();
        var (debit, _) = Transaction.CreateCheckingToSavingsTransfer(childId, 10m, "Move to savings");

        var act = () => Transaction.CreateReversal(debit, Guid.NewGuid(), "Mistake");

        act.Should().Throw<ArgumentException>();
    }
}
