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
            builder.Services.AddHttpClient();
            builder.Services.AddOpenApi();

            // CORS для дев-окружения (Vite-клиент на localhost)
            //builder.Services.AddCors(options =>
            //{
            //    options.AddPolicy("ClientDev", policy =>
            //    {
            //        policy.SetIsOriginAllowed(_ => true)
            //              .AllowAnyOrigin()
            //              .AllowAnyHeader()
            //              .AllowAnyMethod()
            //              .AllowCredentials();
            //    });
            //});

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.WithOrigins("http://localhost:8080") // ЖЕСТКО пишем адрес фронта из консоли браузера
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials(); // Полная поддержка Axios с куками и токенами
                });
            });

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
            // Провайдер Telegram: прямая отправка через Bot API sendMessage (раздел 9.3).
            builder.Services.AddTransient<INotificationProvider, TelegramNotificationProvider>();
            // Регистрируем наш оркестрирующий сервис уведомлений
            builder.Services.AddTransient<INotificationService, NotificationService>();
            // Ежедневные рассылки: напоминания 09:00 и отчёт 10:00 (раздел 9.2/9.3).
            builder.Services.AddHostedService<CAESAR.Server.BackgroundJobs.DailyDigestService>();


            var app = builder.Build();

            // За облачным балансировщиком/прокси (Render, Railway, Cloud Run, Nginx)
            // TLS терминируется снаружи — пробрасываем оригинальную схему и IP клиента.
            app.UseForwardedHeaders(new Microsoft.AspNetCore.Builder.ForwardedHeadersOptions
            {
                ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
                                 | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
            });

            app.UseDefaultFiles();
            app.MapStaticAssets();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();

                app.MapScalarApiReference();

                //app.UseCors("ClientDev");
                app.UseCors("AllowAll");
            }

            // HTTPS-редирект включаем только явным флагом (ForceHttpsRedirect=true).
            // В облаке TLS обычно терминирует прокси, и принудительный редирект
            // внутри контейнера приводит к циклу — по умолчанию выключен.
            if (builder.Configuration.GetValue<bool>("ForceHttpsRedirect"))
            {
                app.UseHttpsRedirection();
            }
            //app.UseCors("AllowAll");

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
