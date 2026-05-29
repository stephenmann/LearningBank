using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Repositories;

public interface ILearningTaskRepository
{
    Task<IReadOnlyList<LearningTask>> GetForChildAsync(Guid childId, CancellationToken ct = default);
    Task<IReadOnlyList<TaskCompletion>> GetCompletionsForTaskAsync(Guid taskId, CancellationToken ct = default);
    Task<IReadOnlyList<TaskCompletion>> GetPendingCompletionsForChildAsync(Guid childId, CancellationToken ct = default);
    Task<LearningTask?> FindTaskByIdAsync(Guid taskId, CancellationToken ct = default);
    Task<TaskCompletion?> FindCompletionByIdAsync(Guid completionId, CancellationToken ct = default);
    Task<TaskCompletion?> FindCompletionForOccurrenceAsync(Guid taskId, DateTime occurrenceDateUtc, CancellationToken ct = default);
    Task<int> CountApprovedCompletionsAsync(Guid taskId, CancellationToken ct = default);
    Task AddTaskAsync(LearningTask task, CancellationToken ct = default);
    Task AddCompletionAsync(TaskCompletion completion, CancellationToken ct = default);
}