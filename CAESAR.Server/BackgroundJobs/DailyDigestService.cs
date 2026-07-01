using CAESAR.Server.Data;
using CAESAR.Server.Models;
using CAESAR.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.BackgroundJobs
{
    // Ежедневные Telegram-рассылки (раздел 9.2/9.3): роль cron/node-cron.
    //   09:00 — персональные напоминания (список задач пользователя, акцент на просрочках/сегодня).
    //   10:00 — краткий отчёт по проектам пользователя.
    // Проверяем раз в минуту локальное время (смещение Telegram:DigestUtcOffsetHours, по умолчанию 0=UTC)
    // и один раз за день шлём каждый дайджест. Адресаты — у кого подключён канал Telegram.
    public sealed class DailyDigestService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _cfg;
        private readonly ILogger<DailyDigestService> _logger;

        private DateOnly _lastReminderDate = DateOnly.MinValue;
        private DateOnly _lastReportDate = DateOnly.MinValue;

        public DailyDigestService(
            IServiceScopeFactory scopeFactory,
            IConfiguration cfg,
            ILogger<DailyDigestService> logger)
        {
            _scopeFactory = scopeFactory;
            _cfg = cfg;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            int offset = _cfg.GetValue<int?>("Telegram:DigestUtcOffsetHours") ?? 0;
            int reminderHour = _cfg.GetValue<int?>("Telegram:ReminderHour") ?? 9;
            int reportHour = _cfg.GetValue<int?>("Telegram:ReportHour") ?? 10;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var localNow = DateTime.UtcNow.AddHours(offset);
                    var today = DateOnly.FromDateTime(localNow);

                    if (localNow.Hour == reminderHour && _lastReminderDate != today)
                    {
                        _lastReminderDate = today;
                        await SendDigestAsync(DigestKind.Reminder, offset, stoppingToken);
                    }
                    if (localNow.Hour == reportHour && _lastReportDate != today)
                    {
                        _lastReportDate = today;
                        await SendDigestAsync(DigestKind.Report, offset, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Сбой в цикле ежедневной рассылки.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private enum DigestKind { Reminder, Report }

        private async Task SendDigestAsync(DigestKind kind, int offset, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<INotificationService>();

            // Пользователи с подключённым Telegram-каналом.
            var recipients = await db.UserNotifications
                .Where(un => un.Provider == "Telegram")
                .Select(un => un.UserId)
                .Distinct()
                .ToListAsync(ct);

            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(offset));

            foreach (var userId in recipients)
            {
                // Страницы всех проектов пользователя.
                var pageIds = await db.Members
                    .Where(m => m.UserId == userId)
                    .Join(db.ProjectPages, m => m.ProjectId, p => p.ProjectId, (m, p) => p.Id)
                    .Distinct()
                    .ToListAsync(ct);

                var tasks = await db.BoardTasks
                    .Where(t => pageIds.Contains(t.ProjectPageId)
                                && (t.CreatedById == userId || t.AssignedToId == userId))
                    .Select(t => new { t.Id, t.Title, t.Status, t.Deadline })
                    .ToListAsync(ct);

                string? text = kind == DigestKind.Reminder
                    ? BuildReminder(tasks.Select(t => (t.Id, t.Title, t.Status, t.Deadline)), today)
                    : BuildReport(tasks.Select(t => (t.Id, t.Title, t.Status, t.Deadline)));

                if (text is not null)
                    await notifier.SendToUserAsync(userId, text);
            }
        }

        private static string? BuildReminder(
            IEnumerable<(int Id, string Title, BoardTaskStatus Status, DateTime? Deadline)> tasks, DateOnly today)
        {
            var list = tasks.ToList();
            var active = list.Where(t => t.Status != BoardTaskStatus.Done).ToList();
            if (active.Count == 0) return null;

            var overdue = active
                .Where(t => t.Deadline is { } d && DateOnly.FromDateTime(d) < today)
                .OrderBy(t => t.Deadline).ToList();
            var dueToday = active
                .Where(t => t.Deadline is { } d && DateOnly.FromDateTime(d) == today).ToList();

            var lines = new List<string> { "🔔 *Задачи на сегодня*" };
            if (overdue.Count > 0)
            {
                lines.Add($"\n❗ Просрочено ({overdue.Count}):");
                lines.AddRange(overdue.Take(10).Select(t => $"• #{t.Id} {t.Title} — до {t.Deadline:dd.MM}"));
            }
            if (dueToday.Count > 0)
            {
                lines.Add($"\n📅 Сегодня ({dueToday.Count}):");
                lines.AddRange(dueToday.Take(10).Select(t => $"• #{t.Id} {t.Title}"));
            }
            if (overdue.Count == 0 && dueToday.Count == 0)
                lines.Add($"\nАктивных задач: {active.Count}. Сроки на сегодня не горят.");

            return string.Join("\n", lines);
        }

        private static string BuildReport(
            IEnumerable<(int Id, string Title, BoardTaskStatus Status, DateTime? Deadline)> tasks)
        {
            var list = tasks.ToList();
            int prep = list.Count(t => t.Status == BoardTaskStatus.Preparaion);
            int exec = list.Count(t => t.Status == BoardTaskStatus.Execution);
            int test = list.Count(t => t.Status == BoardTaskStatus.Testing);
            int done = list.Count(t => t.Status == BoardTaskStatus.Done);

            return "📊 *Ежедневный отчёт*\n" +
                   $"Всего задач: {list.Count}\n" +
                   $"• Преподготовка: {prep}\n" +
                   $"• Выполнение: {exec}\n" +
                   $"• Тестирование: {test}\n" +
                   $"• Готово: {done}";
        }
    }
}
