using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
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

        public ProjectPagesController(AppDbContext context)
        {
            _context = context;
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