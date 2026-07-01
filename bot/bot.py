import asyncio
import logging
from datetime import datetime, timezone

from aiogram import Bot, Dispatcher, F
from aiogram.filters import Command, CommandObject
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    BotCommand,
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

import db
import ai
import caesar_api
from config import BOT_TOKEN

logging.basicConfig(level=logging.INFO)

bot = Bot(BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# Канбан-статусы (enum BoardTaskStatus на бэкенде).
STATUS_RU = {1: "Преподготовка", 2: "Выполнение", 3: "Тестирование", 4: "Готово"}
NAME_TO_INT = {"Preparaion": 1, "Execution": 2, "Testing": 3, "Done": 4}


class NewTask(StatesGroup):
    waiting_title = State()


def _require_jwt(message: Message) -> str | None:
    jwt = db.get_jwt(message.from_user.id)
    if not jwt:
        return None
    return jwt


def _move_keyboard(task_id: int, current: int) -> InlineKeyboardMarkup:
    """Кнопки перемещения на соседние колонки (раздел 9.1: интерактивное управление)."""
    row = []
    if current - 1 >= 1:
        row.append(InlineKeyboardButton(
            text=f"← {STATUS_RU[current - 1]}",
            callback_data=f"move:{task_id}:{current - 1}",
        ))
    if current + 1 <= 4:
        row.append(InlineKeyboardButton(
            text=f"→ {STATUS_RU[current + 1]}",
            callback_data=f"move:{task_id}:{current + 1}",
        ))
    return InlineKeyboardMarkup(inline_keyboard=[row] if row else [])


# ---------------------------------------------------------------------------
# Базовые команды
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Меню бота (раздел 9: понятная навигация без эмодзи)
# ---------------------------------------------------------------------------
# Персистентный список команд (кнопка «Меню» рядом с полем ввода).
BOT_COMMANDS = [
    BotCommand(command="menu", description="Что умеет бот — список возможностей"),
    BotCommand(command="tasks", description="Мои задачи по проектам"),
    BotCommand(command="status", description="Карточка задачи по номеру + управление"),
    BotCommand(command="new", description="Создать задачу"),
    BotCommand(command="report", description="Сводка по статусам задач"),
    BotCommand(command="link", description="Привязать аккаунт CAESAR по коду"),
    BotCommand(command="unlink", description="Отвязать аккаунт"),
    BotCommand(command="help", description="Краткая справка по командам"),
]

# Единый текст меню-путеводителя (без эмодзи).
MENU_TEXT = (
    "Меню CAESAR\n"
    "\n"
    "Я связываю Telegram с вашими досками CAESAR: показываю задачи, "
    "двигаю их по колонкам, шлю уведомления и отвечаю на вопросы по проектам.\n"
    "\n"
    "Начало работы\n"
    "/link КОД — привязать аккаунт (код берётся на сайте, кнопка «Подключить Telegram»)\n"
    "/unlink — отвязать аккаунт\n"
    "\n"
    "Задачи\n"
    "/tasks — все задачи, где вы автор или исполнитель, сгруппированы по проектам\n"
    "/status ID — карточка одной задачи (статус, доска, исполнитель, дедлайн) с кнопками перемещения по колонкам\n"
    "/new — создать задачу пошагово\n"
    "\n"
    "Аналитика\n"
    "/report — сколько задач в каждой колонке: Преподготовка, Выполнение, Тестирование, Готово\n"
    "\n"
    "Уведомления приходят автоматически\n"
    "— супер-админу проекта: о новых задачах и досках\n"
    "— исполнителю: когда дедлайн сегодня или уже просрочен\n"
    "— ежедневный отчёт: супер-админу по проекту, остальным — краткая сводка\n"
    "\n"
    "Вопрос своими словами\n"
    "Напишите обычным текстом — отвечу ИИ по данным ваших проектов "
    "(например: «что горит по срокам на этой неделе?»)."
)


@dp.message(Command("start"))
async def cmd_start(message: Message):
    linked = db.get_jwt(message.from_user.id) is not None
    if linked:
        await message.answer(
            "С возвращением. Открой /menu — там все возможности. "
            "Быстрые команды: /tasks, /new, /report."
        )
    else:
        await message.answer(
            "Привет. Я ассистент CAESAR.\n"
            "\n"
            "Чтобы начать:\n"
            "1. На сайте CAESAR нажми «Подключить Telegram» — получишь код.\n"
            "2. Пришли его сюда: /link КОД\n"
            "\n"
            "После привязки открой /menu — покажу, что умею."
        )


@dp.message(Command("menu"))
async def cmd_menu(message: Message):
    await message.answer(MENU_TEXT)


@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "Команды:\n"
        "/menu — что умеет бот, с пояснениями\n"
        "/tasks — все твои задачи\n"
        "/status ID — задача по номеру + кнопки перемещения\n"
        "/report — отчёт по статусам\n"
        "/new — создать задачу\n"
        "/link КОД — привязать аккаунт\n"
        "/unlink — отвязать аккаунт\n"
        "\n"
        "Или просто задай вопрос текстом — отвечу по данным твоих проектов."
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
    await message.answer(f"Готово, {name}. Аккаунт привязан. Задавай вопрос или жми /tasks.")


@dp.message(Command("unlink"))
async def cmd_unlink(message: Message, state: FSMContext):
    await state.clear()
    db.delete_link(message.from_user.id)
    await message.answer("Привязка удалена.")


# ---------------------------------------------------------------------------
# /tasks — список задач пользователя
# ---------------------------------------------------------------------------
@dp.message(Command("tasks"))
async def cmd_tasks(message: Message):
    jwt = _require_jwt(message)
    if not jwt:
        await message.answer("Сначала привяжи аккаунт: /link КОД.")
        return
    try:
        context = await caesar_api.get_context(jwt)
    except caesar_api.AuthExpired:
        db.delete_link(message.from_user.id)
        await message.answer("Сессия истекла. Перепривяжи: /link КОД.")
        return
    except Exception:
        logging.exception("tasks failed")
        await message.answer("Не удалось получить данные из CAESAR.")
        return

    lines: list[str] = []
    for proj in context.get("projects", []):
        tasks = proj.get("tasks", [])
        if not tasks:
            continue
        lines.append(f"*{proj.get('name', 'Проект')}*")
        for t in tasks:
            st = STATUS_RU.get(NAME_TO_INT.get(t.get("status", ""), 0), t.get("status", ""))
            dl = t.get("deadline")
            dl_s = f" · до {dl[:10]}" if dl else ""
            lines.append(f"  #{t['id']} {t['title']} — _{st}_{dl_s}")
        lines.append("")

    if not lines:
        await message.answer("У тебя пока нет задач, где ты создатель или исполнитель.")
        return
    await message.answer("\n".join(lines).strip(), parse_mode="Markdown")


# ---------------------------------------------------------------------------
# /status ID — карточка задачи + интерактивные кнопки
# ---------------------------------------------------------------------------
@dp.message(Command("status"))
async def cmd_status(message: Message, command: CommandObject):
    jwt = _require_jwt(message)
    if not jwt:
        await message.answer("Сначала привяжи аккаунт: /link КОД.")
        return

    arg = (command.args or "").strip()
    if not arg.isdigit():
        await message.answer("Формат: /status ID (например, /status 42)")
        return
    task_id = int(arg)

    try:
        task = await caesar_api.get_task(jwt, task_id)
    except caesar_api.AuthExpired:
        db.delete_link(message.from_user.id)
        await message.answer("Сессия истекла. Перепривяжи: /link КОД.")
        return
    except caesar_api.CaesarError as e:
        await message.answer("Задача не найдена или нет доступа." if "not_found" in str(e)
                             else "Нет доступа к этой задаче.")
        return
    except Exception:
        logging.exception("status failed")
        await message.answer("Ошибка запроса задачи.")
        return

    current = NAME_TO_INT.get(task.get("status", ""), 0)
    dl = task.get("deadline")
    text = (
        f"*#{task['id']} {task['title']}*\n"
        f"Статус: {task.get('statusName') or STATUS_RU.get(current, '—')}\n"
        f"Доска: {task.get('pageName', '—')}\n"
        f"Исполнитель: {task.get('assigneeName') or 'не назначен'}\n"
        f"Дедлайн: {dl[:10] if dl else 'не задан'}"
    )
    kb = _move_keyboard(task_id, current) if current else None
    await message.answer(text, parse_mode="Markdown", reply_markup=kb)


@dp.callback_query(F.data.startswith("move:"))
async def on_move(cb: CallbackQuery):
    jwt = db.get_jwt(cb.from_user.id)
    if not jwt:
        await cb.answer("Привяжи аккаунт: /link КОД.", show_alert=True)
        return

    try:
        _, sid, starget = cb.data.split(":")
        task_id, target = int(sid), int(starget)
    except ValueError:
        await cb.answer("Некорректная кнопка.")
        return

    try:
        await caesar_api.move_task(jwt, task_id, target, 0)
    except caesar_api.AuthExpired:
        db.delete_link(cb.from_user.id)
        await cb.answer("Сессия истекла. /link КОД.", show_alert=True)
        return
    except caesar_api.CaesarError:
        await cb.answer("Так перемещать нельзя (только в соседнюю колонку).", show_alert=True)
        return
    except Exception:
        logging.exception("move failed")
        await cb.answer("Ошибка перемещения.", show_alert=True)
        return

    await cb.answer(f"Перемещено в «{STATUS_RU[target]}»")
    try:
        base = cb.message.text.split("\n")[0]
        await cb.message.edit_text(
            f"{base}\nСтатус: {STATUS_RU[target]}",
            parse_mode="Markdown",
            reply_markup=_move_keyboard(task_id, target),
        )
    except Exception:
        pass


# ---------------------------------------------------------------------------
# /report — сводка по статусам
# ---------------------------------------------------------------------------
@dp.message(Command("report"))
async def cmd_report(message: Message):
    jwt = _require_jwt(message)
    if not jwt:
        await message.answer("Сначала привяжи аккаунт: /link КОД.")
        return
    try:
        context = await caesar_api.get_context(jwt)
    except caesar_api.AuthExpired:
        db.delete_link(message.from_user.id)
        await message.answer("Сессия истекла. Перепривяжи: /link КОД.")
        return
    except Exception:
        logging.exception("report failed")
        await message.answer("Не удалось получить данные из CAESAR.")
        return

    counts = {1: 0, 2: 0, 3: 0, 4: 0}
    total = 0
    for proj in context.get("projects", []):
        for t in proj.get("tasks", []):
            code = NAME_TO_INT.get(t.get("status", ""), 0)
            if code:
                counts[code] += 1
                total += 1

    await message.answer(
        "*Отчёт по задачам*\n"
        f"Всего: {total}\n"
        f"— Преподготовка: {counts[1]}\n"
        f"— Выполнение: {counts[2]}\n"
        f"— Тестирование: {counts[3]}\n"
        f"— Готово: {counts[4]}",
        parse_mode="Markdown",
    )


# ---------------------------------------------------------------------------
# /new — создание задачи (пошагово)
# ---------------------------------------------------------------------------
@dp.message(Command("new"))
async def cmd_new(message: Message, state: FSMContext):
    jwt = _require_jwt(message)
    if not jwt:
        await message.answer("Сначала привяжи аккаунт: /link КОД.")
        return
    await state.set_state(NewTask.waiting_title)
    await message.answer("Название новой задачи? (или /cancel)")


@dp.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    if await state.get_state() is not None:
        await state.clear()
        await message.answer("Отменено.")


@dp.message(NewTask.waiting_title, F.text & ~F.text.startswith("/"))
async def new_task_title(message: Message, state: FSMContext):
    title = message.text.strip()
    await state.clear()
    jwt = db.get_jwt(message.from_user.id)
    if not jwt:
        await message.answer("Сессия потеряна. /link КОД.")
        return
    try:
        page_id = await caesar_api.first_page_id(jwt)
        if page_id is None:
            await message.answer("Не найдено ни одной доски. Создай проект на сайте.")
            return
        task = await caesar_api.create_task(jwt, page_id, title)
    except caesar_api.AuthExpired:
        db.delete_link(message.from_user.id)
        await message.answer("Сессия истекла. Перепривяжи: /link КОД.")
        return
    except Exception:
        logging.exception("create_task failed")
        await message.answer("Не удалось создать задачу.")
        return
    await message.answer(f"Создана задача #{task['id']} «{task['title']}» в колонке «Преподготовка».")


# ---------------------------------------------------------------------------
# Свободный вопрос → ИИ-ассистент (раздел 9.4)
# ---------------------------------------------------------------------------
@dp.message(F.text & ~F.text.startswith("/"))
async def on_question(message: Message):
    jwt = _require_jwt(message)
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

    if len(reply) <= 4096:
        await thinking.edit_text(reply)
    else:
        await thinking.edit_text(reply[:4096])
        for i in range(4096, len(reply), 4096):
            await message.answer(reply[i:i + 4096])


async def main():
    db.init()
    # Регистрируем меню команд бота (кнопка «Меню» в интерфейсе Telegram).
    await bot.set_my_commands(BOT_COMMANDS)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
