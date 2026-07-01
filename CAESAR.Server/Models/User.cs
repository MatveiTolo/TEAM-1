namespace CAESAR.Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        // Дата регистрации пользователя (фиксируется один раз при создании аккаунта
        // и больше не меняется — не путать с датой последнего входа).
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Управление доступом уровня системы (панель супер-админа).
        public bool IsBlocked { get; set; } = false;
        public bool IsSuperAdmin { get; set; } = false;
    }
}
