namespace CAESAR.Server.DTOs
{
    public class CreateTaskDto
    {
        public int ProjectPageId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public DateTime? Deadline { get; set; }
    }
}