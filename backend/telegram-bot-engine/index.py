import json
import os
import asyncio
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
import qrcode
from io import BytesIO

class BotStates(StatesGroup):
    main_menu = State()

def get_db_connection():
    '''Создает подключение к базе данных'''
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        raise Exception('DATABASE_URL not configured')
    return psycopg2.connect(database_url)

def get_active_bots() -> list:
    '''Получить все активные боты из БД'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = '''SELECT * FROM t_p5255237_telegram_bot_service.bots 
               WHERE status = 'active' AND moderation_status = 'approved' '''
    cursor.execute(query)
    bots = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(bot) for bot in bots]

def register_telegram_user(bot_id: int, user: types.User) -> int:
    '''Регистрирует пользователя Telegram в базе данных'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    username_escaped = (user.username or '').replace("'", "''")
    first_name_escaped = (user.first_name or '').replace("'", "''")
    last_name_escaped = (user.last_name or '').replace("'", "''")
    
    check_query = f'''SELECT id FROM t_p5255237_telegram_bot_service.bot_users 
                     WHERE bot_id = {bot_id} AND telegram_user_id = {user.id}'''
    cursor.execute(check_query)
    existing = cursor.fetchone()
    
    if existing:
        user_id = existing['id']
    else:
        insert_query = f'''INSERT INTO t_p5255237_telegram_bot_service.bot_users 
                          (bot_id, telegram_user_id, username, first_name, last_name)
                          VALUES ({bot_id}, {user.id}, '{username_escaped}', '{first_name_escaped}', '{last_name_escaped}')
                          RETURNING id'''
        cursor.execute(insert_query)
        user_id = cursor.fetchone()['id']
        conn.commit()
    
    cursor.close()
    conn.close()
    return user_id

def get_free_qr_key(bot_id: int, user_id: int) -> Optional[Dict]:
    '''Получить свободный бесплатный QR-ключ'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
               WHERE bot_id = {bot_id} AND code_type = 'free' AND is_used = false 
               ORDER BY code_number LIMIT 1'''
    cursor.execute(query)
    qr_code = cursor.fetchone()
    
    if qr_code:
        update_query = f'''UPDATE t_p5255237_telegram_bot_service.qr_codes 
                          SET is_used = true, used_by_user_id = {user_id}, used_at = CURRENT_TIMESTAMP 
                          WHERE id = {qr_code['id']}'''
        cursor.execute(update_query)
        conn.commit()
    
    cursor.close()
    conn.close()
    return dict(qr_code) if qr_code else None

def generate_qr_image(code_number: int) -> BytesIO:
    '''Генерирует QR-код как изображение'''
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f'POLYTOPE_KEY_{code_number}')
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    bio = BytesIO()
    img.save(bio, 'PNG')
    bio.seek(0)
    return bio

def create_main_menu_keyboard() -> ReplyKeyboardMarkup:
    '''Создает главное меню с кнопками'''
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🎁 Получить бесплатный ключ")],
            [KeyboardButton(text="🔐 Узнать про Тайную витрину")],
            [KeyboardButton(text="💎 Купить VIP-ключ")],
            [KeyboardButton(text="❓ Помощь")]
        ],
        resize_keyboard=True
    )
    return keyboard

async def cmd_start(message: types.Message, bot_id: int):
    '''Обработка команды /start'''
    user_id = register_telegram_user(bot_id, message.from_user)
    
    welcome_text = (
        "🚀 Привет! Я бот POLYTOPE.\n\n"
        "Здесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине "
        "на нашей закрытой распродаже с 21 по 23 ноября.\n\n"
        "Выберите действие:"
    )
    
    await message.answer(welcome_text, reply_markup=create_main_menu_keyboard())

async def handle_free_key(message: types.Message, bot_id: int):
    '''Обработка запроса бесплатного ключа'''
    user_id = register_telegram_user(bot_id, message.from_user)
    qr_key = get_free_qr_key(bot_id, user_id)
    
    if qr_key:
        qr_image = generate_qr_image(qr_key['code_number'])
        
        text = (
            f"✅ Ваш бесплатный ключ №{qr_key['code_number']}\n\n"
            f"Покажите этот QR-код на кассе:\n"
            f"• Участвуете в розыгрыше подарка\n"
            f"• Получаете право на участие в Чёрной пятнице"
        )
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔐 Что такое Тайная витрина?", callback_data="secret_shop")],
            [InlineKeyboardButton(text="💎 Купить VIP-ключ", callback_data="buy_vip")]
        ])
        
        await message.answer_photo(
            photo=types.BufferedInputFile(qr_image.read(), filename=f"key_{qr_key['code_number']}.png"),
            caption=text,
            reply_markup=keyboard
        )
    else:
        text = (
            "😔 Бесплатные ключи на сегодня закончились.\n\n"
            "Но вы всё ещё можете получить VIP-ключ и попасть в Тайную витрину!"
        )
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💎 Купить VIP-ключ", callback_data="buy_vip")]
        ])
        
        await message.answer(text, reply_markup=keyboard)

