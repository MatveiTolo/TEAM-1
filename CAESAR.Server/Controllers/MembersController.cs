using System.Security.Claims;
using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using CAESAR.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    // Управление участниками проекта и их ролями (Задача 6).
    // Роли распределяются по конкретным проектам через таблицу Members.
    [ApiController]
    [Route("api/projects/{projectId:int}/members")]
    [Authorize]
    public sealed class MembersController : ControllerBase
    {
        private readonly AppDbContext _db;
        public MembersController(AppDbContext db) => _db = db;

        private int CurrentUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(sub, out var id) ? id : 0;
        }

        // Список участников проекта (доступен любому участнику проекта)
        [HttpGet]
        public async Task<IActionResult> GetMembers(int projectId)
        {
            int me = CurrentUserId();
            if (me == 0) return Unauthorized();

            var isMember = await _db.Members.AnyAsync(m => m.ProjectId == projectId && m.UserId == me);
            if (!isMember) return Forbid();

            var members = await _db.Members
                .Where(m => m.ProjectId == projectId)
                .Select(m => new
                {
                    m.UserId,
                    Username = m.User!.UserName,
                    Email = m.User!.Email,
                    RoleId = m.Role,
                    RoleName = ((UserRole)m.Role).ToString(),
                    m.AllowedPageId
                })
                .ToListAsync();

            return Ok(members);
        }

        // Добавить участника по email
        [HttpPost]
        public async Task<IActionResult> AddMember(int projectId, AddMemberDto dto)
        {
            int me = CurrentUserId();
            if (me == 0) return Unauthorized();

            var actor = await _db.Members.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == me);
            if (actor == null || !ProjectPermissions.CanManageMembers(actor))
                return StatusCode(403, "Недостаточно прав для управления участниками.");

            if (dto.RoleId is < 1 or > 5) return BadRequest("Недопустимая роль.");
            // PageAdmin не может назначать GlobalAdmin
            if (ProjectPermissions.RoleOf(actor) == UserRole.PageAdmin && dto.RoleId == (int)UserRole.GlobalAdmin)
                return StatusCode(403, "Администратор страницы не может назначать главного администратора.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) return NotFound("Пользователь с таким email не зарегистрирован.");

            var exists = await _db.Members.AnyAsync(m => m.ProjectId == projectId && m.UserId == user.Id);
            if (exists) return BadRequest("Пользователь уже участник проекта.");

            var member = new Member
            {
                ProjectId = projectId,
                UserId = user.Id,
                Role = dto.RoleId,
                AllowedPageId = dto.AllowedPageId
            };
            _db.Members.Add(member);
            await _db.SaveChangesAsync();

            return Ok(new { member.UserId, RoleId = member.Role, RoleName = ((UserRole)member.Role).ToString(), member.AllowedPageId });
        }

        // Сменить роль/страницу участника
        [HttpPatch("{userId:int}")]
        public async Task<IActionResult> UpdateMember(int projectId, int userId, UpdateMemberDto dto)
        {
            int me = CurrentUserId();
            if (me == 0) return Unauthorized();

            var actor = await _db.Members.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == me);
            if (actor == null || !ProjectPermissions.CanManageMembers(actor))
                return StatusCode(403, "Недостаточно прав для управления участниками.");

            var target = await _db.Members.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId);
            if (target == null) return NotFound("Участник не найден.");

            // Нельзя понизить последнего GlobalAdmin
            if (ProjectPermissions.RoleOf(target) == UserRole.GlobalAdmin && dto.RoleId is int newRole && newRole != (int)UserRole.GlobalAdmin)
            {
                var admins = await _db.Members.CountAsync(m => m.ProjectId == projectId && m.Role == (int)UserRole.GlobalAdmin);
                if (admins <= 1) return BadRequest("Нельзя снять роль у единственного главного администратора.");
            }

            if (dto.RoleId is int r)
            {
                if (r is < 1 or > 5) return BadRequest("Недопустимая роль.");
                if (ProjectPermissions.RoleOf(actor) == UserRole.PageAdmin && r == (int)UserRole.GlobalAdmin)
                    return StatusCode(403, "Администратор страницы не может назначать главного администратора.");
                target.Role = r;
            }
            if (dto.AllowedPageId.HasValue)
                target.AllowedPageId = dto.AllowedPageId.Value == 0 ? null : dto.AllowedPageId.Value;

            await _db.SaveChangesAsync();
            return Ok(new { target.UserId, RoleId = target.Role, RoleName = ((UserRole)target.Role).ToString(), target.AllowedPageId });
        }

        // Удалить участника из проекта
        [HttpDelete("{userId:int}")]
        public async Task<IActionResult> RemoveMember(int projectId, int userId)
        {
            int me = CurrentUserId();
            if (me == 0) return Unauthorized();

            var actor = await _db.Members.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == me);
            if (actor == null || !ProjectPermissions.CanManageMembers(actor))
                return StatusCode(403, "Недостаточно прав для управления участниками.");

            var target = await _db.Members.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId);
            if (target == null) return NotFound("Участник не найден.");

            if (ProjectPermissions.RoleOf(target) == UserRole.GlobalAdmin)
            {
                var admins = await _db.Members.CountAsync(m => m.ProjectId == projectId && m.Role == (int)UserRole.GlobalAdmin);
                if (admins <= 1) return BadRequest("Нельзя удалить единственного главного администратора.");
            }

            _db.Members.Remove(target);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Участник удалён из проекта." });
        }
    }
}
