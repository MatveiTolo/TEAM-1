using CAESAR.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CAESAR.Server.Controllers
{
    // Справочная таблица ролей (roles) из документации — для выпадающих списков на клиенте.
    [ApiController]
    [Route("api/roles")]
    [Authorize]
    public sealed class RolesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetRoles()
        {
            var roles = new[]
            {
                new { id = (int)UserRole.GlobalAdmin, name = "GlobalAdmin",  title = "Главный администратор" },
                new { id = (int)UserRole.PageAdmin,   name = "PageAdmin",    title = "Администратор страницы" },
                new { id = (int)UserRole.Developer,   name = "Developer",    title = "Разработчик" },
                new { id = (int)UserRole.Tester,      name = "Tester",       title = "Тестировщик" },
                new { id = (int)UserRole.Viewer,      name = "Viewer",       title = "Наблюдатель" },
            };
            return Ok(roles);
        }
    }
}
