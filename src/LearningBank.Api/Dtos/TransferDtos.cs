namespace LearningBank.Api.Dtos;

public record TransferRequestDto(
    Guid Id,
    Guid ChildId,
    string? ChildDisplayName,
    string Amount,
    string Note,
    string Status,
    DateTimeOffset RequestedAt,
    DateTimeOffset? ReviewedAt,
    string? ReviewNote);

public record CreateTransferToSavingsRequest(
    Guid ChildId,
    decimal Amount,
    string Description);

public record CreateSavingsWithdrawalRequestDto(
    decimal Amount,
    string Note);

public record ReviewTransferRequestDto(
    bool Approve,
    string? ReviewNote);
