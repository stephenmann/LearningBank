namespace LearningBank.Domain.Entities;

public sealed class LearningTask
{
    public Guid Id { get; private set; }
    public Guid ChildId { get; private set; }
    public string Title { get; private set; }
    public decimal MonetaryValue { get; private set; }
    public Guid? CategoryId { get; private set; }
    public TaskTargetAccount TargetAccount { get; private set; }
    public TaskRecurrenceType RecurrenceType { get; private set; }
    public TaskFrequency? Frequency { get; private set; }
    public string? DaysOfWeekCsv { get; private set; }
    public DateTime? EndDateUtc { get; private set; }
    public int? MaxOccurrences { get; private set; }
    public DateTime StartDateUtc { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public Guid CreatedByParentId { get; private set; }

    public User? Child { get; private set; }
    public Category? Category { get; private set; }

    private LearningTask()
    {
        Title = string.Empty;
    }

    public static LearningTask Create(
        Guid childId,
        string title,
        decimal monetaryValue,
        Guid? categoryId,
        TaskTargetAccount targetAccount,
        TaskRecurrenceType recurrenceType,
        TaskFrequency? frequency,
        IEnumerable<DayOfWeek>? recurringDays,
        DateTime? endDateUtc,
        int? maxOccurrences,
        DateTime startDateUtc,
        Guid createdByParentId)
    {
        if (childId == Guid.Empty) throw new ArgumentException("Child ID is required.", nameof(childId));
        if (createdByParentId == Guid.Empty) throw new ArgumentException("Parent ID is required.", nameof(createdByParentId));
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Task title is required.", nameof(title));
        if (monetaryValue <= 0) throw new ArgumentException("Monetary value must be positive.", nameof(monetaryValue));
        if (!categoryId.HasValue || categoryId.Value == Guid.Empty) throw new ArgumentException("Category is required.", nameof(categoryId));

        var startDate = startDateUtc.Date;
        var normalizedEndDate = endDateUtc?.Date;

        if (normalizedEndDate.HasValue && normalizedEndDate.Value < startDate)
            throw new ArgumentException("End date cannot be before the start date.", nameof(endDateUtc));

        if (maxOccurrences.HasValue && maxOccurrences.Value <= 0)
            throw new ArgumentException("Maximum occurrences must be positive.", nameof(maxOccurrences));

        var daysCsv = BuildDaysCsv(recurrenceType, frequency, recurringDays);

        return new LearningTask
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            Title = title.Trim(),
            MonetaryValue = monetaryValue,
            CategoryId = categoryId,
            TargetAccount = targetAccount,
            RecurrenceType = recurrenceType,
            Frequency = recurrenceType == TaskRecurrenceType.Recurring ? frequency : null,
            DaysOfWeekCsv = daysCsv,
            EndDateUtc = normalizedEndDate,
            MaxOccurrences = maxOccurrences,
            StartDateUtc = startDate,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedByParentId = createdByParentId
        };
    }

    public void UpdateDefinition(
        string title,
        decimal monetaryValue,
        Guid? categoryId,
        TaskTargetAccount targetAccount,
        TaskRecurrenceType recurrenceType,
        TaskFrequency? frequency,
        IEnumerable<DayOfWeek>? recurringDays,
        DateTime? endDateUtc,
        int? maxOccurrences,
        DateTime startDateUtc)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Task title is required.", nameof(title));
        if (monetaryValue <= 0) throw new ArgumentException("Monetary value must be positive.", nameof(monetaryValue));
        if (!categoryId.HasValue || categoryId.Value == Guid.Empty) throw new ArgumentException("Category is required.", nameof(categoryId));

        var startDate = startDateUtc.Date;
        var normalizedEndDate = endDateUtc?.Date;

        if (normalizedEndDate.HasValue && normalizedEndDate.Value < startDate)
            throw new ArgumentException("End date cannot be before the start date.", nameof(endDateUtc));

