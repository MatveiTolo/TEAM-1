using CAESAR.Server.Models;

namespace CAESAR.Server.DTOs
{
    public class MoveTaskDto
    {
        public BoardTaskStatus targetTaskStatus { get; set; }
        public int NewPosition { get; set; }
    }
}
