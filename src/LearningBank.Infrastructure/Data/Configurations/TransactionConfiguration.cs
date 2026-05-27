using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearningBank.Infrastructure.Data.Configurations;

public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Amount).IsRequired().HasColumnType("decimal(18,4)");
        builder.Property(t => t.Description).IsRequired().HasMaxLength(500);
        builder.HasOne(t => t.Child).WithMany().HasForeignKey(t => t.ChildId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(t => t.Category).WithMany().HasForeignKey(t => t.CategoryId).IsRequired(false).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(t => new { t.ChildId, t.Account });
        builder.HasIndex(t => t.PostedAt);
    }
}
