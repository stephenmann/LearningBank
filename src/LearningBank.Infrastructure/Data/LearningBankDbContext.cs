using LearningBank.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LearningBank.Infrastructure.Data;

public sealed class LearningBankDbContext : DbContext
{
    public LearningBankDbContext(DbContextOptions<LearningBankDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ChildLink> ChildLinks => Set<ChildLink>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TransferRequest> TransferRequests => Set<TransferRequest>();
    public DbSet<LearningTask> LearningTasks => Set<LearningTask>();
    public DbSet<TaskCompletion> TaskCompletions => Set<TaskCompletion>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LearningBankDbContext).Assembly);
    }
}
