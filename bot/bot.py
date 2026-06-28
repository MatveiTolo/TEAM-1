import asyncio
import logging
from datetime import datetime, timezone

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandObject
from aiogram.types import Message

import db
import ai
import caesar_api
from config import BOT_TOKEN

logging.basicConfig(level=logging.INFO)

bot = Bot(BOT_TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "Привет. Я ассистент CAESAR.\n\n"
        "1. На сайте CAESAR нажми «Подключить Telegram» — получишь код.\n"
        "2. Пришли его сюда: /link КОД\n\n"
        "После привязки просто задавай вопросы по своим проектам и задачам."
    )


@dp.message(Command("link"))
async def cmd_link(message: Message, command: CommandObject):
    code = (command.args or "").strip()
    if not code:
        await message.answer("Формат: /link КОД (код с сайта CAESAR)")
        return
    try:
        data = await caesar_api.link_telegram(code, message.from_user.id)
    except caesar_api.CaesarError:
        await message.answer("Код неверный или истёк. Сгенерируй новый на сайте.")
        return
    except Exception:
        logging.exception("link failed")
        await message.answer("Ошибка связи с CAESAR. Попробуй позже.")
        return

    db.save_link(message.from_user.id, data["user_id"], data["full_name"], data["jwt"])
    name = data["full_name"] or "пользователь"
    await message.answer(f"Готово, {name}. Аккаунт привязан. Задавай вопрос.")


@dp.message(Command("unlink"))
async def cmd_unlink(message: Message):
    db.delete_link(message.from_user.id)
    await message.answer("Привязка удалена.")


@dp.message(F.text & ~F.text.startswith("/"))
async def on_question(message: Message):
    jwt = db.get_jwt(message.from_user.id)
    if not jwt:
        await message.answer("Сначала привяжи аккаунт: /link КОД (код с сайта).")
        return

    thinking = await message.answer("Думаю…")
    try:
        context = await caesar_api.get_context(jwt)
    except caesar_api.AuthExpired:
        db.delete_link(message.from_user.id)
        await thinking.edit_text("Сессия истекла. Перепривяжи аккаунт: /link КОД.")
        return
    except Exception:
        logging.exception("get_context failed")
        await thinking.edit_text("Не удалось получить данные из CAESAR.")
        return

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        reply = await ai.answer(message.text, context, now_iso)
    except Exception:
        logging.exception("ai failed")
        await thinking.edit_text("Ошибка генерации ответа.")
        return

    # Telegram лимит 4096 символов
    if len(reply) <= 4096:
        await thinking.edit_text(reply)
    else:
        await thinking.edit_text(reply[:4096])
        for i in range(4096, len(reply), 4096):
            await message.answer(reply[i:i + 4096])


async def main():
    db.init()
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
