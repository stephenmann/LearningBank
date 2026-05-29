using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearningBank.Infrastructure.Data.Configurations;

public sealed class TaskCompletionConfiguration : IEntityTypeConfiguration<TaskCompletion>
{
    public void Configure(EntityTypeBuilder<TaskCompletion> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.OccurrenceDateUtc).IsRequired();
        builder.Property(c => c.ReviewNote).HasMaxLength(500);

        builder.HasOne(c => c.Task)
            .WithMany()
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.TaskId, c.OccurrenceDateUtc, c.Status });
        builder.HasIndex(c => new { c.ChildId, c.Status });
    }
}