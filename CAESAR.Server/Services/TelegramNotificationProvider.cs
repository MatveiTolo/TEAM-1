using System.Net.Http.Json;

namespace CAESAR.Server.Services
{
    // Отправляет сообщения в Telegram напрямую через Bot API sendMessage (раздел 9.3).
    // ProviderUserId — это telegram chat_id пользователя (сохраняется при /link).
    // Токен бота берётся из конфигурации: Telegram:BotToken.
    public sealed class TelegramNotificationProvider : INotificationProvider
    {
        private readonly IHttpClientFactory _httpFactory;
        private readonly IConfiguration _cfg;
        private readonly ILogger<TelegramNotificationProvider> _logger;

        public TelegramNotificationProvider(
            IHttpClientFactory httpFactory,
            IConfiguration cfg,
            ILogger<TelegramNotificationProvider> logger)
        {
            _httpFactory = httpFactory;
            _cfg = cfg;
            _logger = logger;
        }

        public string ProviderName => "Telegram";

        public async Task SendAsync(string providerUserId, string message)
        {
            var token = _cfg["Telegram:BotToken"];
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("Telegram:BotToken не задан — уведомление не отправлено.");
                return;
            }

            var client = _httpFactory.CreateClient();
            var url = $"https://api.telegram.org/bot{token}/sendMessage";

            // Первая попытка — с Markdown (жирный текст в интерактивных уведомлениях).
            var payload = new
            {
                chat_id = providerUserId,
                text = message,
                parse_mode = "Markdown",
                disable_web_page_preview = true
            };

            using (var resp = await client.PostAsJsonAsync(url, payload))
            {
                if (resp.IsSuccessStatusCode) return;

                var body = await resp.Content.ReadAsStringAsync();
                _logger.LogWarning("Telegram sendMessage (Markdown) {Status}: {Body}. Повтор без разметки.",
                    resp.StatusCode, body);
            }

            // Fallback: произвольный текст (заголовки задач могут содержать * _ [ ] и т.п.,
            // из-за чего Markdown-парсер Telegram отдаёт 400). Шлём как обычный текст.
            var plainPayload = new
            {
                chat_id = providerUserId,
                text = message,
                disable_web_page_preview = true
            };

            using var plainResp = await client.PostAsJsonAsync(url, plainPayload);
            if (!plainResp.IsSuccessStatusCode)
            {
                var body = await plainResp.Content.ReadAsStringAsync();
                _logger.LogError("Telegram sendMessage {Status}: {Body}", plainResp.StatusCode, body);
            }
        }
    }
}
