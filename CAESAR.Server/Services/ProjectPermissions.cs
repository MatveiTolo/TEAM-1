using CAESAR.Server.Models;

namespace CAESAR.Server.Services
{
    // Централизованная проверка прав участника проекта.
    // Раньше проверки были размазаны по контроллерам «магическими» числами
    // (Role == 3 || Role == 5). Теперь единый источник правды.
    public static class ProjectPermissions
    {
        public static UserRole RoleOf(Member m) => (UserRole)m.Role;

        // GlobalAdmin видит весь проект. Остальные с заданным AllowedPageId
        // ограничены своей страницей (доской).
        public static bool CanAccessPage(Member m, int pageId)
        {
            if (RoleOf(m) == UserRole.GlobalAdmin) return true;
            if (m.AllowedPageId is int allowed) return allowed == pageId;
            return true; // страница не ограничена — доступ к любой странице проекта
        }

        public static bool CanCreateTask(Member m)
        {
            var r = RoleOf(m);
            // Разработчик и Наблюдатель не создают задачи (см. Таблицу 6 док-ии).
            return r is UserRole.GlobalAdmin or UserRole.PageAdmin or UserRole.Tester;
        }

        public static bool CanEditTask(Member m) => RoleOf(m) != UserRole.Viewer;

        public static bool CanDeleteTask(Member m)
        {
            var r = RoleOf(m);
            return r is UserRole.GlobalAdmin or UserRole.PageAdmin;
        }

        public static bool CanComment(Member m) => RoleOf(m) != UserRole.Viewer;

        // Управление участниками/страницами/приглашениями.
        public static bool CanManageMembers(Member m)
        {
            var r = RoleOf(m);
            return r is UserRole.GlobalAdmin or UserRole.PageAdmin;
        }

        public static bool CanCreatePage(Member m)
        {
            var r = RoleOf(m);
            return r is UserRole.GlobalAdmin or UserRole.PageAdmin;
        }

        // Проверка легальности перемещения по канбану с учётом роли.
        // Возвращает null если разрешено, иначе текст ошибки.
        public static string? ValidateMove(Member m, BoardTaskStatus from, BoardTaskStatus to)
        {
            int diff = System.Math.Abs((int)to - (int)from);
            if (from != to && diff != 1)
                return "Нельзя перепрыгивать через колонку — только на соседнюю.";

            if (RoleOf(m) == UserRole.Tester)
            {
                // Тестировщик: только Выполнение ↔ Тестирование ↔ (не Готово).
                if (to == BoardTaskStatus.Done)
                    return "Тестировщик не может переводить задачу в 'Готово'.";
                if (from == BoardTaskStatus.Preparaion && to == BoardTaskStatus.Execution)
                    return "Тестировщик не может двигать задачу из 'Преподготовки'.";
            }
            if (RoleOf(m) == UserRole.Viewer)
                return "Наблюдатель не может перемещать задачи.";

            return null;
        }
    }
}
