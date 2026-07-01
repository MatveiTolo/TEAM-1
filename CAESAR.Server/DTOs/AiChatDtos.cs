namespace CAESAR.Server.DTOs
{
    public class AiChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
    }

    public class AiChatResponseDto
    {
        public string Text { get; set; } = string.Empty;
    }
}
