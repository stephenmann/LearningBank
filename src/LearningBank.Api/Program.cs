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
using Microsoft.IdentityModel.JsonWebTokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Azure App Service port binding ────────────────────────────────────────────
// On Linux App Service, PORT is set by the platform. TLS termination is handled
// by the Azure front-end, so plain HTTP on the assigned port is correct here.
var portValue = Environment.GetEnvironmentVariable("PORT");
if (int.TryParse(portValue, out var port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// ── Serilog ──────────────────────────────────────────────────────────────────
builder.Host.UseSerilog((ctx, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .Enrich.FromLogContext()
       .WriteTo.Console(outputTemplate:
           "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} - {Message:lj}{NewLine}{Exception}"));

// ── Infrastructure (EF Core + repositories) ──────────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ── Authentication ────────────────────────────────────────────────────────────
// API accepts provider-issued ID tokens from NextAuth (Google + Microsoft).
const string GoogleScheme = "GoogleJwt";
const string MicrosoftScheme = "MicrosoftJwt";
const string MultiProviderScheme = "MultiProviderJwt";

var googleAuthority = builder.Configuration["Auth:GoogleAuthority"] ?? "https://accounts.google.com";
var microsoftAuthority = builder.Configuration["Auth:MicrosoftAuthority"]
    ?? builder.Configuration["Auth:Authority"]
    ?? "https://login.microsoftonline.com/common/v2.0";

// Audiences are the registered OAuth client IDs the API will accept tokens for.
var googleAudience = builder.Configuration["Auth:Google:Audience"];
var microsoftAudience = builder.Configuration["Auth:Microsoft:Audience"];
var googleValidIssuers = builder.Configuration.GetSection("Auth:Google:ValidIssuers").Get<string[]>()
    ?? ["https://accounts.google.com", "accounts.google.com"];
var microsoftValidIssuers = builder.Configuration.GetSection("Auth:Microsoft:ValidIssuers").Get<string[]>()
    ?? [];

JwtBearerEvents BuildJwtEvents() => new()
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

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = MultiProviderScheme;
        options.DefaultChallengeScheme = MultiProviderScheme;
    })
    .AddPolicyScheme(MultiProviderScheme, "Select Google or Microsoft JWT", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authorization = context.Request.Headers.Authorization.ToString();
            if (string.IsNullOrWhiteSpace(authorization) || !authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return MicrosoftScheme;

            var token = authorization["Bearer ".Length..].Trim();
            try
            {
                var jwt = new JsonWebToken(token);
                var issuer = jwt.Issuer ?? string.Empty;

                if (issuer.Contains("accounts.google.com", StringComparison.OrdinalIgnoreCase))
                    return GoogleScheme;
            }
            catch
            {
                // If parsing fails, let a concrete scheme report the validation error.
            }

            return MicrosoftScheme;
        };
    })
    .AddJwtBearer(GoogleScheme, options =>
    {
        options.Authority = googleAuthority;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters.ValidateAudience = true;
        options.TokenValidationParameters.ValidAudiences = string.IsNullOrWhiteSpace(googleAudience)
            ? null
            : [googleAudience];
        options.TokenValidationParameters.ValidateIssuer = true;
        options.TokenValidationParameters.ValidIssuers = googleValidIssuers;
        options.Events = BuildJwtEvents();
    })
    .AddJwtBearer(MicrosoftScheme, options =>
    {
        options.Authority = microsoftAuthority;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters.ValidateAudience = true;
        options.TokenValidationParameters.ValidAudiences = string.IsNullOrWhiteSpace(microsoftAudience)
            ? null
            : [microsoftAudience];
        // Microsoft "common"/"organizations" authorities issue per-tenant issuers, so the
        // accepted issuers must be enumerated explicitly rather than inferred from metadata.
        options.TokenValidationParameters.ValidateIssuer = true;
        options.TokenValidationParameters.ValidIssuers = microsoftValidIssuers;
        options.Events = BuildJwtEvents();
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
// The API authenticates via the Authorization: Bearer header (not ambient cookies), so
// cross-site requests cannot attach credentials — this is the CSRF mitigation. Allowed
// methods/headers are restricted to what the SPA actually uses.
var webAppOrigin = builder.Configuration["Auth:WebAppUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(cors =>
    cors.AddDefaultPolicy(p => p
        .WithOrigins(webAppOrigin)
        .WithHeaders("Authorization", "Content-Type")
        .WithMethods("GET", "POST", "DELETE")
        .AllowCredentials()));

// ── Forwarded headers ─────────────────────────────────────────────────────────
// Behind Azure App Service / Front Door the real client IP arrives in X-Forwarded-For.
// Honor it so the rate limiter partitions per real client rather than the proxy address.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
        | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

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

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
// Rate limiting runs after authentication so the per-user partition key (User.Identity.Name)
// is populated; unauthenticated requests fall back to the forwarded client IP.
app.UseRateLimiter();

// ── Route groups ──────────────────────────────────────────────────────────────
var api = app.MapGroup("/api/v1");
api.AddEndpointFilter<LearningBank.Api.Validators.ValidationEndpointFilter>();
api.MapUserEndpoints();
api.MapCategoryEndpoints();
api.MapAccountEndpoints();
api.MapTransactionEndpoints();
api.MapTaskEndpoints();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();

public partial class Program { }