async def handle_secret_shop(message: types.Message):
    '''Информация о Тайной витрине'''
    text = (
        "🔐 Тайная витрина — это эксклюзивная закрытая распродажа!\n\n"
        "📅 Даты: 21-23 ноября\n"
        "💎 Доступ: Только с VIP-ключом\n"
        "🎁 Специальные предложения и скидки до 70%\n\n"
        "VIP-ключ открывает доступ к товарам, которых нет в обычном магазине."
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💎 Купить VIP-ключ", callback_data="buy_vip")]
    ])
    
    await message.answer(text, reply_markup=keyboard)

async def handle_buy_vip(message: types.Message):
    '''Обработка покупки VIP-ключа'''
    text = (
        "💎 VIP-ключ дает доступ к Тайной витрине!\n\n"
        "Стоимость: 500 ₽\n\n"
        "После оплаты вы получите VIP QR-код с номером от 501 до 1000.\n\n"
        "⚠️ Функция оплаты появится в следующей версии."
    )
    await message.answer(text)

async def handle_help(message: types.Message):
    '''Помощь пользователю'''
    text = (
        "❓ Как пользоваться ботом:\n\n"
        "🎁 Получить бесплатный ключ - выдает QR-код (номера 1-500)\n"
        "🔐 Узнать про Тайную витрину - информация о закрытой распродаже\n"
        "💎 Купить VIP-ключ - получить доступ к эксклюзивным товарам\n\n"
        "По всем вопросам пишите в поддержку."
    )
    await message.answer(text)

async def callback_handler(callback: types.CallbackQuery, bot_id: int):
    '''Обработчик inline кнопок'''
    if callback.data == "secret_shop":
        await handle_secret_shop(callback.message)
    elif callback.data == "buy_vip":
        await handle_buy_vip(callback.message)
    await callback.answer()

async def run_bot(bot_data: Dict):
    '''Запускает один Telegram бот'''
    bot = Bot(token=bot_data['telegram_token'])
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)
    bot_id = bot_data['id']
    
    @dp.message(Command("start"))
    async def start_handler(message: types.Message):
        await cmd_start(message, bot_id)
    
    @dp.message(F.text == "🎁 Получить бесплатный ключ")
    async def free_key_handler(message: types.Message):
        await handle_free_key(message, bot_id)
    
    @dp.message(F.text == "🔐 Узнать про Тайную витрину")
    async def secret_shop_handler(message: types.Message):
        await handle_secret_shop(message)
    
    @dp.message(F.text == "💎 Купить VIP-ключ")
    async def buy_vip_handler(message: types.Message):
        await handle_buy_vip(message)
    
    @dp.message(F.text == "❓ Помощь")
    async def help_handler(message: types.Message):
        await handle_help(message)
    
    @dp.callback_query()
    async def callback_handler_wrapper(callback: types.CallbackQuery):
        await callback_handler(callback, bot_id)
    
    print(f"✅ Bot '{bot_data['name']}' (ID: {bot_id}) started")
    await dp.start_polling(bot, skip_updates=True)

async def main():
    '''Главная функция - запускает все активные боты'''
    active_bots = get_active_bots()
    
    if not active_bots:
        print("⚠️ No active bots found in database")
        return
    
    print(f"🚀 Starting {len(active_bots)} bot(s)...")
    
    tasks = [run_bot(bot_data) for bot_data in active_bots]
    await asyncio.gather(*tasks)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Telegram bot engine - webhook endpoint for bot messages
    Args: event - cloud function event with Telegram webhook data
          context - cloud function context
    Returns: HTTP response
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Bot-Api-Secret-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        active_bots = get_active_bots()
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'active_bots': len(active_bots),
                'bots': [{'id': b['id'], 'name': b['name']} for b in active_bots]
            }),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        bot_id = body_data.get('bot_id')
        
        if not bot_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bot_id required'}),
                'isBase64Encoded': False
            }
        
        update = types.Update(**body_data.get('update', {}))
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        active_bots = get_active_bots()
        bot_data = next((b for b in active_bots if b['id'] == bot_id), None)
        
        if not bot_data:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Bot not found or inactive'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Update processed'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }