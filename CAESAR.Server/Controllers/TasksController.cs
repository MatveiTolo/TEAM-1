using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using CAESAR.Server.Services;
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
        private readonly INotificationService _notificationService;

        public TasksController(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        private int CurrentUserId()
        {
            var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(sub, out var id) ? id : 0;
        }

        // PostgreSQL 'timestamp with time zone' принимает только DateTime с Kind=Utc.
        // Клиент шлёт дедлайн как дату без зоны (Kind=Unspecified) — раньше это валило PATCH в 500.
        // Приводим к UTC: Unspecified трактуем как UTC-полночь выбранного дня, Local конвертируем.
        private static DateTime? ToUtc(DateTime? value) => value switch
        {
            null => null,
            { Kind: DateTimeKind.Utc } d => d,
            { Kind: DateTimeKind.Local } d => d.ToUniversalTime(),
            { } d => DateTime.SpecifyKind(d, DateTimeKind.Utc)
        };

        // Задачи одной страницы (доски)
        [HttpGet("page/{pageId}")]
        public async Task<IActionResult> GetTasksByPage(int pageId)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            var page = await _context.ProjectPages.FindAsync(pageId);
            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);
            if (member == null) return Forbid();
            if (!ProjectPermissions.CanAccessPage(member, pageId)) return StatusCode(403, "Нет доступа к этой странице.");

            var tasks = await _context.BoardTasks
                .Where(t => t.ProjectPageId == pageId)
                .OrderBy(t => t.Position)
                .ToListAsync();

            return Ok(tasks);
        }

        // Задача 4: все задачи проекта (по всем его страницам) — для календаря и отчётов.
        // Раньше эти экраны грузили только страницу №1, из-за чего инфо проекта «пропадала».
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetTasksByProject(int projectId)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == currentUserId);
            if (member == null) return Forbid();

            var pageIdsQuery = _context.ProjectPages.Where(p => p.ProjectId == projectId);

            // Участник с ограничением по странице видит только её.
            if (ProjectPermissions.RoleOf(member) != UserRole.GlobalAdmin && member.AllowedPageId is int allowed)
                pageIdsQuery = pageIdsQuery.Where(p => p.Id == allowed);

            var pageIds = await pageIdsQuery.Select(p => p.Id).ToListAsync();

            var tasks = await _context.BoardTasks
                .Where(t => pageIds.Contains(t.ProjectPageId))
                .OrderBy(t => t.ProjectPageId).ThenBy(t => t.Position)
                .ToListAsync();

            return Ok(tasks);
        }

        // Одна задача по id (для команды бота /status {id}). Доступ — только участнику проекта.
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            var task = await _context.BoardTasks.FindAsync(id);
            if (task == null) return NotFound("Запрашиваемая задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);
            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);
            if (member == null) return Forbid();
            if (!ProjectPermissions.CanAccessPage(member, task.ProjectPageId)) return StatusCode(403, "Нет доступа к этой странице.");

            var assigneeName = task.AssignedToId is int aid
                ? (await _context.Users.FindAsync(aid))?.UserName
                : null;

            return Ok(new
            {
                task.Id,
                task.Title,
                task.Description,
                Status = task.Status.ToString(),
                StatusName = GetStatusName(task.Status),
                task.Deadline,
                task.AssignedToId,
                AssigneeName = assigneeName,
                PageName = page.Name
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(CreateTaskDto dto)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            if (string.IsNullOrEmpty(dto.Title)) return BadRequest("Название задачи не может быть пустым");

            var page = await _context.ProjectPages.FindAsync(dto.ProjectPageId);
            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);
            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта.");
            if (!ProjectPermissions.CanAccessPage(member, dto.ProjectPageId)) return StatusCode(403, "Нет доступа к этой странице.");
            if (!ProjectPermissions.CanCreateTask(member)) return StatusCode(403, "Ваша роль не позволяет создавать задачи.");

            // Сдвигаем существующие задачи в колонке «Преподготовка» вниз — новая встаёт наверх.
            var existingTasks = await _context.BoardTasks
                .Where(t => t.ProjectPageId == dto.ProjectPageId && t.Status == BoardTaskStatus.Preparaion)
                .ToListAsync();
            foreach (var task in existingTasks) task.Position += 1;

            var newTask = new BoardTask
            {
                ProjectPageId = dto.ProjectPageId,
                Title = dto.Title,
                Description = dto.Description,
                Status = BoardTaskStatus.Preparaion,
                Position = 0,
                Deadline = ToUtc(dto.Deadline),
                CreatedById = currentUserId
            };

            _context.BoardTasks.Add(newTask);
            await _context.SaveChangesAsync();

            _context.TaskHistories.Add(new BoardTaskHistory
            {
                TaskId = newTask.Id,
                UserId = currentUserId,
                ActionType = "Создана",
                StatusBefore = BoardTaskStatus.Preparaion,
                StatusAfter = BoardTaskStatus.Preparaion,
                Details = "Задача создана.",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(newTask);
        }

        [HttpPut("{id}/move")]
        public async Task<IActionResult> MoveTask(int id, MoveTaskDto dto)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            var task = await _context.BoardTasks.FindAsync(id);
            if (task == null) return NotFound("Запрашиваемая задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);
            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);
            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта.");
            if (!ProjectPermissions.CanAccessPage(member, task.ProjectPageId)) return StatusCode(403, "Нет доступа к этой странице.");

            // Единая валидация перемещения (соседство + правила роли).
            var moveError = ProjectPermissions.ValidateMove(member, task.Status, dto.targetTaskStatus);
            if (moveError != null) return BadRequest(moveError);

            int oldPos = task.Position;
            var oldStatus = task.Status;

            if (task.Status != dto.targetTaskStatus)
            {
                // Перемещение в другую колонку: закрываем «дыру» в старой, раздвигаем целевую.
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
                // Реордер внутри одной колонки (Задача 2).
                if (oldPos < dto.NewPosition)
                {
                    var between = await _context.BoardTasks
                        .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == task.Status && t.Position > oldPos && t.Position <= dto.NewPosition)
                        .ToListAsync();
                    foreach (var t in between) t.Position--;
                }
                else
                {
                    var between = await _context.BoardTasks
                        .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == task.Status && t.Position < oldPos && t.Position >= dto.NewPosition)
                        .ToListAsync();
                    foreach (var t in between) t.Position++;
                }
            }

            task.Position = dto.NewPosition;
            task.UpdatedAt = DateTime.UtcNow;

            if (oldPos != dto.NewPosition || oldStatus != dto.targetTaskStatus)
            {
                _context.TaskHistories.Add(new BoardTaskHistory
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
                });
            }

            await _context.SaveChangesAsync();

            if (oldStatus != dto.targetTaskStatus)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        string messageText = $"🔔 **Уведомление CAESAR**\n" +
                                             $"Задача #{task.Id} \"{task.Title}\" изменила статус!\n" +
                                             $"Новый статус: *{GetStatusName(dto.targetTaskStatus)}*.\n" +
                                             $"Пожалуйста, проверьте изменения на доске.";
                        await _notificationService.SendToUserAsync(task.CreatedById, messageText);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Сбой отправки пуша: {ex.Message}");
                    }
                });
            }

            return Ok(task);
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateTask(int id, UpdateTaskDto dto)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            var task = await _context.BoardTasks.FindAsync(id);
            if (task == null) return NotFound("Запрашиваемая задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);
            if (page == null) return NotFound("Запрашиваемая страница не найдена");

            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page.ProjectId && m.UserId == currentUserId);
            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта");
            if (!ProjectPermissions.CanAccessPage(member, task.ProjectPageId)) return StatusCode(403, "Нет доступа к этой странице.");
            if (!ProjectPermissions.CanEditTask(member)) return StatusCode(403, "Наблюдатели не могут редактировать задачи");

            var changes = new List<string>();

            if (dto.Title != null && dto.Title != task.Title)
            {
                changes.Add($"название → '{dto.Title}'");
                task.Title = dto.Title;
            }
            if (dto.Description != null && dto.Description != task.Description)
            {
                changes.Add("обновлено описание");
                task.Description = dto.Description;
            }
            if (dto.Deadline != task.Deadline)
            {
                var newDeadline = ToUtc(dto.Deadline);
                changes.Add(newDeadline.HasValue ? $"дедлайн → {newDeadline.Value:dd.MM.yyyy}" : "дедлайн снят");
                task.Deadline = newDeadline;
            }
            if (dto.AssignedToId != task.AssignedToId)
            {
                changes.Add(dto.AssignedToId.HasValue ? $"назначен исполнитель #{dto.AssignedToId}" : "исполнитель снят");
                task.AssignedToId = dto.AssignedToId;
            }

            if (changes.Count == 0) return Ok(task);

            task.UpdatedAt = DateTime.UtcNow;
            _context.TaskHistories.Add(new BoardTaskHistory
            {
                TaskId = task.Id,
                UserId = currentUserId,
                ActionType = "Изменена",
                StatusBefore = task.Status,
                StatusAfter = task.Status,
                Details = "Задача отредактирована: " + string.Join(", ", changes) + ".",
                CreatedAt = DateTime.UtcNow
            });

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
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest("Текст комментария не может быть пустым");

            var task = await _context.BoardTasks.FindAsync(id);
            if (task == null) return NotFound("Задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);
            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page!.ProjectId && m.UserId == currentUserId);

            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта");
            if (!ProjectPermissions.CanComment(member)) return StatusCode(403, "Наблюдатели не могут оставлять комментарии");

            var nextComment = new Comment
            {
                TaskId = task.Id,
                UserId = currentUserId,
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow
            };
            _context.Comments.Add(nextComment);

            _context.TaskHistories.Add(new BoardTaskHistory
            {
                TaskId = task.Id,
                UserId = currentUserId,
                ActionType = "Комментарий",
                StatusBefore = task.Status,
                StatusAfter = task.Status,
                Details = "Добавлен новый комментарий к задаче.",
                CreatedAt = DateTime.UtcNow
            });

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
            if (!taskExists) return NotFound("Задача не найдена.");

            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.TaskId == id)
                .OrderBy(c => c.CreatedAt)
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBoardTask(int id)
        {
            int currentUserId = CurrentUserId();
            if (currentUserId == 0) return Unauthorized("Не удалось определить пользователя из токена.");

            var task = await _context.BoardTasks.FindAsync(id);
            if (task == null) return NotFound("Задача не найдена");

            var page = await _context.ProjectPages.FindAsync(task.ProjectPageId);
            var member = await _context.Members.FirstOrDefaultAsync(m => m.ProjectId == page!.ProjectId && m.UserId == currentUserId);

            if (member == null) return StatusCode(403, "Вы не являетесь участником проекта");
            if (!ProjectPermissions.CanAccessPage(member, task.ProjectPageId)) return StatusCode(403, "Нет доступа к этой странице.");
            if (!ProjectPermissions.CanDeleteTask(member)) return StatusCode(403, "Ваша роль не позволяет удалять задачи.");

            var tasksToMoveUp = await _context.BoardTasks
                .Where(t => t.ProjectPageId == task.ProjectPageId && t.Status == task.Status && t.Position > task.Position)
                .ToListAsync();
            foreach (var t in tasksToMoveUp) t.Position--;

            _context.BoardTasks.Remove(task);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Задача {id} успешно удалена из системы" });
        }

        private static string GetStatusName(BoardTaskStatus status) => status switch
        {
            BoardTaskStatus.Preparaion => "Преподготовка",
            BoardTaskStatus.Execution => "Выполнение",
            BoardTaskStatus.Testing => "Тестирование",
            BoardTaskStatus.Done => "Готово",
            _ => "Неизвестно"
        };
    }
}
