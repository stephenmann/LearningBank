using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearningBank.Infrastructure.Data.Configurations;

public sealed class TransferRequestConfiguration : IEntityTypeConfiguration<TransferRequest>
{
    public void Configure(EntityTypeBuilder<TransferRequest> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Amount).IsRequired().HasColumnType("decimal(18,4)");
        builder.Property(r => r.Note).HasMaxLength(500);
        builder.Property(r => r.ReviewNote).HasMaxLength(500);
        builder.HasOne(r => r.Child).WithMany().HasForeignKey(r => r.ChildId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(r => new { r.ChildId, r.Status });
    }
}
