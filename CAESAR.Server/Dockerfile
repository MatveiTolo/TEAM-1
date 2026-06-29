# syntax=docker/dockerfile:1
# ----------------------------------------------------------------------------
# CAESAR.Server — облачный образ (ASP.NET 10 + собранный React-клиент в wwwroot)
# Собирает фронтенд (Vite) и бэкенд в одном образе. Слушает $PORT (по умолчанию 8080),
# что совместимо с Render / Railway / Fly.io / Google Cloud Run / DigitalOcean Apps.
# ----------------------------------------------------------------------------

# ---- Базовый рантайм ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

# ---- SDK + Node для сборки сервера и клиента ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Кэшируем restore: сначала только манифесты проектов
COPY ["CAESAR.Server/CAESAR.Server.csproj", "CAESAR.Server/"]
COPY ["caesar.client/caesar.client.esproj", "caesar.client/"]
COPY ["caesar.client/package.json", "caesar.client/"]
RUN dotnet restore "CAESAR.Server/CAESAR.Server.csproj"

# Остальной исходный код
COPY . .

# Публикация (во время publish esproj собирает клиент и кладёт его в wwwroot)
WORKDIR "/src/CAESAR.Server"
RUN dotnet publish "CAESAR.Server.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    /p:UseAppHost=false

# ---- Финальный образ ----
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

# Прод-настройки по умолчанию; реальные секреты приходят через переменные окружения.
ENV ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    ASPNETCORE_HTTP_PORTS=8080

# Непривилегированный пользователь (образ aspnet содержит пользователя app, uid 1654)
USER $APP_UID

# Слушаем $PORT, если платформа его задаёт (Render/Railway/Cloud Run), иначе 8080.
ENTRYPOINT ["/bin/sh", "-c", "export ASPNETCORE_HTTP_PORTS=${PORT:-8080}; exec dotnet CAESAR.Server.dll"]
