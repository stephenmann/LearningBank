namespace LearningBank.Api.Dtos;

public record LearningTaskDto(
    Guid Id,
    Guid ChildId,
    string Title,
    string MonetaryValue,
    Guid? CategoryId,
    string TargetAccount,
    string RecurrenceType,
    string? Frequency,
    IReadOnlyList<int> DaysOfWeek,
    DateTime StartDateUtc,
    DateTime? EndDateUtc,
    int? MaxOccurrences,
    bool IsActive,
    bool CanMarkComplete,
    bool IsPendingReview,
    bool IsCompletedForCurrentCycle,
    DateTime? CurrentOccurrenceDateUtc,
    DateTime? NextOccurrenceDateUtc,
    DateTimeOffset? LastApprovedAt,
    string? LastReviewNote);

public record CreateLearningTaskRequest(
    Guid ChildId,
    string Title,
    decimal MonetaryValue,
    Guid CategoryId,
    string TargetAccount,
    string RecurrenceType,
    string? Frequency,
    IReadOnlyList<int>? DaysOfWeek,
    DateTime? StartDateUtc,
    DateTime? EndDateUtc,
    int? MaxOccurrences);

public record UpdateLearningTaskRequest(
    string Title,
    decimal MonetaryValue,
    Guid CategoryId,
    string TargetAccount,
    string RecurrenceType,
    string? Frequency,
    IReadOnlyList<int>? DaysOfWeek,
    DateTime? StartDateUtc,
    DateTime? EndDateUtc,
    int? MaxOccurrences);

public record CompleteLearningTaskRequest();

public record TaskCompletionReviewRequest(
    bool Approve,
    string? ReviewNote);

public record PendingTaskCompletionDto(
    Guid CompletionId,
    Guid TaskId,
    Guid ChildId,
    string TaskTitle,
    string MonetaryValue,
    string TargetAccount,
    DateTime OccurrenceDateUtc,
    DateTimeOffset CompletedByChildAt,
    string Status,
    string? ReviewNote);