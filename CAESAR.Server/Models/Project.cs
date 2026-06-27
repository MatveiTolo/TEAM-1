namespace CAESAR.Server.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Theme { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
