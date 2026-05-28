using FluentAssertions;
using LearningBank.Api.Services;
using LearningBank.Domain.Entities;

namespace LearningBank.Api.Tests;

public sealed class TransactionVisibilityServiceTests
{
    [Fact]
    public void ForChildView_HidesReversalAndOriginalTransaction()
    {
        var childId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var parentId = Guid.NewGuid();

        var original = Transaction.CreateDeposit(childId, 20m, "Birthday gift", categoryId, parentId);
        var reversal = Transaction.CreateReversal(original, parentId, "Entered by mistake");
        var visible = Transaction.CreateDeposit(childId, 15m, "Allowance", categoryId, parentId);

        var filtered = TransactionVisibilityService.ForChildView([original, reversal, visible]);

        filtered.Select(t => t.Id).Should().ContainSingle().Which.Should().Be(visible.Id);
    }

    [Fact]
    public void ForChildView_LeavesTransferPairsVisible()
    {
        var childId = Guid.NewGuid();
        var (debit, credit) = Transaction.CreateCheckingToSavingsTransfer(childId, 10m, "Move to savings");

        var filtered = TransactionVisibilityService.ForChildView([debit, credit]);

        filtered.Should().HaveCount(2);
        filtered.Select(t => t.Id).Should().Contain([debit.Id, credit.Id]);
    }
}
