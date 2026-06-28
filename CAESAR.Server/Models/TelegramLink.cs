// ============================================================
//  Сущность связки Telegram <-> User.
//  Добавить в AppDbContext: public DbSet<TelegramLink> TelegramLinks { get; set; }
//  Затем: dotnet ef migrations add AddTelegramLink && dotnet ef database update
// ============================================================
namespace CAESAR.Server.Models
{
    public class TelegramLink
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public long? TelegramId { get; set; }   // null пока не подтверждён

        public string? LinkCode { get; set; }
        public DateTime? CodeExpiresAtUtc { get; set; }
        public bool IsLinked { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}
