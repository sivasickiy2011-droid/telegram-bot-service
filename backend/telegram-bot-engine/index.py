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
    waiting_for_last_name = State()
    waiting_for_first_name = State()
    waiting_for_phone = State()

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

async def handle_secret_shop(message: types.Message, bot_id: int = None):
    '''Информация о Тайной витрине'''
    
    custom_text = None
    if bot_id:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            query = f"SELECT secret_shop_text FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id}"
            cursor.execute(query)
            bot_data = cursor.fetchone()
            cursor.close()
            conn.close()
            if bot_data and bot_data.get('secret_shop_text'):
                custom_text = bot_data['secret_shop_text']
        except:
            pass
    
    text = custom_text or (
        "🔐 Тайная витрина — это эксклюзивная закрытая распродажа!\n\n"
        "📅 Даты: 21-23 ноября\n"
        "💎 Доступ: Только с VIP-ключом\n"
        "🎁 Специальные предложения и скидки до 70%\n\n"
        "VIP-ключ открывает доступ к товарам, которых нет в обычном магазине.\n\n"
        "✨ Что вас ждёт в Тайной витрине:\n"
        "• Эксклюзивные товары\n"
        "• Ограниченные коллекции\n"
        "• Скидки до 70%\n"
        "• Приоритетное обслуживание\n\n"
        "Количество VIP-ключей ограничено!"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💎 Купить VIP-ключ", callback_data="buy_vip")],
        [InlineKeyboardButton(text="🔙 В главное меню", callback_data="main_menu")]
    ])
    
    await message.answer(text, reply_markup=keyboard)

async def handle_buy_vip(message: types.Message, bot_id: int, state: FSMContext):
    '''Обработка покупки VIP-ключа - показывает информацию и запускает форму'''
    
    # Получаем данные бота из БД
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'''SELECT payment_enabled, vip_price, tbank_terminal_key, tbank_password,
                       vip_promo_enabled, vip_promo_start_date, vip_promo_end_date,
                       vip_purchase_message
                FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id}'''
    cursor.execute(query)
    bot_data = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not bot_data or not bot_data.get('payment_enabled'):
        text = (
            "💎 VIP-ключ дает доступ к Тайной витрине!\n\n"
            "⚠️ Оплата временно недоступна. Обратитесь к администратору."
        )
        await message.answer(text)
        return
    
    vip_price = bot_data.get('vip_price', 500)
    terminal_key = bot_data.get('tbank_terminal_key')
    password = bot_data.get('tbank_password')
    vip_purchase_message = bot_data.get('vip_purchase_message', 'VIP-ключ открывает доступ к эксклюзивным материалам и привилегиям.')
    
    if not terminal_key or not password:
        text = (
            "💎 VIP-ключ дает доступ к Тайной витрине!\n\n"
            "⚠️ Оплата не настроена. Обратитесь к администратору."
        )
        await message.answer(text)
        return
    
    # Формируем текст с информацией
    text = f"{vip_purchase_message}\n\n"
    text += f"💰 Цена: {vip_price} ₽\n"
    
    # Добавляем даты если включено
    if bot_data.get('vip_promo_enabled') and bot_data.get('vip_promo_start_date') and bot_data.get('vip_promo_end_date'):
        from datetime import datetime
        start_date = bot_data['vip_promo_start_date']
        end_date = bot_data['vip_promo_end_date']
        
        # Форматируем даты
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
            
        text += f"📅 Даты действия: {start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')}\n"
    
    # Кнопки
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Оплатить VIP-ключ", callback_data="start_payment_form")],
        [InlineKeyboardButton(text="⬅ Вернуться назад", callback_data="main_menu")]
    ])
    
    # Сохраняем данные в state для последующей оплаты
    await state.update_data(
        bot_id=bot_id,
        vip_price=vip_price,
        terminal_key=terminal_key,
        password=password
    )
    
    await message.answer(text, reply_markup=keyboard)

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

async def start_payment_form(callback: types.CallbackQuery, state: FSMContext):
    '''Начало заполнения формы для оплаты'''
    await callback.message.answer("📝 Введите вашу *Фамилию*:", parse_mode='Markdown')
    await state.set_state(BotStates.waiting_for_last_name)
    await callback.answer()

async def process_last_name(message: types.Message, state: FSMContext):
    '''Обработка ввода фамилии'''
    await state.update_data(last_name=message.text)
    await message.answer("📝 Введите ваше *Имя*:", parse_mode='Markdown')
    await state.set_state(BotStates.waiting_for_first_name)

