namespace CAESAR.Server.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
