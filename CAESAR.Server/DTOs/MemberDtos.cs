namespace CAESAR.Server.DTOs
{
    // Добавление участника в проект по email (регистрация обязательна заранее).
    public class AddMemberDto
    {
        public string Email { get; set; } = string.Empty;
        public int RoleId { get; set; }             // 1..5 (UserRole)
        public int? AllowedPageId { get; set; }     // ограничение по странице (для PageAdmin и т.п.)
    }

    // Изменение роли/страницы участника.
    public class UpdateMemberDto
    {
        public int? RoleId { get; set; }
        public int? AllowedPageId { get; set; }
    }
}
