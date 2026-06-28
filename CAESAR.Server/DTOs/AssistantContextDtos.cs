// ============================================================
//  CAESAR — DTO контекста ассистента (уходит боту -> в GPT-4o)
//  Под реальную модель CAESAR.Server.
// ============================================================
namespace CAESAR.Server.DTOs
{
    public sealed class UserAssistantContextDto
    {
        public UserBriefDto User { get; set; } = default!;
        public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
        public List<ProjectContextDto> Projects { get; set; } = new();
    }

    public sealed class UserBriefDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = "";
        public string Email { get; set; } = "";
    }

    public sealed class ProjectContextDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string? Theme { get; set; }

        // Роль и выведенные из неё права ИМЕННО этого пользователя
        public string Role { get; set; } = "";                 // GlobalAdmin/PageAdmin/Developer/Tester/Viewer
        public List<string> Permissions { get; set; } = new(); // выведены из роли
        public int? AllowedPageId { get; set; }                // ограничение по странице, если задано

        // Только задачи, где пользователь — создатель ИЛИ исполнитель
        public List<TaskContextDto> Tasks { get; set; } = new();
    }

    public sealed class TaskContextDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }

        public int PageId { get; set; }
        public string PageName { get; set; } = "";

        public string Status { get; set; } = "";   // Preparaion/Execution/Testing/Done
        public int Position { get; set; }
        public DateTime? Deadline { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public PersonDto? Assignee { get; set; }    // кто исполняет (AssignedTo)
        public PersonDto? CreatedBy { get; set; }   // кто создал/назначил

        public string UserRelation { get; set; } = ""; // "assignee" | "creator" | "creator+assignee"

        public List<TaskHistoryEntryDto> History { get; set; } = new();
    }

    public sealed class PersonDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = "";
    }

    public sealed class TaskHistoryEntryDto
    {
        public DateTime AtUtc { get; set; }
        public string ChangedBy { get; set; } = "";       // UserName автора изменения
        public string ActionType { get; set; } = "";      // тип действия
        public string StatusBefore { get; set; } = "";    // имя статуса до
        public string StatusAfter { get; set; } = "";     // имя статуса после
        public string Details { get; set; } = "";
    }
}
