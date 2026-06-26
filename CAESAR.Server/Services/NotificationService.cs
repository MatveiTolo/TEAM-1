using CAESAR.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace CAESAR.Server.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _appDbContext;
        private readonly NotificationProviderFactory _factory;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            AppDbContext appDbContext,
            NotificationProviderFactory factory,
            ILogger<NotificationService> logger)
        {
            _appDbContext = appDbContext;
            _factory = factory;
            _logger = logger;
        }

        public async Task SendToUserAsync(int userId, string message)
        {
            var channels = await _appDbContext.UserNotifications
                .Where(un =>  un.UserId == userId)
                .ToListAsync();
            if (!channels.Any())
            {
                _logger.LogInformation("У пользователя нет подключенных мессенджеров для отправки уведомлений");
                return;
            }

            foreach (var channel in channels)
            {
                try
                {
                    var provider = _factory.GetProvider(channel.Provider);
                    await provider.SendAsync(channel.ProviderUserId, message);
                    _logger.LogInformation($"Уведомление для {userId} успешно отправлено");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"ошиька при отправке уведомления для User {userId} через провайдер {channel.Provider}");
                }
            }
        }
    }
}
