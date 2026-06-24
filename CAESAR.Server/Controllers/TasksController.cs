using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

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
            var oldStatus = task.Status;

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

            // Запись истории изменений

            if (oldPos != dto.NewPosition || oldStatus != dto.targetTaskStatus)
            {
                var history = new BoardTaskHistory
                {
                    TaskId = task.Id,
                    UserId = currentUserId,
                    ActionType = "Перемещена",
                    StatusBefore = oldStatus,
                    StatusAfter = dto.targetTaskStatus,
                    Details = oldStatus != dto.targetTaskStatus
                        ? $"Перенесена из колонки '{GetStatusName(oldStatus)}' в '{GetStatusName(dto.targetTaskStatus)}' на позицию {dto.NewPosition}."
                        : $"Перемещена внутри колонки '{GetStatusName(task.Status)}' с позиции {oldPos} на {dto.NewPosition}.",
                    CreatedAt = DateTime.UtcNow
                };

                _context.TaskHistories.Add(history);
            }

            await _context.SaveChangesAsync();

            return Ok(task);
        }

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetTaskHistory(int id)
        {
            var taskExist = await _context.BoardTasks.AnyAsync(t => t.Id == id);
            if (!taskExist) return NotFound("Задача не найдена");

            var history = await _context.TaskHistories
                .Include(h => h.User)
                .Where(h => h.TaskId == id)
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new TaskHistoryDto
                {
                    Id = h.Id,
                    Username = h.User != null ? h.User.UserName : "Система",
                    ActionType = h.ActionType,
                    StatusBeforeName = GetStatusName(h.StatusBefore),
                    StatusAfterName = GetStatusName(h.StatusAfter),
                    Details = h.Details,
                    CreatedAt = h.CreatedAt
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, CreateCommentDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized("Не удалось определить пользователя из токена.");
            int currentUserId = int.Parse(userIdClaim);

            if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest("Текст комментария не может быть пустым");

            var task = await _context.BoardTasks.FindAsync(id);
            if (task == null) return NotFound("Задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.ProjectId == page!.ProjectId && m.UserId == currentUserId);

            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта");
            if (member.Role == (int)UserRole.Viewer) return StatusCode(403, "Наблюдатели не могут оставлять комментарии");

            var nextComment = new Comment
            {
                TaskId = task.Id,
                UserId = currentUserId,
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow
            };
            _context.Comments.Add(nextComment);

            var history = new BoardTaskHistory
            {
                TaskId = task.Id,
                UserId = currentUserId,
                ActionType = "Комментарий",
                StatusBefore = task.Status, // Статус не менялся пишем текущий
                StatusAfter = task.Status,
                Details = "Добавлен новый комментарий к задаче.",
                CreatedAt = DateTime.UtcNow
            };
            _context.TaskHistories.Add(history);

            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(currentUserId);

            var responeDto = new CommentDto
            {
                Id = nextComment.Id,
                TaskId = nextComment.TaskId,
                Username = user?.UserName ?? "Пользователь",
                Text = nextComment.Text,
                CreatedAt = nextComment.CreatedAt
            };

            return Ok(responeDto);
        }

        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetTaskComments(int id)
        {
            var taskExists = await _context.BoardTasks.AnyAsync(t => t.Id == id);
            if (!taskExists)
            {
                return NotFound("Задача не найдена.");
            }

            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.TaskId == id)
                .OrderBy(c => c.CreatedAt) // Старые комментарии показываем сверху | новые внизу (как в чате)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    TaskId = c.TaskId,
                    Username = c.User != null ? c.User.UserName : "Пользователь",
                    Text = c.Text,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(comments);
        }


        // Может привести к утечке памяти? уточнить.
        private static string GetStatusName(BoardTaskStatus status)
        {
            return status switch
            {
                BoardTaskStatus.Preparaion => "Преподготовка",
                BoardTaskStatus.Execution => "Выполнение",
                BoardTaskStatus.Testing => "Тестирование",
                BoardTaskStatus.Done => "Готово",
                _ => "Неизвестно"
            };
        }
    }
}
