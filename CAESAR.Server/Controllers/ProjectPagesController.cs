using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectPagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectPagesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePage(CreatePageDto dto)
        {
            int currentUserId = 1;

            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Название страницы не может быть пустой");

            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.ProjectId == dto.ProjectId && m.UserId == currentUserId);

            if (member == null || (member.Role != (int)UserRole.GlobalAdmin && member.Role != (int)UserRole.PageAdmin)) return StatusCode(403, "bruh");//Forbid();

            var newPage = new ProjectPage
            {
                ProjectId = dto.ProjectId,
                Name = dto.Name
            };

            _context.ProjectPages.Add(newPage);
            await _context.SaveChangesAsync();


            return Ok(newPage);
        }

        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetPagesByProject(int projectId)
        {
            int currentUserId = 1;

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