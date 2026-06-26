namespace CAESAR.Server.Services
{
    public interface INotificationProvider
    {
        string ProviderName { get; }
        Task SendAsync(string providerUserId, string message);
    }
}
