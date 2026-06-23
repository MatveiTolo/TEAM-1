using System.Text.Json.Serialization;

namespace CAESAR.Server.Models
{
    public class ProjectPage
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;

        // Entity Framework
        [JsonIgnore]
        public Project? Project { get; set; }
    }
}
