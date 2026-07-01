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

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    Id = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    IsSuperAdmin = u.IsSuperAdmin,
                    Status = u.IsBlocked ? "blocked" : "active",
                    ProjectCount = _context.Members.Count(m => m.UserId == u.Id)
                })
                .ToListAsync();

            return Ok(users);
        }

        // Является ли текущий вызывающий супер-админом системы (для админ-панели).
        private async Task<bool> IsCallerSuperAdminAsync()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(idClaim, out var callerId)) return false;
            var caller = await _context.Users.FindAsync(callerId);
            return caller?.IsSuperAdmin == true;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            var user = await _context.Users.FindAsync(currentUserId);
            if (user == null) return NotFound("Пользователь не найден");

            var projectsCount = await _context.Members.CountAsync(m => m.UserId == currentUserId);

            return Ok(new
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                ProjectsCount = projectsCount,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            var user = await _context.Users.FindAsync(currentUserId);
            if (user == null) return NotFound("Пользователь не найден");

            if (!string.IsNullOrWhiteSpace(dto.UserName)) user.UserName = dto.UserName;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email
            });
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            // Редактировать чужой аккаунт может только супер-админ (панель /admin).
            if (!await IsCallerSuperAdminAsync()) return StatusCode(403, "Требуются права супер-администратора.");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.UserName)) user.UserName = dto.UserName;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;

            await _context.SaveChangesAsync();
            return Ok(new { user.Id, Username = user.UserName, user.Email, Status = user.IsBlocked ? "blocked" : "active" });
        }

        // Блокировка / разблокировка пользователя (панель супер-админа).
        [HttpPost("{id}/block")]
        public async Task<IActionResult> BlockUser(int id)
        {
            if (!await IsCallerSuperAdminAsync()) return StatusCode(403, "Требуются права супер-администратора.");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            if (user.IsSuperAdmin) return BadRequest("Нельзя заблокировать супер-администратора.");

            user.IsBlocked = true;
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, Status = "blocked" });
        }

        [HttpPost("{id}/unblock")]
        public async Task<IActionResult> UnblockUser(int id)
        {
            if (!await IsCallerSuperAdminAsync()) return StatusCode(403, "Требуются права супер-администратора.");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.IsBlocked = false;
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, Status = "active" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (!await IsCallerSuperAdminAsync()) return StatusCode(403, "Требуются права супер-администратора.");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            if (user.IsSuperAdmin) return BadRequest("Нельзя удалить супер-администратора.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Пользователь удалён." });
        }
    }
}
