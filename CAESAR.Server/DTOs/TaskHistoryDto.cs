namespace CAESAR.Server.DTOs
{
    public class TaskHistoryDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string StatusBeforeName { get; set; } = string.Empty;
        public string StatusAfterName { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
