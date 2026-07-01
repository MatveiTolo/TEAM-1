// ============================================================
//  CAESAR — Привязка Telegram через одноразовый код
//
//   POST /api/telegram/link-code   [Authorize]            — сайт
//        -> { code, expiresAtUtc }
//   POST /api/telegram/link        (заголовок X-Bot-Secret) — бот
//        -> { jwt, userId, userName }
//
//  Требует: сущность TelegramLink в AppDbContext + миграцию,
//  ключ "Telegram:BotSecret" в appsettings.
// ============================================================
using System.Security.Claims;
using CAESAR.Server.Data;
using CAESAR.Server.Models;
using CAESAR.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    public sealed record LinkCodeResponse(string Code, DateTime ExpiresAtUtc);
    public sealed record BotLinkRequest(string Code, long TelegramId);
    public sealed record BotLinkResponse(string Jwt, int UserId, string UserName);

    [ApiController]
    [Route("api/telegram")]
    public sealed class TelegramController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;

        public TelegramController(AppDbContext db, IConfiguration cfg)
        {
            _db = db; _cfg = cfg;
        }

        // 1) Сайт: залогиненный юзер запрашивает одноразовый код
        [HttpPost("link-code")]
        [Authorize]
        public async Task<ActionResult<LinkCodeResponse>> CreateCode(CancellationToken ct)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var code = Random.Shared.Next(0, 1_000_000).ToString("D6");
            var expires = DateTime.UtcNow.AddMinutes(10);

            var link = await _db.TelegramLinks.FirstOrDefaultAsync(x => x.UserId == userId, ct);
            if (link is null)
            {
                link = new TelegramLink { UserId = userId };
                _db.TelegramLinks.Add(link);
            }
            link.LinkCode = code;
            link.CodeExpiresAtUtc = expires;

            await _db.SaveChangesAsync(ct);
            return Ok(new LinkCodeResponse(code, expires));
        }

        // 2) Бот: подтверждает код, получает JWT юзера
        [HttpPost("link")]
        [AllowAnonymous] // защита общим секретом бота, а не JWT (вызов до привязки)
        public async Task<ActionResult<BotLinkResponse>> Link(
            [FromHeader(Name = "X-Bot-Secret")] string? botSecret,
            [FromBody] BotLinkRequest req,
            CancellationToken ct)
        {
            if (string.IsNullOrEmpty(botSecret) || botSecret != _cfg["Telegram:BotSecret"])
                return Unauthorized();

            var link = await _db.TelegramLinks.FirstOrDefaultAsync(x => x.LinkCode == req.Code, ct);
            if (link is null || link.CodeExpiresAtUtc is null || link.CodeExpiresAtUtc < DateTime.UtcNow)
                return BadRequest(new { error = "code_invalid_or_expired" });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == link.UserId, ct);
            if (user is null) return BadRequest(new { error = "user_not_found" });

            link.TelegramId = req.TelegramId;
            link.IsLinked = true;
            link.LinkCode = null;
            link.CodeExpiresAtUtc = null;

            // Регистрируем канал доставки, чтобы уведомления и рассылки уходили в Telegram (раздел 9.3).
            var channel = await _db.UserNotifications
                .FirstOrDefaultAsync(un => un.UserId == user.Id && un.Provider == "Telegram", ct);
            if (channel is null)
            {
                channel = new UserNotification { UserId = user.Id, Provider = "Telegram" };
                _db.UserNotifications.Add(channel);
            }
            channel.ProviderUserId = req.TelegramId.ToString();

            await _db.SaveChangesAsync(ct);

            // Долгоживущий JWT юзера для бота (30 дней)
            var jwt = JwtTokenFactory.Generate(user, _cfg, TimeSpan.FromDays(30));
            return Ok(new BotLinkResponse(jwt, user.Id, user.UserName));
        }
    }
}
