namespace CAESAR.Server.Services
{
    public interface INotificationService
    {
        Task SendToUserAsync(int userId, string message);
    }
}