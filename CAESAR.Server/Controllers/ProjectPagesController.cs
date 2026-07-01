using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using CAESAR.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectPagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public ProjectPagesController(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePage(CreatePageDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Название страницы не может быть пустой");

            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.ProjectId == dto.ProjectId && m.UserId == currentUserId);

            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта.");
            if (!Services.ProjectPermissions.CanCreatePage(member)) return StatusCode(403, "Только администратор может создавать доски.");

            var newPage = new ProjectPage
            {
                ProjectId = dto.ProjectId,
                Name = dto.Name
            };

            _context.ProjectPages.Add(newPage);
            await _context.SaveChangesAsync();

            // Уведомляем супер-админов проекта (кроме создателя) о новой доске.
            var adminIds = await _context.Members
                .Where(m => m.ProjectId == dto.ProjectId
                            && m.Role == (int)UserRole.GlobalAdmin
                            && m.UserId != currentUserId)
                .Select(m => m.UserId)
                .ToListAsync();

            if (adminIds.Count > 0)
            {
                var creator = await _context.Users.FindAsync(currentUserId);
                var creatorName = creator?.UserName ?? "участник";
                var message = "Новая доска в проекте\n" +
                              $"«{newPage.Name}»\n" +
                              $"Создал: {creatorName}";
                foreach (var adminId in adminIds)
                {
                    try { await _notificationService.SendToUserAsync(adminId, message); }
                    catch { /* best-effort */ }
                }
            }

            return Ok(newPage);
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetPagesByProject(int projectId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            var isMember = await _context.Members
                .AnyAsync(m => m.ProjectId == projectId && m.UserId == currentUserId);

            if (!isMember) return Forbid();

            var pages = await _context.ProjectPages
                .Where(p => p.ProjectId == projectId)
                .ToListAsync();

            return Ok(pages);
        }
    }
}