        if (maxOccurrences.HasValue && maxOccurrences.Value <= 0)
            throw new ArgumentException("Maximum occurrences must be positive.", nameof(maxOccurrences));

        var daysCsv = BuildDaysCsv(recurrenceType, frequency, recurringDays);

        Title = title.Trim();
        MonetaryValue = monetaryValue;
        CategoryId = categoryId;
        TargetAccount = targetAccount;
        RecurrenceType = recurrenceType;
        Frequency = recurrenceType == TaskRecurrenceType.Recurring ? frequency : null;
        DaysOfWeekCsv = daysCsv;
        EndDateUtc = normalizedEndDate;
        MaxOccurrences = maxOccurrences;
        StartDateUtc = startDate;
    }

    public IReadOnlyList<DayOfWeek> GetRecurringDays()
    {
        if (string.IsNullOrWhiteSpace(DaysOfWeekCsv))
            return [];

        return DaysOfWeekCsv
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(v => (DayOfWeek)int.Parse(v))
            .Distinct()
            .OrderBy(v => (int)v)
            .ToList();
    }

    public bool IsDueOn(DateTime utcDate)
    {
        if (!IsActive)
            return false;

        var day = utcDate.Date;
        if (day < StartDateUtc)
            return false;

        if (EndDateUtc.HasValue && day > EndDateUtc.Value)
            return false;

        if (RecurrenceType == TaskRecurrenceType.OneTime)
            return day == StartDateUtc;

        var days = GetRecurringDays();
        if (!days.Contains(day.DayOfWeek))
            return false;

        var weekOffset = (int)((day - StartDateUtc).TotalDays / 7);
        if (weekOffset < 0)
            return false;

        if (Frequency == TaskFrequency.Biweekly && weekOffset % 2 != 0)
            return false;

        return true;
    }

    public DateTime? GetCurrentOccurrenceDate(DateTime utcDate)
        => IsDueOn(utcDate) ? utcDate.Date : null;

    public DateTime? GetCurrentCycleOccurrenceDate(DateTime utcDate)
    {
        if (!IsActive)
            return null;

        var day = utcDate.Date;
        if (day < StartDateUtc)
            return null;

        if (RecurrenceType == TaskRecurrenceType.OneTime)
            return StartDateUtc;

        for (var i = 0; i < 366 * 5; i++)
        {
            var candidate = day.AddDays(-i);
            if (candidate < StartDateUtc)
                break;

            if (EndDateUtc.HasValue && candidate > EndDateUtc.Value)
                continue;

            if (IsDueOn(candidate))
                return candidate;
        }

        return null;
    }

    public DateTime? GetNextOccurrenceDate(DateTime utcDate)
    {
        if (!IsActive)
            return null;

        if (RecurrenceType == TaskRecurrenceType.OneTime)
        {
            var oneTime = StartDateUtc;
            if (oneTime > utcDate.Date && (!EndDateUtc.HasValue || oneTime <= EndDateUtc.Value))
                return oneTime;
            return null;
        }

        var start = utcDate.Date.AddDays(1);
        for (var i = 0; i < 366 * 5; i++)
        {
            var candidate = start.AddDays(i);
            if (EndDateUtc.HasValue && candidate > EndDateUtc.Value)
                break;
            if (IsDueOn(candidate))
                return candidate;
        }

        return null;
    }

    private static string? BuildDaysCsv(
        TaskRecurrenceType recurrenceType,
        TaskFrequency? frequency,
        IEnumerable<DayOfWeek>? recurringDays)
    {
        if (recurrenceType == TaskRecurrenceType.OneTime)
            return null;

        if (frequency is null)
            throw new ArgumentException("Frequency is required for recurring tasks.", nameof(frequency));

        var days = (recurringDays ?? [])
            .Distinct()
            .OrderBy(v => (int)v)
            .ToList();

        if (days.Count == 0)
            throw new ArgumentException("At least one recurring day is required.", nameof(recurringDays));

        return string.Join(',', days.Select(d => ((int)d).ToString()));
    }
}