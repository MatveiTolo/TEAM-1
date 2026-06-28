// ============================================================
//  CAESAR — Эндпоинт контекста ассистента
//  GET /api/assistant/context   [Authorize]  (JWT юзера/бота)
//
//  Возвращает: проекты юзера + его роль/права + задачи, где он
//  создатель ИЛИ исполнитель, с историей. Это и есть "фишка" —
//  единый агрегированный контекст для GPT-4o.
//
//  Структура данных CAESAR: Project -> ProjectPage -> BoardTask.
//  Member связывает User <-> Project (роль + опц. AllowedPageId).
// ============================================================
using System.Security.Claims;
using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/assistant")]
    [Authorize]
    public sealed class AssistantController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AssistantController(AppDbContext db) => _db = db;

        [HttpGet("context")]
        public async Task<ActionResult<UserAssistantContextDto>> GetContext(CancellationToken ct)
        {
            // userId из JWT (AuthController кладёт ClaimTypes.NameIdentifier = user.Id)
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var user = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => new UserBriefDto { Id = u.Id, UserName = u.UserName, Email = u.Email })
                .FirstOrDefaultAsync(ct);
            if (user is null) return Unauthorized();

            // 1) Членства юзера в проектах
            var memberships = await _db.Members
                .Where(m => m.UserId == userId)
                .Select(m => new { m.ProjectId, m.Role, m.AllowedPageId })
                .ToListAsync(ct);

            var projectIds = memberships.Select(m => m.ProjectId).Distinct().ToList();
            if (projectIds.Count == 0)
                return Ok(new UserAssistantContextDto { User = user, Projects = new() });

            // 2) Проекты
            var projects = await _db.Projects
                .Where(p => projectIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name, p.Theme })
                .ToListAsync(ct);

            // 3) Страницы этих проектов (нужны для маппинга задача->проект и имени доски)
            var pages = await _db.ProjectPages
                .Where(p => projectIds.Contains(p.ProjectId))
                .Select(p => new { p.Id, p.ProjectId, p.Name })
                .ToListAsync(ct);

            var pageMap = pages.ToDictionary(p => p.Id, p => p);
            var pageIds = pages.Select(p => p.Id).ToList();

            // 4) Задачи, где юзер создатель ИЛИ исполнитель
            var tasksRaw = await _db.BoardTasks
                .Where(t => pageIds.Contains(t.ProjectPageId) &&
                            (t.CreatedById == userId || t.AssignedToId == userId))
                .Select(t => new
                {
                    t.Id,
                    t.ProjectPageId,
                    t.Title,
                    t.Description,
                    t.Status,
                    t.Position,
                    t.Deadline,
                    t.CreatedAt,
                    t.UpdatedAt,
                    t.CreatedById,
                    CreatedByName = t.CreatedBy != null ? t.CreatedBy.UserName : "",
                    t.AssignedToId,
                    AssignedToName = t.AssignedTo != null ? t.AssignedTo.UserName : ""
                })
                .ToListAsync(ct);

            var taskIds = tasksRaw.Select(t => t.Id).ToList();

            // 5) История по этим задачам
            var historyRaw = await _db.TaskHistories
                .Where(h => taskIds.Contains(h.TaskId))
                .OrderBy(h => h.CreatedAt)
                .Select(h => new
                {
                    h.TaskId,
                    h.CreatedAt,
                    ChangedBy = h.User != null ? h.User.UserName : "",
                    h.ActionType,
                    h.StatusBefore,
                    h.StatusAfter,
                    h.Details
                })
                .ToListAsync(ct);

            var historyByTask = historyRaw
                .GroupBy(h => h.TaskId)
                .ToDictionary(g => g.Key, g => g.Select(h => new TaskHistoryEntryDto
                {
                    AtUtc = h.CreatedAt,
                    ChangedBy = h.ChangedBy,
                    ActionType = h.ActionType,
                    StatusBefore = h.StatusBefore.ToString(),
                    StatusAfter = h.StatusAfter.ToString(),
                    Details = h.Details
                }).ToList());

            // 6) Сборка задач по проектам (через страницу)
            var tasksByProject = tasksRaw
                .Where(t => pageMap.ContainsKey(t.ProjectPageId))
                .GroupBy(t => pageMap[t.ProjectPageId].ProjectId)
                .ToDictionary(g => g.Key, g => g.Select(t => new TaskContextDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    PageId = t.ProjectPageId,
                    PageName = pageMap[t.ProjectPageId].Name,
                    Status = t.Status.ToString(),
                    Position = t.Position,
                    Deadline = t.Deadline,
                    CreatedAtUtc = t.CreatedAt,
                    UpdatedAtUtc = t.UpdatedAt,
                    CreatedBy = new PersonDto { Id = t.CreatedById, UserName = t.CreatedByName },
                    Assignee = t.AssignedToId is int aid
                        ? new PersonDto { Id = aid, UserName = t.AssignedToName } : null,
                    UserRelation =
                        (t.CreatedById == userId && t.AssignedToId == userId) ? "creator+assignee"
                        : t.CreatedById == userId ? "creator"
                        : "assignee",
                    History = historyByTask.TryGetValue(t.Id, out var h) ? h : new()
                }).ToList());

            // 7) Финальная сборка
            var result = new UserAssistantContextDto
            {
                User = user,
                GeneratedAtUtc = DateTime.UtcNow,
                Projects = memberships
                    .GroupBy(m => m.ProjectId)
                    .Select(g =>
                    {
                        var m = g.First();
                        var proj = projects.FirstOrDefault(p => p.Id == m.ProjectId);
                        var role = (UserRole)m.Role;
                        return new ProjectContextDto
                        {
                            Id = m.ProjectId,
                            Name = proj?.Name ?? "",
                            Theme = proj?.Theme,
                            Role = role.ToString(),
                            Permissions = RolePermissions.For(role),
                            AllowedPageId = m.AllowedPageId,
                            Tasks = tasksByProject.TryGetValue(m.ProjectId, out var tt) ? tt : new()
                        };
                    })
                    .ToList()
            };

            return Ok(result);
        }
    }
}
