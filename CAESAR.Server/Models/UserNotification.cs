using System.Text.Json.Serialization;

namespace CAESAR.Server.Models
{
    public class UserNotification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Provider { get; set; } = string.Empty;
        public string ProviderUserId { get; set; } = string.Empty;

        // Entity Framework
        [JsonIgnore]
        public User? User { get; set; }
    }
}
