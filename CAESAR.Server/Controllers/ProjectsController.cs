using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
            var newProject = new Project
            {
                Name = dto.Name,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(newProject);

            await _context.SaveChangesAsync();

            var executionUser = await _context.Users.FindAsync(1);
            if (executionUser == null)
            {
                executionUser = new User
                {
                    Id = 1,
                    UserName = "Тестовый Админ",
                    Email = "admin@caesar.ru"
                };
                _context.Users.Add(executionUser);
                await _context.SaveChangesAsync(); // Сначала физически создаем пользователя в БД!
            }

            var memberNew = new Member
            {
                ProjectId = newProject.Id,
                UserId = 1,
                Role = (int)UserRole.GlobalAdmin
            };

            _context.Members.Add(memberNew);
            await _context.SaveChangesAsync();

            return Ok(newProject);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserProjects()
        {
            var projects = await _context.Members
                .Where(x => x.UserId == 1)
                .Select(x => new
                {
                    Id = x.ProjectId,
                    Name = x.Project!.Name,
                    Role = x.Role
                }).ToListAsync();

            return Ok(projects);
        }
    }
}
