using FluentAssertions;
using LearningBank.Domain.Entities;

namespace LearningBank.Domain.Tests;

public sealed class LearningTaskTests
{
    [Fact]
    public void OneTimeTask_IsDueOnlyOnStartDate()
    {
        var start = new DateTime(2026, 5, 28);
        var task = LearningTask.Create(
            Guid.NewGuid(),
            "Clean room",
            5m,
            Guid.NewGuid(),
            TaskTargetAccount.Checking,
            TaskRecurrenceType.OneTime,
            frequency: null,
            recurringDays: null,
            endDateUtc: null,
            maxOccurrences: null,
            startDateUtc: start,
            createdByParentId: Guid.NewGuid());

        task.IsDueOn(start).Should().BeTrue();
        task.IsDueOn(start.AddDays(1)).Should().BeFalse();
    }

    [Fact]
    public void RecurringBiweeklyTask_IsDueEveryOtherWeek()
    {
        var start = new DateTime(2026, 5, 25); // Monday
        var task = LearningTask.Create(
            Guid.NewGuid(),
            "Take out recycling",
            3m,
            Guid.NewGuid(),
            TaskTargetAccount.Savings,
            TaskRecurrenceType.Recurring,
            TaskFrequency.Biweekly,
            new[] { DayOfWeek.Monday },
            endDateUtc: null,
            maxOccurrences: null,
            startDateUtc: start,
            createdByParentId: Guid.NewGuid());

        task.IsDueOn(start).Should().BeTrue();
        task.IsDueOn(start.AddDays(7)).Should().BeFalse();
        task.IsDueOn(start.AddDays(14)).Should().BeTrue();
    }

    [Fact]
    public void RecurringTask_RequiresAtLeastOneDay()
    {
        var act = () => LearningTask.Create(
            Guid.NewGuid(),
            "Task",
            2m,
            Guid.NewGuid(),
            TaskTargetAccount.Checking,
            TaskRecurrenceType.Recurring,
            TaskFrequency.Weekly,
            Array.Empty<DayOfWeek>(),
            endDateUtc: null,
            maxOccurrences: null,
            startDateUtc: DateTime.UtcNow.Date,
            createdByParentId: Guid.NewGuid());

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void OneTimeTask_CurrentCycle_IsStartDateAfterStart()
    {
        var start = new DateTime(2026, 5, 28);
        var task = LearningTask.Create(
            Guid.NewGuid(),
            "Wash dishes",
            2m,
            Guid.NewGuid(),
            TaskTargetAccount.Checking,
            TaskRecurrenceType.OneTime,
            frequency: null,
            recurringDays: null,
            endDateUtc: null,
            maxOccurrences: null,
            startDateUtc: start,
            createdByParentId: Guid.NewGuid());

        task.GetCurrentCycleOccurrenceDate(start.AddDays(2)).Should().Be(start);
    }

    [Fact]
    public void RecurringTask_CurrentCycle_ReturnsMostRecentOccurrence()
    {
        var start = new DateTime(2026, 5, 25); // Monday
        var task = LearningTask.Create(
            Guid.NewGuid(),
            "Mow lawn",
            10m,
            Guid.NewGuid(),
            TaskTargetAccount.Checking,
            TaskRecurrenceType.Recurring,
            TaskFrequency.Weekly,
            new[] { DayOfWeek.Saturday },
            endDateUtc: null,
            maxOccurrences: null,
            startDateUtc: start,
            createdByParentId: Guid.NewGuid());

        // Tuesday should still map to the prior Saturday recurrence window.
        task.GetCurrentCycleOccurrenceDate(new DateTime(2026, 6, 2)).Should().Be(new DateTime(2026, 5, 30));
    }

    [Fact]
    public void UpdateDefinition_UpdatesCoreTaskFields()
    {
        var categoryA = Guid.NewGuid();
        var categoryB = Guid.NewGuid();
        var task = LearningTask.Create(
            Guid.NewGuid(),
            "Original task",
            3m,
            categoryA,
            TaskTargetAccount.Checking,
            TaskRecurrenceType.OneTime,
            frequency: null,
            recurringDays: null,
            endDateUtc: null,
            maxOccurrences: null,
            startDateUtc: new DateTime(2026, 5, 28),
            createdByParentId: Guid.NewGuid());

        task.UpdateDefinition(
            "Updated task",
            8m,
            categoryB,
            TaskTargetAccount.Savings,
            TaskRecurrenceType.Recurring,
            TaskFrequency.Weekly,
            new[] { DayOfWeek.Monday, DayOfWeek.Friday },
            endDateUtc: new DateTime(2026, 6, 30),
            maxOccurrences: 6,
            startDateUtc: new DateTime(2026, 5, 30));

        task.Title.Should().Be("Updated task");
        task.MonetaryValue.Should().Be(8m);
        task.CategoryId.Should().Be(categoryB);
        task.TargetAccount.Should().Be(TaskTargetAccount.Savings);
        task.RecurrenceType.Should().Be(TaskRecurrenceType.Recurring);
        task.Frequency.Should().Be(TaskFrequency.Weekly);
        task.GetRecurringDays().Should().BeEquivalentTo(new[] { DayOfWeek.Monday, DayOfWeek.Friday });
        task.EndDateUtc.Should().Be(new DateTime(2026, 6, 30));
        task.MaxOccurrences.Should().Be(6);
        task.StartDateUtc.Should().Be(new DateTime(2026, 5, 30));
    }
}
