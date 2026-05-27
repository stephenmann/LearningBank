using FluentAssertions;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Exceptions;

namespace LearningBank.Domain.Tests;

public sealed class TransferRequestTests
{
    [Fact]
    public void Create_SetsPendingStatus()
    {
        var req = TransferRequest.Create(Guid.NewGuid(), 50m, "Need lunch money");

        req.Status.Should().Be(TransferRequestStatus.Pending);
        req.Amount.Should().Be(50m);
    }

    [Fact]
    public void Approve_SetsApprovedStatus()
    {
        var req = TransferRequest.Create(Guid.NewGuid(), 50m, "");
        var parentId = Guid.NewGuid();

        req.Approve(parentId, "Approved!");

        req.Status.Should().Be(TransferRequestStatus.Approved);
        req.ReviewedByParentId.Should().Be(parentId);
        req.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public void Reject_SetsRejectedStatus()
    {
        var req = TransferRequest.Create(Guid.NewGuid(), 50m, "");
        req.Reject(Guid.NewGuid(), "Not now");

        req.Status.Should().Be(TransferRequestStatus.Rejected);
    }

    [Fact]
    public void Cancel_SetsCancelledStatus()
    {
        var req = TransferRequest.Create(Guid.NewGuid(), 50m, "");
        req.Cancel();

        req.Status.Should().Be(TransferRequestStatus.Cancelled);
    }

    [Fact]
    public void Approve_ThrowsWhenNotPending()
    {
        var req = TransferRequest.Create(Guid.NewGuid(), 50m, "");
        req.Approve(Guid.NewGuid(), null);

        var act = () => req.Approve(Guid.NewGuid(), null);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Create_ThrowsOnNegativeAmount()
    {
        var act = () => TransferRequest.Create(Guid.NewGuid(), -5m, "");
        act.Should().Throw<ArgumentException>();
    }
}
