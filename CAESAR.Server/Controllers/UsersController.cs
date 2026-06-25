using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UsersController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
        }

        [HttpPost("notification")]
        public async Task<IActionResult> BindNotifMessenger(BindNotifMessengerDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int currentUserId = int.Parse(userIdClaim!);

            if (string.IsNullOrWhiteSpace(dto.Provider) || string.IsNullOrWhiteSpace(dto.ProviderUserId)) return BadRequest("Оба поля должны быть заполнены");

            string provider = dto.Provider.ToLower().Trim();
            string providerId = dto.ProviderUserId.Trim();

            if (provider != "telegram") return BadRequest("Другие мессенджеры пока не доступны");

            var existingMessenger = await _context.UserNotifications
                .FirstOrDefaultAsync(mes => mes.UserId == currentUserId && mes.Provider == provider);

            if (existingMessenger != null)
            {
                existingMessenger.ProviderUserId = providerId;
                _context.UserNotifications.Update(existingMessenger);
                await _context.SaveChangesAsync();

                return Ok("Данные о месенжере обновлены");
            }

            var newMessenger = new UserNotification
            {
                UserId = currentUserId,
                Provider = provider,
                ProviderUserId = providerId
            };

            _context.UserNotifications.Add(newMessenger);
            await _context.SaveChangesAsync();

            return Ok($"Мессенджер {provider} привязан к вашему аккаунту");
        }
    }
}
