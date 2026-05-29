using System.Security.Claims;
using LearningBank.Api.Auth;
using LearningBank.Api.Dtos;
using LearningBank.Domain.Entities;
using LearningBank.Domain.Exceptions;
using LearningBank.Domain.Repositories;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace LearningBank.Api.Endpoints;

public static class TaskEndpoints
{
    public static RouteGroupBuilder MapTaskEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/children/{childId}/tasks", GetChildTasks)
            .RequireAuthorization()
            .WithName("GetChildTasks");

        group.MapPost("/tasks", CreateTask)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("CreateTask");

        group.MapPut("/tasks/{taskId}", UpdateTask)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("UpdateTask");

        group.MapPost("/tasks/{taskId}/complete", CompleteTask)
            .RequireAuthorization(AuthHelpers.ChildPolicy)
            .WithName("CompleteTask");

        group.MapGet("/children/{childId}/tasks/completions/pending", GetPendingCompletionsForChild)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("GetPendingTaskCompletionsForChild");

        group.MapPost("/tasks/completions/{completionId}/review", ReviewTaskCompletion)
            .RequireAuthorization(AuthHelpers.ParentPolicy)
            .WithName("ReviewTaskCompletion");

        return group;
    }

    private static async Task<Results<Ok<IReadOnlyList<LearningTaskDto>>, ForbidHttpResult>> GetChildTasks(
        Guid childId,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ILearningTaskRepository taskRepo,
        CancellationToken ct)
    {
        var actorId = user.GetUserId();
        var role = user.GetRole();

        if (role == nameof(UserRole.Child) && actorId != childId)
            return TypedResults.Forbid();

        if (role == nameof(UserRole.Parent) && !await userRepo.IsLinkedToChildAsync(actorId, childId, ct))
            return TypedResults.Forbid();

        var tasks = await taskRepo.GetForChildAsync(childId, ct);
        var today = DateTime.UtcNow.Date;
        var dtos = new List<LearningTaskDto>(tasks.Count);

        foreach (var task in tasks)
        {
            var completions = await taskRepo.GetCompletionsForTaskAsync(task.Id, ct);
            var currentOccurrence = task.GetCurrentCycleOccurrenceDate(today);
            var nextOccurrence = task.GetNextOccurrenceDate(today);
            var lastApproved = completions
                .Where(c => c.Status == TaskCompletionStatus.Approved)
                .OrderByDescending(c => c.OccurrenceDateUtc)
                .ThenByDescending(c => c.ReviewedAt)
                .FirstOrDefault();

            if (task.RecurrenceType == TaskRecurrenceType.OneTime && lastApproved is not null)
            {
                var completionDate = (lastApproved.ReviewedAt ?? lastApproved.CompletedByChildAt).UtcDateTime.Date;
                if (completionDate <= today.AddDays(-7))
                    continue;
            }

            var currentCompletion = currentOccurrence.HasValue
                ? completions.FirstOrDefault(c => c.OccurrenceDateUtc == currentOccurrence.Value)
                : null;

            var approvedCount = completions.Count(c => c.Status == TaskCompletionStatus.Approved);
            var hasReachedMax = task.MaxOccurrences.HasValue && approvedCount >= task.MaxOccurrences.Value;

            var canMarkComplete =
                task.IsActive &&
                !hasReachedMax &&
                currentOccurrence.HasValue &&
                (currentCompletion is null || currentCompletion.Status == TaskCompletionStatus.Rejected);

            var isPendingReview = currentCompletion?.Status == TaskCompletionStatus.Pending;
            var isCompletedForCurrentCycle = currentCompletion?.Status == TaskCompletionStatus.Approved;

            dtos.Add(new LearningTaskDto(
                task.Id,
                task.ChildId,
                task.Title,
                task.MonetaryValue.ToString("F2"),
                task.CategoryId,
                task.TargetAccount.ToString(),
                task.RecurrenceType.ToString(),
                task.Frequency?.ToString(),
                task.GetRecurringDays().Select(d => (int)d).ToList(),
                task.StartDateUtc,
                task.EndDateUtc,
                task.MaxOccurrences,
                task.IsActive,
                canMarkComplete,
                isPendingReview,
                isCompletedForCurrentCycle,
                currentOccurrence,
                nextOccurrence,
                lastApproved?.ReviewedAt,
                currentCompletion?.ReviewNote ?? lastApproved?.ReviewNote));
        }

        return TypedResults.Ok((IReadOnlyList<LearningTaskDto>)dtos);
    }

    private static async Task<Results<Created, ForbidHttpResult, ProblemHttpResult>> CreateTask(
        [FromBody] CreateLearningTaskRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ICategoryRepository categoryRepo,
        ILearningTaskRepository taskRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();

        if (!await userRepo.IsLinkedToChildAsync(parentId, req.ChildId, ct))
            return TypedResults.Forbid();

        var category = await categoryRepo.FindByIdAsync(req.CategoryId, ct);
        if (category is null || category.IsArchived)
            return TypedResults.Problem("Category is not available.", statusCode: 422);

        if (!TryParseTaskTargetAccount(req.TargetAccount, out var targetAccount))
            return TypedResults.Problem("Invalid target account.", statusCode: 422);

        if (!TryParseRecurrenceType(req.RecurrenceType, out var recurrenceType))
            return TypedResults.Problem("Invalid recurrence type.", statusCode: 422);

        TaskFrequency? frequency = null;
        if (recurrenceType == TaskRecurrenceType.Recurring)
        {
            if (!TryParseFrequency(req.Frequency, out var parsedFrequency))
                return TypedResults.Problem("Recurring tasks require a valid frequency.", statusCode: 422);
            frequency = parsedFrequency;
        }

        LearningTask task;
        try
        {
            task = LearningTask.Create(
                req.ChildId,
                req.Title,
                req.MonetaryValue,
                req.CategoryId,
                targetAccount,
                recurrenceType,
                frequency,
                (req.DaysOfWeek ?? []).Select(v => (DayOfWeek)v),
                req.EndDateUtc,
                req.MaxOccurrences,
                req.StartDateUtc ?? DateTime.UtcNow.Date,
                parentId);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: 422);
        }

        await taskRepo.AddTaskAsync(task, ct);
        await auditRepo.AddAsync(AuditLog.Create(parentId, "CreateTask", nameof(LearningTask), task.Id, after: task.Title), ct);
        await uow.SaveChangesAsync(ct);

        return TypedResults.Created($"/api/v1/tasks/{task.Id}");
    }

    private static async Task<Results<NoContent, NotFound, ForbidHttpResult, ProblemHttpResult>> UpdateTask(
        Guid taskId,
        [FromBody] UpdateLearningTaskRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ICategoryRepository categoryRepo,
        ILearningTaskRepository taskRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();
        var task = await taskRepo.FindTaskByIdAsync(taskId, ct);

        if (task is null)
            return TypedResults.NotFound();

        if (!await userRepo.IsLinkedToChildAsync(parentId, task.ChildId, ct))
            return TypedResults.Forbid();

        var category = await categoryRepo.FindByIdAsync(req.CategoryId, ct);
        if (category is null || category.IsArchived)
            return TypedResults.Problem("Category is not available.", statusCode: 422);

        if (!TryParseTaskTargetAccount(req.TargetAccount, out var targetAccount))
            return TypedResults.Problem("Invalid target account.", statusCode: 422);

        if (!TryParseRecurrenceType(req.RecurrenceType, out var recurrenceType))
            return TypedResults.Problem("Invalid recurrence type.", statusCode: 422);

        TaskFrequency? frequency = null;
        if (recurrenceType == TaskRecurrenceType.Recurring)
        {
            if (!TryParseFrequency(req.Frequency, out var parsedFrequency))
                return TypedResults.Problem("Recurring tasks require a valid frequency.", statusCode: 422);
            frequency = parsedFrequency;
        }

        try
        {
            task.UpdateDefinition(
                req.Title,
                req.MonetaryValue,
                req.CategoryId,
                targetAccount,
                recurrenceType,
                frequency,
                (req.DaysOfWeek ?? []).Select(v => (DayOfWeek)v),
                req.EndDateUtc,
                req.MaxOccurrences,
                req.StartDateUtc ?? task.StartDateUtc);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: 422);
        }

        await auditRepo.AddAsync(AuditLog.Create(parentId, "UpdateTask", nameof(LearningTask), task.Id, after: task.Title), ct);
        await uow.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, NotFound, ForbidHttpResult, ProblemHttpResult>> CompleteTask(
        Guid taskId,
        ClaimsPrincipal user,
        ILearningTaskRepository taskRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var childId = user.GetUserId();

        var task = await taskRepo.FindTaskByIdAsync(taskId, ct);
        if (task is null)
            return TypedResults.NotFound();

        if (task.ChildId != childId)
            return TypedResults.Forbid();

        var today = DateTime.UtcNow.Date;
        var occurrenceDate = task.GetCurrentCycleOccurrenceDate(today);
        if (!occurrenceDate.HasValue)
            return TypedResults.Problem("Task is not available to complete right now.", statusCode: 422);

        var approvedCount = await taskRepo.CountApprovedCompletionsAsync(task.Id, ct);
        if (task.MaxOccurrences.HasValue && approvedCount >= task.MaxOccurrences.Value)
            return TypedResults.Problem("Task has reached its maximum number of approved occurrences.", statusCode: 422);

        var existing = await taskRepo.FindCompletionForOccurrenceAsync(task.Id, occurrenceDate.Value, ct);
        if (existing is not null && existing.Status is TaskCompletionStatus.Pending or TaskCompletionStatus.Approved)
            return TypedResults.Problem("Task has already been submitted for this occurrence.", statusCode: 422);

        var completion = TaskCompletion.CreatePending(task.Id, task.ChildId, occurrenceDate.Value);
        await taskRepo.AddCompletionAsync(completion, ct);
        await uow.SaveChangesAsync(ct);

        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<IReadOnlyList<PendingTaskCompletionDto>>, ForbidHttpResult>> GetPendingCompletionsForChild(
        Guid childId,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ILearningTaskRepository taskRepo,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();

        if (!await userRepo.IsLinkedToChildAsync(parentId, childId, ct))
            return TypedResults.Forbid();

        var completions = await taskRepo.GetPendingCompletionsForChildAsync(childId, ct);
        var dtos = completions.Select(c => new PendingTaskCompletionDto(
            c.Id,
            c.TaskId,
            c.ChildId,
            c.Task?.Title ?? "Task",
            (c.Task?.MonetaryValue ?? 0m).ToString("F2"),
            c.Task?.TargetAccount.ToString() ?? nameof(TaskTargetAccount.Checking),
            c.OccurrenceDateUtc,
            c.CompletedByChildAt,
            c.Status.ToString(),
            c.ReviewNote)).ToList();

        return TypedResults.Ok((IReadOnlyList<PendingTaskCompletionDto>)dtos);
    }

    private static async Task<Results<NoContent, NotFound, ForbidHttpResult, ProblemHttpResult>> ReviewTaskCompletion(
        Guid completionId,
        [FromBody] TaskCompletionReviewRequest req,
        ClaimsPrincipal user,
        IUserRepository userRepo,
        ILearningTaskRepository taskRepo,
        ITransactionRepository txRepo,
        IAuditLogRepository auditRepo,
        IUnitOfWork uow,
        CancellationToken ct)
    {
        var parentId = user.GetUserId();
        var completion = await taskRepo.FindCompletionByIdAsync(completionId, ct);

        if (completion is null || completion.Task is null)
            return TypedResults.NotFound();

        if (!await userRepo.IsLinkedToChildAsync(parentId, completion.ChildId, ct))
            return TypedResults.Forbid();

        try
        {
            if (req.Approve)
            {
                completion.Approve(parentId, req.ReviewNote);
                var rewardTx = Transaction.CreateTaskReward(
                    completion.ChildId,
                    completion.Task.MonetaryValue,
                    completion.Task.CategoryId,
                    completion.Task.TargetAccount,
                    $"Task reward: {completion.Task.Title}",
                    parentId);
                await txRepo.AddAsync(rewardTx, ct);
            }
            else
            {
                completion.Reject(parentId, req.ReviewNote);
            }
        }
        catch (DomainException ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: 422);
        }

        await auditRepo.AddAsync(AuditLog.Create(
            parentId,
            req.Approve ? "ApproveTaskCompletion" : "RejectTaskCompletion",
            nameof(TaskCompletion),
            completion.Id,
            after: completion.Task.Title), ct);

        await uow.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static bool TryParseTaskTargetAccount(string raw, out TaskTargetAccount targetAccount)
        => Enum.TryParse(raw, true, out targetAccount);

    private static bool TryParseRecurrenceType(string raw, out TaskRecurrenceType recurrenceType)
        => Enum.TryParse(raw, true, out recurrenceType);

    private static bool TryParseFrequency(string? raw, out TaskFrequency frequency)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            frequency = default;
            return false;
        }

        return Enum.TryParse(raw, true, out frequency);
    }
}