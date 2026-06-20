namespace CAESAR.Server.Models
{
    public class BoardTask
    {
        public int Id { get; set; }
        public int ProjectPageId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public int CreatedById { get; set; }
        public int? AssignedToId { get; set; }
        public TaskStatus Status { get; set; } = TaskStatus.Preparaion;
        public int Position { get; set; } = 0;
        public DateTime? Deadline { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Entity Framework
        public User? CreatedBy { get; set; }
        public User? AssignedTo { get; set; }
        public ProjectPage? ProjectPage { get; set; }
    }
}
