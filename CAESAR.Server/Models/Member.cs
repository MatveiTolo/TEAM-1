namespace CAESAR.Server.Models
{
    public class Member
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        public int Role { get; set; }
        public int? AllowedPageId { get; set; }

        // Entity Framework
        public Project? Project { get; set; }
        public User? User { get; set; }
        // public Role? Role { get; set; }
        public ProjectPage? AllowedPage { get; set; }
    }
}
