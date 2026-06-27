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
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject(CreateProjectDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            var newProject = new Project
            {
                Name = dto.Name,
                Theme = dto.Theme,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(newProject);

            await _context.SaveChangesAsync();

            var memberNew = new Member
            {
                ProjectId = newProject.Id,
                UserId = currentUserId,
                Role = (int)UserRole.GlobalAdmin
            };

            _context.Members.Add(memberNew);
            await _context.SaveChangesAsync();

            return Ok(newProject);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserProjects()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            var projects = await _context.Members
                .Where(x => x.UserId == currentUserId)
                .Select(x => new
                {
                    Id = x.ProjectId,
                    Name = x.Project!.Name,
                    Theme = x.Project!.Theme,
                    CreatedAt = x.Project!.CreatedAt,
                    Role = x.Role,
                    TasksCount = _context.ProjectPages
                        .Where(p => p.ProjectId == x.ProjectId)
                        .SelectMany(p => _context.BoardTasks.Where(t => t.ProjectPageId == p.Id))
                        .Count()
                }).ToListAsync();

            return Ok(projects);
        }
    }
}
