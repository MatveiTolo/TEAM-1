namespace CAESAR.Server.DTOs
{
    public class CreateProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Theme { get; set; }
    }
}
