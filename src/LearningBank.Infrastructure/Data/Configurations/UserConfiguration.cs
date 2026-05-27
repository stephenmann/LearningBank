using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearningBank.Infrastructure.Data.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.ExternalId).IsRequired().HasMaxLength(256);
        builder.Property(u => u.Provider).IsRequired().HasMaxLength(50);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
        builder.Property(u => u.DisplayName).IsRequired().HasMaxLength(256);
        builder.Property(u => u.Role).IsRequired();
        builder.HasIndex(u => new { u.ExternalId, u.Provider }).IsUnique();
    }
}
