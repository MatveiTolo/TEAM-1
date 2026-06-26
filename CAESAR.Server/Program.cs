using CAESAR.Server.Data;
using CAESAR.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

namespace CAESAR.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["Secret"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddOpenApi();
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                // Задаем строгие правила валидации токена
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false, // Проверять, кто выпустил токен
                    ValidateAudience = false, // Проверять, для кого выпущен
                    ValidateLifetime = true, // Проверять, не истек ли срок годности
                    ValidateIssuerSigningKey = true, // Проверять цифровую подпись ключа

                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    // Превращаем наш секретный ключ в криптографический объект подписи
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),

                    ClockSkew = TimeSpan.Zero
                };
            });

            builder.Services.AddSingleton<NotificationProviderFactory>();
            // builder.Services.AddTransient<INotificationProvider, *Провайдер*>();
            // Регистрируем наш оркестрирующий сервис уведомлений
            builder.Services.AddTransient<INotificationService, NotificationService>();


            var app = builder.Build();

            app.UseDefaultFiles();
            app.MapStaticAssets();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();

                app.MapScalarApiReference();
            }

            app.UseHttpsRedirection();

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            // Автоматическое накладывание новых миграций при запуске.

            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;

                try
                {
                    var context = services.GetRequiredService<AppDbContext>();
                    await context.Database.MigrateAsync();
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "Ошибка при автоматическом применении миграций");
                }
            }
            app.Run();
        }
    }
}
