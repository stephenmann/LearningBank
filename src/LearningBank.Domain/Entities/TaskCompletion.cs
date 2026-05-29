using LearningBank.Domain.Exceptions;

namespace LearningBank.Domain.Entities;

public sealed class TaskCompletion
{
    public Guid Id { get; private set; }
    public Guid TaskId { get; private set; }
    public Guid ChildId { get; private set; }
    public DateTime OccurrenceDateUtc { get; private set; }
    public TaskCompletionStatus Status { get; private set; }
    public DateTimeOffset CompletedByChildAt { get; private set; }
    public Guid? ReviewedByParentId { get; private set; }
    public DateTimeOffset? ReviewedAt { get; private set; }
    public string? ReviewNote { get; private set; }

    public LearningTask? Task { get; private set; }

    private TaskCompletion() { }

    public static TaskCompletion CreatePending(Guid taskId, Guid childId, DateTime occurrenceDateUtc)
    {
        if (taskId == Guid.Empty) throw new ArgumentException("Task ID is required.", nameof(taskId));
        if (childId == Guid.Empty) throw new ArgumentException("Child ID is required.", nameof(childId));

        return new TaskCompletion
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            ChildId = childId,
            OccurrenceDateUtc = occurrenceDateUtc.Date,
            Status = TaskCompletionStatus.Pending,
            CompletedByChildAt = DateTimeOffset.UtcNow
        };
    }

    public void Approve(Guid parentId, string? reviewNote)
    {
        EnsurePending();
        if (parentId == Guid.Empty) throw new ArgumentException("Parent ID is required.", nameof(parentId));

        Status = TaskCompletionStatus.Approved;
        ReviewedByParentId = parentId;
        ReviewNote = reviewNote;
        ReviewedAt = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid parentId, string? reviewNote)
    {
        EnsurePending();
        if (parentId == Guid.Empty) throw new ArgumentException("Parent ID is required.", nameof(parentId));

        Status = TaskCompletionStatus.Rejected;
        ReviewedByParentId = parentId;
        ReviewNote = reviewNote;
        ReviewedAt = DateTimeOffset.UtcNow;
    }

    private void EnsurePending()
    {
        if (Status != TaskCompletionStatus.Pending)
            throw new DomainException($"Task completion is not pending (current status: {Status}).");
    }
}