using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    // Документированный эндпоинт ИИ-ассистента: POST /api/ai/chat  (раздел 9.4.3).
    // Body: { message }. Пользователь берётся из JWT (user_id из тела небезопасен).
    // Если задан ключ OpenAI:ApiKey — отвечает GPT по контексту, иначе — детерминированный
    // разбор по данным пользователя (типы запросов из Таблицы 32).
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public sealed class AiController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;
        private readonly IHttpClientFactory _http;

        public AiController(AppDbContext db, IConfiguration cfg, IHttpClientFactory http)
        {
            _db = db; _cfg = cfg; _http = http;
        }

        [HttpPost("chat")]
        public async Task<ActionResult<AiChatResponseDto>> Chat(AiChatRequestDto dto, CancellationToken ct)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();
            if (string.IsNullOrWhiteSpace(dto.Message)) return BadRequest("Пустой запрос.");

            // Задачи пользователя (создатель или исполнитель) по всем его проектам.
            var pageIds = await _db.Members
                .Where(m => m.UserId == userId)
                .Join(_db.ProjectPages, m => m.ProjectId, p => p.ProjectId, (m, p) => p.Id)
                .Distinct().ToListAsync(ct);

            var tasks = await _db.BoardTasks
                .Where(t => pageIds.Contains(t.ProjectPageId) && (t.CreatedById == userId || t.AssignedToId == userId))
                .Select(t => new { t.Id, t.Title, t.Status, t.Deadline })
                .ToListAsync(ct);

            var apiKey = _cfg["OpenAI:ApiKey"];
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                try
                {
                    var text = await AskOpenAiAsync(apiKey!, dto.Message, tasks, ct);
                    if (!string.IsNullOrWhiteSpace(text)) return Ok(new AiChatResponseDto { Text = text });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"OpenAI недоступен, fallback: {ex.Message}");
                }
            }

            return Ok(new AiChatResponseDto { Text = RuleBasedAnswer(dto.Message, tasks.Select(t => (t.Id, t.Title, t.Status, t.Deadline))) });
        }

        private static string RuleBasedAnswer(string q, IEnumerable<(int Id, string Title, BoardTaskStatus Status, DateTime? Deadline)> tasks, DateTime? nowUtc = null)
        {
            var now = (nowUtc ?? DateTime.UtcNow).Date;
            var list = tasks.ToList();
            string ql = q.ToLowerInvariant();

            var overdue = list.Where(t => t.Deadline is { } d && d.Date < now && t.Status != BoardTaskStatus.Done).ToList();
            var inWork = list.Where(t => t.Status is BoardTaskStatus.Execution or BoardTaskStatus.Testing).ToList();
            var waiting = list.Where(t => t.Status == BoardTaskStatus.Preparaion).ToList();

            if (ql.Contains("просроч"))
                return overdue.Count == 0 ? "Просроченных задач нет." :
                    $"Просрочено задач: {overdue.Count}. " + string.Join("; ", overdue.Select(t => $"#{t.Id} \"{t.Title}\""));

            if (ql.Contains("сколько") && ql.Contains("задач"))
                return $"В работе: {inWork.Count}, в ожидании: {waiting.Count}, просрочено: {overdue.Count}. Всего у вас: {list.Count}.";

            if (ql.Contains("сегодня") || ql.Contains("делать") || ql.Contains("фокус") || ql.Contains("приоритет"))
            {
                var priority = list.Where(t => t.Status != BoardTaskStatus.Done && t.Deadline != null)
                    .OrderBy(t => t.Deadline).Take(3).ToList();
                if (priority.Count == 0) return "Задач с дедлайнами нет — начните с любой из колонки «Выполнение».";
                return "Рекомендую в порядке приоритета: " +
                    string.Join("; ", priority.Select(t => $"#{t.Id} \"{t.Title}\" (дедлайн {t.Deadline:dd.MM.yyyy})"));
            }

            return $"У вас {list.Count} задач: в работе {inWork.Count}, в ожидании {waiting.Count}, просрочено {overdue.Count}. " +
                   "Спросите: «сколько у меня задач?», «сколько просрочено?», «что мне делать сегодня?».";
        }

        private async Task<string> AskOpenAiAsync(string apiKey, string question,
            IEnumerable<object> tasks, CancellationToken ct)
        {
            var model = _cfg["OpenAI:Model"] ?? "gpt-4o";
            var contextJson = JsonSerializer.Serialize(tasks);
            var body = new
            {
                model,
                temperature = 0.2,
                messages = new object[]
                {
                    new { role = "system", content = "Ты ассистент канбан-доски CAESAR. Отвечай кратко, на русском, только по данным JSON. Даты в UTC. Статусы: Preparaion/Execution/Testing/Done." },
                    new { role = "user", content = $"Текущее время UTC: {DateTime.UtcNow:o}\nЗАДАЧИ:\n{contextJson}\n\nВОПРОС:\n{question}" }
                }
            };

            var client = _http.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            req.Headers.Add("Authorization", $"Bearer {apiKey}");
            req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            using var resp = await client.SendAsync(req, ct);
            resp.EnsureSuccessStatusCode();
            using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()?.Trim() ?? "";
        }
    }
}
