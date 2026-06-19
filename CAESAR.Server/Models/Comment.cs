namespace CAESAR.Server.Models
{
    public class Comment
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Entity Framework
        public User? User { get; set; }
        public BoardTask? Boardtask { get; set; }

    }
}
