//  Вывод прав из роли (UserRole). Отдельной таблицы прав в
//  CAESAR нет, поэтому права выводим из enum-роли — чтобы GPT
//  мог отвечать на вопросы вида "могу ли я переместить задачу".
//  Коды правь под реальную логику доступа проекта.
using CAESAR.Server.Models;

namespace CAESAR.Server.DTOs
{
    public static class RolePermissions
    {
        public static List<string> For(UserRole role) => role switch
        {
            UserRole.GlobalAdmin => new()
            {
                "project.manage", "page.manage", "member.manage",
                "task.create", "task.edit", "task.delete", "task.move", "task.assign", "comment.create"
            },
            UserRole.PageAdmin => new()
            {
                "page.manage", "member.manage",
                "task.create", "task.edit", "task.delete", "task.move", "task.assign", "comment.create"
            },
            UserRole.Developer => new()
            {
                "task.create", "task.edit", "task.move", "comment.create"
            },
            UserRole.Tester => new()
            {
                "task.move", "comment.create"
            },
            UserRole.Viewer => new()
            {
                "task.read", "comment.read"
            },
            _ => new() { "task.read" }
        };
    }
}
