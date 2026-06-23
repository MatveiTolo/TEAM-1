using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("page/{pageId}")]
        public async Task<IActionResult> GetTasksByPage(int pageId)
        {
            int currentUserId = 1; // TODO: Получать ID текущего пользователя из контекста аутентификации

            var page = await _context.ProjectPages.FindAsync(pageId);

            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var isMember = await _context.Members.AnyAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);

            if (!isMember) return Forbid();

            var tasks = await _context.BoardTasks
                .Where(t => t.ProjectPageId == pageId)
                .OrderBy(t => t.Position)
                .ToListAsync();

            return Ok(tasks);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(CreateTaskDto dto)
        {
            int currentUserId = 1; // TODO: Получать ID текущего пользователя из контекста аутентификации

            if (string.IsNullOrEmpty(dto.Title)) return BadRequest("Название задачи не может быть пустым");

            var page = await _context.ProjectPages.FindAsync(dto.ProjectPageId);

            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var Member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);

            if (Member == null) return StatusCode(403, "Bruh");//Forbid();

            if (Member.Role == 3 || Member.Role == 5) return BadRequest("У вас нет прав для создания задачи на этой странице"); //Forbid();

            /// Сдвиг задач
            var existingTasks = await _context.BoardTasks
                .Where(t => t.ProjectPageId == dto.ProjectPageId && (int)t.Status == 1)
                .ToListAsync();

            foreach (var task in existingTasks) task.Position += 1;

            var newTask = new BoardTask
            {
                ProjectPageId = dto.ProjectPageId,
                Title = dto.Title,
                Description = dto.Description,
                Status = BoardTaskStatus.Preparaion,
                Deadline = dto.Deadline,
                CreatedById = currentUserId
            };

            _context.BoardTasks.Add(newTask);
            await _context.SaveChangesAsync();

            return Ok(newTask);
        }

        [HttpPut("{id}/move")]
        public async Task<IActionResult> MoveTask(int id, MoveTaskDto dto)
        {
            int currentUserId = 1; // TODO: Получать ID текущего пользователя из контекста аутентификации

            var task = await _context.BoardTasks.FindAsync(id);

            if (task == null) return NotFound("Запрашиваемая задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);

            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var Member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);

            if (Member == null) return StatusCode(403, "Bruh");//Forbid();

            // Валидвция требований

            int statusDiff = Math.Abs((int)dto.targetTaskStatus - (int)task.Status);

            if (statusDiff != 1 && task.Status != dto.targetTaskStatus) return BadRequest("Невозможно переместить задачу в указанный статус");

            if (Member.Role == 4)
            {
                if (dto.targetTaskStatus == BoardTaskStatus.Done)
                {
                    return BadRequest("У вас нет прав для перемещения задачи в статус 'Выполнено'");
                }
                if (task.Status == BoardTaskStatus.Preparaion && dto.targetTaskStatus == BoardTaskStatus.Execution)
                {
                    return BadRequest("У вас нет прав для перемещения задачи");
                }
            }

            int oldPos = task.Position;

            if (task.Status != dto.targetTaskStatus)
            {
                // Перемещение задачи в другой статус

                var tasksToMoveUp = await _context.BoardTasks
                    .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == task.Status && t.Position > oldPos)
                    .ToListAsync();
                foreach (var t in tasksToMoveUp) t.Position--;

                var tasksToMoveDown = await _context.BoardTasks
                    .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == dto.targetTaskStatus && t.Position >= dto.NewPosition)
                    .ToListAsync();
                foreach (var t in tasksToMoveDown) t.Position++;

                task.Status = dto.targetTaskStatus;

            }
            else
            {
                // Перемещение задачи в пределах одного статуса

                if (oldPos < dto.NewPosition)
                {
                    var tasksBetween = await _context.BoardTasks
                        .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == task.Status && t.Position > oldPos && t.Position <= dto.NewPosition)
                        .ToListAsync();
                    foreach (var t in tasksBetween) t.Position--;
                }
                else
                {
                    var tasksBetween = await _context.BoardTasks
                        .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == task.Status && t.Position < oldPos && t.Position >= dto.NewPosition)
                        .ToListAsync();
                    foreach (var t in tasksBetween) t.Position++;
                }
            }

            task.Position = dto.NewPosition;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(task);
        }

    }
}
