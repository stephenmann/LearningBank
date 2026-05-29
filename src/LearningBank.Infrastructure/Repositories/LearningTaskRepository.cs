using LearningBank.Domain.Entities;
using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Repositories;

public sealed class LearningTaskRepository : ILearningTaskRepository
{
    private readonly LearningBankDbContext _db;

    public LearningTaskRepository(LearningBankDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<LearningTask>> GetForChildAsync(Guid childId, CancellationToken ct = default)
    {
        var tasks = await _db.LearningTasks
            .Where(t => t.ChildId == childId)
            .ToListAsync(ct);

        return tasks
            .OrderByDescending(t => t.CreatedAt)
            .ToList()
            .AsReadOnly();
    }

    public async Task<IReadOnlyList<TaskCompletion>> GetCompletionsForTaskAsync(Guid taskId, CancellationToken ct = default)
    {
        var completions = await _db.TaskCompletions
            .Where(c => c.TaskId == taskId)
            .ToListAsync(ct);

        return completions
            .OrderByDescending(c => c.OccurrenceDateUtc)
            .ThenByDescending(c => c.CompletedByChildAt)
            .ToList()
            .AsReadOnly();
    }

    public async Task<IReadOnlyList<TaskCompletion>> GetPendingCompletionsForChildAsync(Guid childId, CancellationToken ct = default)
    {
        var completions = await _db.TaskCompletions
            .Include(c => c.Task)
            .Where(c => c.ChildId == childId && c.Status == TaskCompletionStatus.Pending)
            .ToListAsync(ct);

        return completions
            .OrderBy(c => c.CompletedByChildAt)
            .ToList()
            .AsReadOnly();
    }

    public Task<LearningTask?> FindTaskByIdAsync(Guid taskId, CancellationToken ct = default)
        => _db.LearningTasks.FirstOrDefaultAsync(t => t.Id == taskId, ct);

    public Task<TaskCompletion?> FindCompletionByIdAsync(Guid completionId, CancellationToken ct = default)
        => _db.TaskCompletions
            .Include(c => c.Task)
            .FirstOrDefaultAsync(c => c.Id == completionId, ct);

    public async Task<TaskCompletion?> FindCompletionForOccurrenceAsync(Guid taskId, DateTime occurrenceDateUtc, CancellationToken ct = default)
    {
        var completions = await _db.TaskCompletions
            .Where(c => c.TaskId == taskId && c.OccurrenceDateUtc == occurrenceDateUtc.Date)
            .ToListAsync(ct);

        return completions
            .OrderByDescending(c => c.CompletedByChildAt)
            .FirstOrDefault();
    }

    public Task<int> CountApprovedCompletionsAsync(Guid taskId, CancellationToken ct = default)
        => _db.TaskCompletions.CountAsync(c => c.TaskId == taskId && c.Status == TaskCompletionStatus.Approved, ct);

    public async Task AddTaskAsync(LearningTask task, CancellationToken ct = default)
        => await _db.LearningTasks.AddAsync(task, ct);

    public async Task AddCompletionAsync(TaskCompletion completion, CancellationToken ct = default)
        => await _db.TaskCompletions.AddAsync(completion, ct);
}