async def process_first_name(message: types.Message, state: FSMContext):
    '''Обработка ввода имени'''
    await state.update_data(first_name=message.text)
    await message.answer("📝 Введите ваш *Телефон*:", parse_mode='Markdown')
    await state.set_state(BotStates.waiting_for_phone)

async def process_phone_and_create_payment(message: types.Message, state: FSMContext):
    '''Обработка телефона и создание платежа'''
    user_data = await state.get_data()
    last_name = user_data.get('last_name')
    first_name = user_data.get('first_name')
    phone = message.text
    
    bot_id = user_data.get('bot_id')
    vip_price = user_data.get('vip_price')
    terminal_key = user_data.get('terminal_key')
    password = user_data.get('password')
    
    # Создаём платёж
    try:
        import urllib.request
        import urllib.error
        
        user_id = message.from_user.id
        order_id = f'vip_{bot_id}_{user_id}_{int(asyncio.get_event_loop().time())}'
        
        payment_data = {
            'terminal_key': terminal_key,
            'password': password,
            'amount': vip_price * 100,
            'order_id': order_id,
            'description': f'VIP-ключ для {first_name} {last_name}',
            'payment_method': 'card',
            'success_url': 'https://t.me',
            'fail_url': 'https://t.me',
            'phone': phone,
            'email': f'{user_id}@telegram.user'
        }
        
        req = urllib.request.Request(
            'https://functions.poehali.dev/99bbc805-8eab-41cb-89c3-b0dd02989907',
            data=json.dumps(payment_data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('success') and result.get('payment_url'):
                payment_url = result['payment_url']
                
                text = (
                    f"✅ Данные получены!\n\n"
                    f"👤 ФИО: {first_name} {last_name}\n"
                    f"📱 Телефон: {phone}\n\n"
                    f"💳 Нажмите кнопку для оплаты:"
                )
                
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="💳 Оплатить", url=payment_url)]
                ])
                
                await message.answer(text, reply_markup=keyboard)
                await state.clear()
            else:
                error_msg = result.get('error', 'Неизвестная ошибка')
                await message.answer(f"⚠️ Ошибка создания платежа: {error_msg}")
                await state.clear()
                
    except Exception as e:
        await message.answer(f"⚠️ Ошибка при создании платежа: {str(e)}")
        await state.clear()

async def callback_handler(callback: types.CallbackQuery, bot_id: int, state: FSMContext):
    '''Обработчик inline кнопок'''
    if callback.data == "secret_shop":
        await handle_secret_shop(callback.message, bot_id)
    elif callback.data == "buy_vip":
        await handle_buy_vip(callback.message, bot_id, state)
    elif callback.data == "start_payment_form":
        await start_payment_form(callback, state)
    elif callback.data == "main_menu":
        await cmd_start(callback.message, bot_id)
        await state.clear()
    await callback.answer()

async def run_bot(bot_data: Dict):
    '''Запускает один Telegram бот'''
    bot = Bot(token=bot_data['telegram_token'])
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)
    bot_id = bot_data['id']
    
    @dp.message(Command("start"))
    async def start_handler(message: types.Message, state: FSMContext):
        await cmd_start(message, bot_id)
        await state.clear()
    
    @dp.message(F.text == "🎁 Получить бесплатный ключ")
    async def free_key_handler(message: types.Message):
        await handle_free_key(message, bot_id)
    
    @dp.message(F.text == "🔐 Узнать про Тайную витрину")
    async def secret_shop_handler(message: types.Message):
        await handle_secret_shop(message, bot_id)
    
    @dp.message(F.text == "💎 Купить VIP-ключ")
    async def buy_vip_handler(message: types.Message, state: FSMContext):
        await handle_buy_vip(message, bot_id, state)
    
    @dp.message(F.text == "❓ Помощь")
    async def help_handler(message: types.Message):
        await handle_help(message)
    
    @dp.message(BotStates.waiting_for_last_name)
    async def last_name_handler(message: types.Message, state: FSMContext):
        await process_last_name(message, state)
    
    @dp.message(BotStates.waiting_for_first_name)
    async def first_name_handler(message: types.Message, state: FSMContext):
        await process_first_name(message, state)
    
    @dp.message(BotStates.waiting_for_phone)
    async def phone_handler(message: types.Message, state: FSMContext):
        await process_phone_and_create_payment(message, state)
    
    @dp.callback_query()
    async def callback_handler_wrapper(callback: types.CallbackQuery, state: FSMContext):
        await callback_handler(callback, bot_id, state)
    
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
        body_str = event.get('body', '{}') or '{}'
        body_data = json.loads(body_str) if body_str else {}
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