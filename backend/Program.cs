using System.Text;
using InventorySystem.Data;
using InventorySystem.Middleware;
using InventorySystem.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog — console + file
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/inventory-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
    .CreateLogger();
builder.Host.UseSerilog();

// DB
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<IJwtService,          JwtService>();
builder.Services.AddScoped<IReportService,        ReportService>();
builder.Services.AddScoped<IQRCodeService,        QRCodeService>();
builder.Services.AddScoped<INotificationService,  NotificationService>();
builder.Services.AddScoped<IAuditService,         AuditService>();

builder.Services.AddControllers();
// CORS
builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowReact", p =>
        p.WithOrigins("http://localhost:5173", "http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Inventory Management API",
        Version     = "v1",
        Description = "Industry-grade Inventory Management System API",
        Contact     = new OpenApiContact { Name = "Siddhesh Vetal", Email = "siddheshvetal676@gmail.com" }
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }},
        Array.Empty<string>()
    }});
});

var app = builder.Build();

// Startup: migrate + seed admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var admin = db.Users.FirstOrDefault(u => u.Email == "admin@inventory.com");
    if (admin != null)
    {
        if (!BCrypt.Net.BCrypt.Verify("Admin@123", admin.Password))
        {
            admin.Password = BCrypt.Net.BCrypt.HashPassword("Admin@123");
            db.SaveChanges();
        }
    }
    else
    {
        db.Users.Add(new InventorySystem.Models.User
        {
            Name      = "Admin",
            Email     = "admin@inventory.com",
            Password  = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role      = "Admin",
            CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
    }

    // Check for low stock on startup
    var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
    await notifService.CheckLowStockAsync();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c => { c.SwaggerEndpoint("/swagger/v1/swagger.json", "Inventory API v1"); c.RoutePrefix = "swagger"; });
app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
