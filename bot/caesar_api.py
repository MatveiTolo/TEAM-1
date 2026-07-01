import httpx

from config import CAESAR_API_BASE, CAESAR_BOT_SECRET


class CaesarError(Exception):
    pass


class AuthExpired(CaesarError):
    """JWT истёк/невалиден — нужно перепривязать."""


async def link_telegram(code: str, telegram_id: int) -> dict:
    """Подтверждает одноразовый код, возвращает {jwt, userId, fullName}."""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{CAESAR_API_BASE}/api/telegram/link",
            headers={"X-Bot-Secret": CAESAR_BOT_SECRET},
            json={"code": code, "telegramId": telegram_id},
        )
        if r.status_code == 400:
            raise CaesarError("code_invalid_or_expired")
        r.raise_for_status()
        data = r.json()
        return {
            "jwt": data["jwt"],
            "user_id": str(data["userId"]),
            "full_name": data.get("userName") or data.get("fullName", ""),
        }


async def get_context(jwt: str) -> dict:
    """Тянет агрегированный контекст пользователя из CAESAR."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{CAESAR_API_BASE}/api/assistant/context",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        if r.status_code == 401:
            raise AuthExpired()
        r.raise_for_status()
        return r.json()
