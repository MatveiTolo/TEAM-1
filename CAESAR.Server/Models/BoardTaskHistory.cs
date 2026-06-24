namespace CAESAR.Server.Models
{
    public class BoardTaskHistory
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public BoardTaskStatus StatusBefore { get; set; }
        public BoardTaskStatus StatusAfter { get; set; }
        public string Details { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Entity Framework
        public User? User { get; set; }
        public BoardTask? BoardTask { get; set; }
    }
}
