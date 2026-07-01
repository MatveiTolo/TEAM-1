using CAESAR.Server.Data;
using CAESAR.Server.Models;
using CAESAR.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.BackgroundJobs
{
    // Ежедневные Telegram-рассылки (роль cron/node-cron). Раз в минуту сверяем
    // локальное время (смещение Telegram:DigestUtcOffsetHours, 0=UTC) и один раз
    // за день шлём каждый дайджест. Адресаты — у кого подключён канал Telegram.
    //
    //   Telegram:ReminderHour (09:00) — исполнителю: задачи с дедлайном сегодня/просроченные.
    //   Telegram:ReportHour   (10:00) — супер-админу: расширенный отчёт по проекту за день;
    //                                    остальным участникам — краткая сводка по статусам.
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
                        await SendDeadlineAlertsAsync(offset, stoppingToken);
                    }
                    if (localNow.Hour == reportHour && _lastReportDate != today)
                    {
                        _lastReportDate = today;
                        await SendDailyReportsAsync(offset, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Сбой в цикле ежедневной рассылки.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 1) Дедлайн-алерты исполнителю: задачи, назначенные на пользователя,
        //    у которых дедлайн сегодня или уже просрочен (и они не «Готово»).
        // ─────────────────────────────────────────────────────────────────────
        private async Task SendDeadlineAlertsAsync(int offset, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(offset));

            // Кому вообще можем доставить — у кого подключён Telegram.
            var recipients = await db.UserNotifications
                .Where(un => un.Provider == "Telegram")
                .Select(un => un.UserId)
                .Distinct()
                .ToListAsync(ct);

            foreach (var userId in recipients)
            {
                var assigned = await db.BoardTasks
                    .Where(t => t.AssignedToId == userId
                                && t.Status != BoardTaskStatus.Done
                                && t.Deadline != null)
                    .Select(t => new { t.Id, t.Title, t.Deadline })
                    .ToListAsync(ct);

                if (assigned.Count == 0) continue;

                var overdue = assigned
                    .Where(t => DateOnly.FromDateTime(t.Deadline!.Value) < today)
                    .OrderBy(t => t.Deadline).ToList();
                var dueToday = assigned
                    .Where(t => DateOnly.FromDateTime(t.Deadline!.Value) == today)
                    .ToList();

                if (overdue.Count == 0 && dueToday.Count == 0) continue;

                var lines = new List<string> { "Дедлайны по вашим задачам" };
                if (overdue.Count > 0)
                {
                    lines.Add($"\nПросрочено ({overdue.Count}):");
                    lines.AddRange(overdue.Take(15).Select(t => $"— #{t.Id} {t.Title} (до {t.Deadline:dd.MM})"));
                }
                if (dueToday.Count > 0)
                {
                    lines.Add($"\nСегодня ({dueToday.Count}):");
                    lines.AddRange(dueToday.Take(15).Select(t => $"— #{t.Id} {t.Title}"));
                }

                await notifier.SendToUserAsync(userId, string.Join("\n", lines));
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2) Ежедневный отчёт:
        //    • супер-админам (GlobalAdmin) — расширенный отчёт по каждому их проекту;
        //    • остальным Telegram-участникам — краткая персональная сводка.
        // ─────────────────────────────────────────────────────────────────────
        private async Task SendDailyReportsAsync(int offset, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var todayLocal = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(offset));
            var dayStartUtc = DateTime.SpecifyKind(
                todayLocal.ToDateTime(TimeOnly.MinValue).AddHours(-offset), DateTimeKind.Utc);
            var dayEndUtc = dayStartUtc.AddDays(1);

            var telegramUserIds = await db.UserNotifications
                .Where(un => un.Provider == "Telegram")
                .Select(un => un.UserId)
                .Distinct()
                .ToListAsync(ct);
            if (telegramUserIds.Count == 0) return;
            var telegramSet = telegramUserIds.ToHashSet();

            // Проекты, где есть супер-админ с подключённым Telegram.
            var adminMemberships = await db.Members
                .Where(m => m.Role == (int)UserRole.GlobalAdmin && telegramSet.Contains(m.UserId))
                .Select(m => new { m.ProjectId, m.UserId })
                .ToListAsync(ct);

            var adminUserIds = adminMemberships.Select(a => a.UserId).ToHashSet();
            var projectAdmins = adminMemberships
                .GroupBy(a => a.ProjectId)
                .ToDictionary(g => g.Key, g => g.Select(a => a.UserId).Distinct().ToList());

            // ── Расширенные отчёты супер-админам по каждому проекту ──
            foreach (var (projectId, admins) in projectAdmins)
            {
                var project = await db.Projects.FindAsync(new object?[] { projectId }, ct);
                var projectName = project?.Name ?? $"Проект #{projectId}";

                var pageIds = await db.ProjectPages
                    .Where(p => p.ProjectId == projectId)
                    .Select(p => p.Id)
                    .ToListAsync(ct);

                var tasks = await db.BoardTasks
                    .Where(t => pageIds.Contains(t.ProjectPageId))
                    .Select(t => new TaskRow(t.Id, t.Title, t.Status, t.Deadline, t.AssignedToId))
                    .ToListAsync(ct);

                var taskIds = tasks.Select(t => t.Id).ToList();

                var doneTodayIds = await db.TaskHistories
                    .Where(h => taskIds.Contains(h.TaskId)
                                && h.StatusAfter == BoardTaskStatus.Done
                                && h.StatusBefore != BoardTaskStatus.Done
                                && h.CreatedAt >= dayStartUtc && h.CreatedAt < dayEndUtc)
                    .Select(h => h.TaskId)
                    .Distinct()
                    .ToListAsync(ct);

                var nameMap = await BuildNameMapAsync(db, projectId, ct);

                var text = BuildSuperAdminReport(projectName, tasks, doneTodayIds.ToHashSet(), nameMap, todayLocal);

                foreach (var adminId in admins)
                    await notifier.SendToUserAsync(adminId, text);
            }

            // ── Краткая персональная сводка тем, кто нигде не супер-админ ──
            foreach (var userId in telegramUserIds.Where(id => !adminUserIds.Contains(id)))
            {
                var pageIds = await db.Members
                    .Where(m => m.UserId == userId)
                    .Join(db.ProjectPages, m => m.ProjectId, p => p.ProjectId, (m, p) => p.Id)
                    .Distinct()
                    .ToListAsync(ct);

                var tasks = await db.BoardTasks
                    .Where(t => pageIds.Contains(t.ProjectPageId)
                                && (t.CreatedById == userId || t.AssignedToId == userId))
                    .Select(t => t.Status)
                    .ToListAsync(ct);

                if (tasks.Count == 0) continue;
                await notifier.SendToUserAsync(userId, BuildPersonalReport(tasks));
            }
        }

        private sealed record TaskRow(int Id, string Title, BoardTaskStatus Status, DateTime? Deadline, int? AssignedToId);

        private static async Task<Dictionary<int, string>> BuildNameMapAsync(AppDbContext db, int projectId, CancellationToken ct)
        {
            return await db.Members
                .Where(m => m.ProjectId == projectId)
                .Join(db.Users, m => m.UserId, u => u.Id, (m, u) => u)
                .Distinct()
                .ToDictionaryAsync(u => u.Id, u => u.UserName, ct);
        }

        private static string Assignee(int? id, Dictionary<int, string> names) =>
            id is int aid && names.TryGetValue(aid, out var n) && !string.IsNullOrWhiteSpace(n)
                ? n : "не назначен";

        private static string BuildSuperAdminReport(
            string projectName,
            List<TaskRow> tasks,
            HashSet<int> doneTodayIds,
            Dictionary<int, string> names,
            DateOnly today)
        {
            var active = tasks.Where(t => t.Status != BoardTaskStatus.Done).ToList();

            var doneToday = tasks.Where(t => doneTodayIds.Contains(t.Id)).ToList();

            var overdue = active
                .Where(t => t.Deadline is { } d && DateOnly.FromDateTime(d) < today)
                .OrderBy(t => t.Deadline).ToList();
            var dueToday = active
                .Where(t => t.Deadline is { } d && DateOnly.FromDateTime(d) == today)
                .ToList();

            int prep = active.Count(t => t.Status == BoardTaskStatus.Preparaion);
            int exec = active.Count(t => t.Status == BoardTaskStatus.Execution);
            int test = active.Count(t => t.Status == BoardTaskStatus.Testing);

            var lines = new List<string>
            {
                $"Ежедневный отчёт по проекту «{projectName}»",
                $"Дата: {today:dd.MM.yyyy}",
                "",
                $"Выполнено за день: {doneToday.Count}",
            };
            if (doneToday.Count > 0)
                lines.AddRange(doneToday.Take(15)
                    .Select(t => $"— #{t.Id} {t.Title} ({Assignee(t.AssignedToId, names)})"));

            lines.Add("");
            lines.Add($"Осталось к выполнению: {active.Count}");
            lines.Add($"— Преподготовка: {prep}");
            lines.Add($"— Выполнение: {exec}");
            lines.Add($"— Тестирование: {test}");

            lines.Add("");
            lines.Add($"Подходят к дедлайну: {overdue.Count + dueToday.Count}");
            if (overdue.Count > 0)
            {
                lines.Add($"Просрочено ({overdue.Count}):");
                lines.AddRange(overdue.Take(15)
                    .Select(t => $"— #{t.Id} {t.Title} — до {t.Deadline:dd.MM} ({Assignee(t.AssignedToId, names)})"));
            }
            if (dueToday.Count > 0)
            {
                lines.Add($"Сегодня ({dueToday.Count}):");
                lines.AddRange(dueToday.Take(15)
                    .Select(t => $"— #{t.Id} {t.Title} ({Assignee(t.AssignedToId, names)})"));
            }
            if (overdue.Count == 0 && dueToday.Count == 0)
                lines.Add("— сроки на сегодня не горят.");

            return string.Join("\n", lines);
        }

        private static string BuildPersonalReport(List<BoardTaskStatus> statuses)
        {
            int prep = statuses.Count(s => s == BoardTaskStatus.Preparaion);
            int exec = statuses.Count(s => s == BoardTaskStatus.Execution);
            int test = statuses.Count(s => s == BoardTaskStatus.Testing);
            int done = statuses.Count(s => s == BoardTaskStatus.Done);

            return "Ежедневная сводка по вашим задачам\n" +
                   $"Всего: {statuses.Count}\n" +
                   $"— Преподготовка: {prep}\n" +
                   $"— Выполнение: {exec}\n" +
                   $"— Тестирование: {test}\n" +
                   $"— Готово: {done}";
        }
    }
}
