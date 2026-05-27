namespace LearningBank.Api.Dtos;

public record TransactionDto(
    Guid Id,
    string Account,
    string Type,
    string Amount,
    string Description,
    string? CategoryName,
    DateTimeOffset PostedAt);

public record CreateDepositRequest(
    Guid ChildId,
    decimal Amount,
    string Description,
    Guid CategoryId);

public record CreateWithdrawalRequest(
    Guid ChildId,
    decimal Amount,
    string Description);

public record AccountSummaryDto(
    string Balance,
    IReadOnlyList<TransactionDto> Transactions);
