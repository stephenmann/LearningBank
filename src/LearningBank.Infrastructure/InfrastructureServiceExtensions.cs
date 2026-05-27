using LearningBank.Domain.Repositories;
using LearningBank.Infrastructure.Data;
using LearningBank.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LearningBank.Infrastructure;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"] ?? "Sqlite";

        services.AddDbContext<LearningBankDbContext>(options =>
        {
            switch (provider)
            {
                case "SqlServer":
                    options.UseSqlServer(
                        configuration.GetConnectionString("SqlServer"),
                        sql => sql.MigrationsAssembly("LearningBank.Infrastructure"));
                    break;
                default: // Sqlite
                    options.UseSqlite(
                        configuration.GetConnectionString("Sqlite") ?? "Data Source=App_Data/learningbank.dev.db",
                        sql => sql.MigrationsAssembly("LearningBank.Infrastructure"));
                    break;
            }
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ITransferRequestRepository, TransferRequestRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();

        return services;
    }
}
