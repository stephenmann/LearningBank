using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearningBank.Infrastructure.Data.Configurations;

public sealed class ChildLinkConfiguration : IEntityTypeConfiguration<ChildLink>
{
    public void Configure(EntityTypeBuilder<ChildLink> builder)
    {
        builder.HasKey(l => l.Id);
        builder.HasIndex(l => new { l.ParentId, l.ChildId }).IsUnique();
        builder.HasOne(l => l.Parent).WithMany().HasForeignKey(l => l.ParentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(l => l.Child).WithMany(u => u.ParentLinks).HasForeignKey(l => l.ChildId).OnDelete(DeleteBehavior.Cascade);
    }
}
