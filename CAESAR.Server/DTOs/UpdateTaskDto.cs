namespace CAESAR.Server.DTOs
{
    public class UpdateTaskDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public int? AssignedToId { get; set; }
    }
}
