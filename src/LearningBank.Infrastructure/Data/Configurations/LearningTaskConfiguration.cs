using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearningBank.Infrastructure.Data.Configurations;

public sealed class LearningTaskConfiguration : IEntityTypeConfiguration<LearningTask>
{
    public void Configure(EntityTypeBuilder<LearningTask> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Title).IsRequired().HasMaxLength(200);
        builder.Property(t => t.MonetaryValue).IsRequired().HasColumnType("decimal(18,4)");
        builder.Property(t => t.DaysOfWeekCsv).HasMaxLength(64);
        builder.Property(t => t.StartDateUtc).IsRequired();
        builder.Property(t => t.EndDateUtc);
        builder.Property(t => t.IsActive).IsRequired();

        builder.HasOne(t => t.Child)
            .WithMany()
            .HasForeignKey(t => t.ChildId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Category)
            .WithMany()
            .HasForeignKey(t => t.CategoryId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.ChildId, t.IsActive });
        builder.HasIndex(t => t.CategoryId);
    }
}