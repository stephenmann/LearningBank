using LearningBank.Domain.Exceptions;

namespace LearningBank.Domain.Entities;

/// <summary>
/// A child's request to move money from Savings → Checking.
/// Requires parent approval (Domain Rule 5).
/// </summary>
public sealed class TransferRequest
{
    public Guid Id { get; private set; }
    public Guid ChildId { get; private set; }
    public decimal Amount { get; private set; }
    public string Note { get; private set; }
    public TransferRequestStatus Status { get; private set; }
    public Guid? ReviewedByParentId { get; private set; }
    public string? ReviewNote { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public DateTimeOffset? ReviewedAt { get; private set; }

    public User? Child { get; private set; }

    private TransferRequest() { Note = ""; }

    public static TransferRequest Create(Guid childId, decimal amount, string note)
    {
        if (amount <= 0) throw new ArgumentException("Transfer amount must be positive.", nameof(amount));
        return new TransferRequest
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            Amount = amount,
            Note = note ?? string.Empty,
            Status = TransferRequestStatus.Pending,
            RequestedAt = DateTimeOffset.UtcNow
        };
    }

    public void Approve(Guid parentId, string? reviewNote)
    {
        EnsurePending();
        Status = TransferRequestStatus.Approved;
        ReviewedByParentId = parentId;
        ReviewNote = reviewNote;
        ReviewedAt = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid parentId, string? reviewNote)
    {
        EnsurePending();
        Status = TransferRequestStatus.Rejected;
        ReviewedByParentId = parentId;
        ReviewNote = reviewNote;
        ReviewedAt = DateTimeOffset.UtcNow;
    }

    public void Cancel()
    {
        EnsurePending();
        Status = TransferRequestStatus.Cancelled;
        ReviewedAt = DateTimeOffset.UtcNow;
    }

    private void EnsurePending()
    {
        if (Status != TransferRequestStatus.Pending)
            throw new DomainException($"Transfer request is not pending (current status: {Status}).");
    }
}
