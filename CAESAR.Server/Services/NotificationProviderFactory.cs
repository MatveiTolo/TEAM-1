namespace CAESAR.Server.Services
{
    public class NotificationProviderFactory
    {
        private readonly IEnumerable<INotificationProvider> _providers;

        public NotificationProviderFactory(IEnumerable<INotificationProvider> providers)
        {
            _providers = providers;
        }

        public INotificationProvider GetProvider(string providerName)
        {
            var provider = _providers.FirstOrDefault(p =>
                p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));

            if (provider == null)
            {
                throw new NotSupportedException($"Мессенджер '{providerName}' пока не поддерживается системой CAESAR.");
            }

            return provider;
        }
    }
}
