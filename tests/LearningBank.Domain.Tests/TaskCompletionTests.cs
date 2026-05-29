using FluentAssertions;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Exceptions;

namespace LearningBank.Domain.Tests;

public sealed class TaskCompletionTests
{
    [Fact]
    public void CreatePending_SetsPendingStatus()
    {
        var completion = TaskCompletion.CreatePending(Guid.NewGuid(), Guid.NewGuid(), new DateTime(2026, 5, 28));

        completion.Status.Should().Be(TaskCompletionStatus.Pending);
        completion.OccurrenceDateUtc.Should().Be(new DateTime(2026, 5, 28));
    }

    [Fact]
    public void Approve_SetsApprovedStatus()
    {
        var completion = TaskCompletion.CreatePending(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.Date);

        completion.Approve(Guid.NewGuid(), "Nice work");

        completion.Status.Should().Be(TaskCompletionStatus.Approved);
        completion.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public void Reject_ThrowsWhenNotPending()
    {
        var completion = TaskCompletion.CreatePending(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.Date);
        completion.Approve(Guid.NewGuid(), null);

        var act = () => completion.Reject(Guid.NewGuid(), "Retry");

        act.Should().Throw<DomainException>();
    }
}
