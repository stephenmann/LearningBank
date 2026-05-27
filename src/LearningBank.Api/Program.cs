using System.Threading.RateLimiting;
using FluentValidation;
using LearningBank.Api.Auth;
using LearningBank.Api.Endpoints;
using LearningBank.Infrastructure;
using LearningBank.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ──────────────────────────────────────────────────────────────────
builder.Host.UseSerilog((ctx, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .Enrich.FromLogContext()
       .WriteTo.Console(outputTemplate:
           "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} - {Message:lj}{NewLine}{Exception}"));

// ── Infrastructure (EF Core + repositories) ──────────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── Authentication ────────────────────────────────────────────────────────────
// The frontend (Next.js / NextAuth.js) issues JWTs that this API validates.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"]
            ?? builder.Configuration["Auth:WebAppUrl"];
        options.Audience = builder.Configuration["Auth:Audience"] ?? "learning-bank-api";
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters.ValidateAudience = false;
        options.TokenValidationParameters.ValidateIssuer = false;
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Log.Warning(ctx.Exception, "JWT authentication failed");
                return Task.CompletedTask;
            },
            OnChallenge = ctx =>
            {
                Log.Warning("JWT challenge triggered. Error: {Error}; Description: {Description}", ctx.Error, ctx.ErrorDescription);
                return Task.CompletedTask;
            }
        };
    });

// ── Claims transformation ─────────────────────────────────────────────────────
builder.Services.AddScoped<IClaimsTransformation, LearningBankClaimsTransformer>();

// ── Authorization ─────────────────────────────────────────────────────────────
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AuthHelpers.ParentPolicy, p => p.RequireRole("Parent"))
    .AddPolicy(AuthHelpers.ChildPolicy, p => p.RequireRole("Child"));

// ── Validation ────────────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<Program>(lifetime: ServiceLifetime.Scoped);

// ── CORS ───────────────────────────────────────────────────────────────────────
var webAppOrigin = builder.Configuration["Auth:WebAppUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(cors =>
    cors.AddDefaultPolicy(p => p
        .WithOrigins(webAppOrigin)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

// ── Rate limiting ─────────────────────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.User.Identity?.Name ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
    options.RejectionStatusCode = 429;
});

builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// ── Migrate & seed ────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LearningBankDbContext>();
    await db.Database.MigrateAsync();

    if (!db.Categories.Any())
    {
        var defaults = new[] { ("Allowance", true), ("Birthday Gift", true), ("Chore Earnings", true), ("Gift Card", true), ("Other", true) };
        foreach (var (name, allowed) in defaults)
            db.Categories.Add(LearningBank.Domain.Entities.Category.Create(name, allowed));
        await db.SaveChangesAsync();
    }
}

app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler(errApp =>
        errApp.Run(async ctx =>
        {
            ctx.Response.StatusCode = 500;
            ctx.Response.ContentType = "application/problem+json";
            await ctx.Response.WriteAsJsonAsync(new { type = "https://tools.ietf.org/html/rfc7807", title = "An unexpected error occurred.", status = 500 });
        }));
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// ── Route groups ──────────────────────────────────────────────────────────────
var api = app.MapGroup("/api/v1");
api.MapUserEndpoints();
api.MapCategoryEndpoints();
api.MapAccountEndpoints();
api.MapTransactionEndpoints();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();

public partial class Program { }
