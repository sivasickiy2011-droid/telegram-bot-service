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
    browsing_catalog = State()
    viewing_product = State()
    in_cart = State()
    checkout_address = State()
    checkout_phone = State()
    warehouse_selecting_date = State()
    warehouse_selecting_time = State()
    warehouse_entering_phone = State()
    warehouse_entering_company = State()
    warehouse_entering_vehicle = State()
    warehouse_entering_cargo = State()

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

def get_free_qr_key(bot_id: int, user_id: int, telegram_user_id: int = None) -> Optional[Dict]:
    '''Получить свободный бесплатный QR-ключ'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    is_user_admin = is_admin(bot_id, telegram_user_id) if telegram_user_id else False
    
    if is_user_admin:
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
                   WHERE bot_id = {bot_id} AND code_type = 'free'
                   ORDER BY code_number LIMIT 1'''
    else:
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
                   WHERE bot_id = {bot_id} AND code_type = 'free' AND is_used = false 
                   ORDER BY code_number LIMIT 1'''
    
    cursor.execute(query)
    qr_code = cursor.fetchone()
    
    if qr_code and not is_user_admin:
        update_query = f'''UPDATE t_p5255237_telegram_bot_service.qr_codes 
                          SET is_used = true, used_by_user_id = {user_id}, used_at = CURRENT_TIMESTAMP 
                          WHERE id = {qr_code['id']}'''
        cursor.execute(update_query)
        conn.commit()
    
    cursor.close()
    conn.close()
    return dict(qr_code) if qr_code else None

def get_vip_qr_key(bot_id: int, user_id: int, telegram_user_id: int = None) -> Optional[Dict]:
    '''Получить свободный VIP QR-ключ'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    is_user_admin = is_admin(bot_id, telegram_user_id) if telegram_user_id else False
    
    if is_user_admin:
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
                   WHERE bot_id = {bot_id} AND code_type = 'paid'
                   ORDER BY code_number LIMIT 1'''
    else:
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
                   WHERE bot_id = {bot_id} AND code_type = 'paid' AND is_used = false 
                   ORDER BY code_number LIMIT 1'''
    
    cursor.execute(query)
    qr_code = cursor.fetchone()
    
    if qr_code and not is_user_admin:
        update_query = f'''UPDATE t_p5255237_telegram_bot_service.qr_codes 
                          SET is_used = true, used_by_user_id = {user_id}, used_at = CURRENT_TIMESTAMP 
                          WHERE id = {qr_code['id']}'''
        cursor.execute(update_query)
        conn.commit()
    
    cursor.close()
    conn.close()
    return dict(qr_code) if qr_code else None

def save_payment_to_db(bot_id: int, telegram_user_id: int, order_id: str, payment_id: str, 
                       payment_url: str, amount: int, phone: str, first_name: str, last_name: str) -> bool:
    '''Сохранить платёж в БД'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    phone_escaped = phone.replace("'", "''")
    first_name_escaped = first_name.replace("'", "''")
    last_name_escaped = last_name.replace("'", "''")
    order_id_escaped = order_id.replace("'", "''")
    payment_id_escaped = payment_id.replace("'", "''")
    payment_url_escaped = payment_url.replace("'", "''")
    
    query = f'''INSERT INTO t_p5255237_telegram_bot_service.payments 
               (bot_id, telegram_user_id, order_id, payment_id, payment_url, amount, status, 
                customer_phone, customer_first_name, customer_last_name, created_at)
               VALUES ({bot_id}, {telegram_user_id}, '{order_id_escaped}', '{payment_id_escaped}', 
                       '{payment_url_escaped}', {amount}, 'NEW', '{phone_escaped}', 
                       '{first_name_escaped}', '{last_name_escaped}', CURRENT_TIMESTAMP)'''
    
    try:
        cursor.execute(query)
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except:
        cursor.close()
        conn.close()
        return False

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

def get_bot_settings(bot_id: int) -> Optional[Dict]:
    '''Получить настройки бота'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'SELECT * FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id}'
    cursor.execute(query)
    bot = cursor.fetchone()
    cursor.close()
    conn.close()
    return dict(bot) if bot else None

def is_admin(bot_id: int, telegram_user_id: int) -> bool:
    '''Проверка является ли пользователь администратором бота'''
    bot_settings = get_bot_settings(bot_id)
    if not bot_settings:
        return False
    admin_ids = bot_settings.get('admin_telegram_ids', [])
    return telegram_user_id in admin_ids

def save_privacy_consent(bot_id: int, user_id: int, telegram_user_id: int, consent_text: str, unique_code: str) -> bool:
    '''Сохранить согласие на обработку персональных данных'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    consent_text_escaped = consent_text.replace("'", "''")
    unique_code_escaped = unique_code.replace("'", "''")
    
    query = f'''INSERT INTO t_p5255237_telegram_bot_service.privacy_consents 
               (bot_id, user_id, telegram_user_id, consent_text, user_unique_code, accepted_at)
               VALUES ({bot_id}, {user_id}, {telegram_user_id}, '{consent_text_escaped}', '{unique_code_escaped}', CURRENT_TIMESTAMP)
               ON CONFLICT (bot_id, user_id) DO UPDATE 
               SET accepted_at = CURRENT_TIMESTAMP, consent_text = '{consent_text_escaped}' '''
    
    try:
        cursor.execute(query)
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        cursor.close()
        conn.close()
        return False

def check_privacy_consent(bot_id: int, user_id: int) -> bool:
    '''Проверить, принял ли пользователь согласие'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'''SELECT id FROM t_p5255237_telegram_bot_service.privacy_consents 
               WHERE bot_id = {bot_id} AND user_id = {user_id}'''
    cursor.execute(query)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result is not None

def get_shop_categories(bot_id: int) -> list:
    '''Получить категории товаров магазина'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'''SELECT * FROM t_p5255237_telegram_bot_service.shop_categories 
               WHERE bot_id = {bot_id} AND is_active = true 
               ORDER BY sort_order, name'''
    cursor.execute(query)
    categories = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(cat) for cat in categories]

def get_shop_products(bot_id: int, category_id: int = None) -> list:
    '''Получить товары магазина, опционально по категории'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    if category_id:
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.shop_products 
                   WHERE bot_id = {bot_id} AND category_id = {category_id} AND is_available = true 
                   ORDER BY sort_order, name'''
    else:
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.shop_products 
                   WHERE bot_id = {bot_id} AND is_available = true 
                   ORDER BY sort_order, name'''
    cursor.execute(query)
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(prod) for prod in products]

def add_to_cart(bot_id: int, user_id: int, product_id: int, quantity: int = 1) -> bool:
    '''Добавить товар в корзину пользователя'''
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f'''INSERT INTO t_p5255237_telegram_bot_service.shop_carts 
               (bot_id, user_id, product_id, quantity) 
               VALUES ({bot_id}, {user_id}, {product_id}, {quantity})
               ON CONFLICT (user_id, product_id) 
               DO UPDATE SET quantity = shop_carts.quantity + {quantity}'''
    cursor.execute(query)
    conn.commit()
    cursor.close()
    conn.close()
    return True

def get_user_cart(bot_id: int, user_id: int) -> list:
    '''Получить корзину пользователя с товарами'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'''SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_url
               FROM t_p5255237_telegram_bot_service.shop_carts c
               JOIN t_p5255237_telegram_bot_service.shop_products p ON c.product_id = p.id
               WHERE c.bot_id = {bot_id} AND c.user_id = {user_id} AND c.quantity > 0'''
    cursor.execute(query)
    cart_items = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(item) for item in cart_items]

def clear_user_cart(bot_id: int, user_id: int):
    '''Очистить корзину пользователя после заказа'''
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f'''UPDATE t_p5255237_telegram_bot_service.shop_carts 
               SET quantity = 0 
               WHERE bot_id = {bot_id} AND user_id = {user_id}'''
    cursor.execute(query)
    conn.commit()
    cursor.close()
    conn.close()

def get_warehouse_schedule(bot_id: int) -> Optional[Dict]:
    '''Получить расписание работы склада'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'''SELECT * FROM t_p5255237_telegram_bot_service.warehouse_schedule 
               WHERE bot_id = {bot_id}'''
    cursor.execute(query)
    schedule = cursor.fetchone()
    cursor.close()
    conn.close()
    if schedule:
        return dict(schedule)
    return {
        'work_start_time': '08:00:00',
        'work_end_time': '18:00:00',
        'slot_duration_minutes': 60,
        'work_days': '1,2,3,4,5'
    }

def get_available_dates(bot_id: int, days_ahead: int = 60) -> list:
    '''Получить доступные даты для бронирования (только будущие рабочие дни)'''
    from datetime import datetime, timedelta
    schedule = get_warehouse_schedule(bot_id)
    work_days = [int(d) for d in schedule['work_days'].split(',')]
    
    available_dates = []
    today = datetime.now().date()
    
    for i in range(1, days_ahead + 1):
        check_date = today + timedelta(days=i)
        if check_date.isoweekday() in work_days:
            available_dates.append(check_date)
    
    return available_dates

def get_booked_slots(bot_id: int, date) -> list:
    '''Получить занятые слоты на конкретную дату'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f'''SELECT booking_time FROM t_p5255237_telegram_bot_service.warehouse_bookings 
               WHERE bot_id = {bot_id} AND booking_date = '{date}' AND status = 'active' '''
    cursor.execute(query)
    bookings = cursor.fetchall()
    cursor.close()
    conn.close()
    return [str(b['booking_time'])[:5] for b in bookings]

def get_available_time_slots(bot_id: int, date) -> list:
    '''Получить свободные временные слоты на дату'''
    from datetime import datetime, timedelta
    schedule = get_warehouse_schedule(bot_id)
    
    start_time_str = str(schedule['work_start_time'])[:5]
    end_time_str = str(schedule['work_end_time'])[:5]
    slot_duration = schedule['slot_duration_minutes']
    
    start_hour, start_minute = map(int, start_time_str.split(':'))
    end_hour, end_minute = map(int, end_time_str.split(':'))
    
    start_time = datetime.combine(date, datetime.min.time().replace(hour=start_hour, minute=start_minute))
    end_time = datetime.combine(date, datetime.min.time().replace(hour=end_hour, minute=end_minute))
    
    booked_slots = get_booked_slots(bot_id, date)
    
    available_slots = []
    current_time = start_time
    
    while current_time < end_time:
        time_str = current_time.strftime('%H:%M')
        if time_str not in booked_slots:
            available_slots.append(time_str)
        current_time += timedelta(minutes=slot_duration)
    
    return available_slots

def create_warehouse_booking(bot_id: int, telegram_user_id: int, username: str, 
                             phone: str, company: str, date, time_str: str,
                             vehicle_type: str, cargo_desc: str) -> bool:
    '''Создать бронирование склада'''
    conn = get_db_connection()
    cursor = conn.cursor()
    
    username_escaped = username.replace("'", "''")
    phone_escaped = phone.replace("'", "''")
    company_escaped = company.replace("'", "''")
    vehicle_escaped = vehicle_type.replace("'", "''")
    cargo_escaped = cargo_desc.replace("'", "''")
    
    query = f'''INSERT INTO t_p5255237_telegram_bot_service.warehouse_bookings 
               (bot_id, telegram_user_id, telegram_username, user_phone, user_company,
                booking_date, booking_time, vehicle_type, cargo_description, status)
               VALUES ({bot_id}, {telegram_user_id}, '{username_escaped}', '{phone_escaped}', 
                       '{company_escaped}', '{date}', '{time_str}', '{vehicle_escaped}', 
                       '{cargo_escaped}', 'active')'''
    
    try:
        cursor.execute(query)
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except:
        cursor.close()
        conn.close()
        return False

def get_user_bookings(bot_id: int, telegram_user_id: int) -> list:
    '''Получить активные бронирования пользователя'''
    from datetime import datetime
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    today = datetime.now().date()
    query = f'''SELECT * FROM t_p5255237_telegram_bot_service.warehouse_bookings 
               WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id} 
               AND status = 'active' AND booking_date >= '{today}' 
               ORDER BY booking_date, booking_time'''
    cursor.execute(query)
    bookings = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(b) for b in bookings]

def cancel_warehouse_booking(booking_id: int, reason: str = 'Отменено пользователем') -> bool:
    '''Отменить бронирование'''
    conn = get_db_connection()
    cursor = conn.cursor()
    reason_escaped = reason.replace("'", "''")
    query = f'''UPDATE t_p5255237_telegram_bot_service.warehouse_bookings 
               SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, 
               cancellation_reason = '{reason_escaped}' 
               WHERE id = {booking_id}'''
    try:
        cursor.execute(query)
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except:
        cursor.close()
        conn.close()
        return False

def create_main_menu_keyboard(payment_enabled: bool = True, button_texts: dict = None) -> ReplyKeyboardMarkup:
    '''Создает главное меню с кнопками'''
    if button_texts is None:
        button_texts = {}
    
    print(f"[DEBUG] create_main_menu_keyboard - payment_enabled: {payment_enabled}")
    print(f"[DEBUG] create_main_menu_keyboard - button_texts: {button_texts}")
    
    free_key_text = button_texts.get('free_key', '🎁 Получить бесплатный ключ')
    keyboard_buttons = [
        [KeyboardButton(text=free_key_text)],
    ]
    
    if payment_enabled:
        secret_shop_text = button_texts.get('secret_shop', '🔐 Узнать про Тайную витрину')
        buy_vip_text = button_texts.get('buy_vip', '💎 Купить VIP-ключ')
        privacy_text = button_texts.get('privacy', '📄 Согласие на обработку данных')
        help_text = button_texts.get('help', '❓ Помощь')
        
        print(f"[DEBUG] Adding payment buttons: secret_shop={secret_shop_text}, buy_vip={buy_vip_text}")
        
        keyboard_buttons.extend([
            [KeyboardButton(text=secret_shop_text)],
            [KeyboardButton(text=buy_vip_text)],
            [KeyboardButton(text=privacy_text)],
            [KeyboardButton(text=help_text)]
        ])
    else:
        print(f"[DEBUG] Payment disabled - NOT adding payment buttons")
    
    print(f"[DEBUG] Final keyboard_buttons count: {len(keyboard_buttons)}")
    
    keyboard = ReplyKeyboardMarkup(
        keyboard=keyboard_buttons,
        resize_keyboard=True
    )
    return keyboard

async def cmd_start(message: types.Message, bot_id: int):
    '''Обработка команды /start'''
    user_id = register_telegram_user(bot_id, message.from_user)
    
    bot_settings = get_bot_settings(bot_id)
    payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
    message_texts = bot_settings.get('message_texts', {}) if bot_settings else {}
    button_texts = bot_settings.get('button_texts', {}) if bot_settings else {}
    bot_template = bot_settings.get('template', 'keys') if bot_settings else 'keys'
    
    print(f"[DEBUG Bot {bot_id}] /start command - payment_enabled: {payment_enabled}")
    print(f"[DEBUG Bot {bot_id}] /start command - button_texts: {button_texts}")
    print(f"[DEBUG Bot {bot_id}] /start command - message_texts: {message_texts}")
    print(f"[DEBUG Bot {bot_id}] /start command - template: {bot_template}")
    
    if bot_template == 'shop':
        welcome_text = message_texts.get('welcome', 
            "🛍 Добро пожаловать в наш магазин!\n\n"
            "Здесь вы можете выбрать товары из каталога и оформить заказ.\n\n"
            "Выберите действие:"
        )
        
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="🛍️ Каталог товаров")],
                [KeyboardButton(text="🛒 Корзина")],
            ],
            resize_keyboard=True
        )
        await message.answer(welcome_text, reply_markup=keyboard)
        return
    
    if bot_template == 'warehouse':
        welcome_text = message_texts.get('welcome',
            "🏭 Добро пожаловать в систему бронирования склада!\n\n"
            "Здесь вы можете забронировать время для разгрузки товара.\n\n"
            "📅 Рабочие часы: 8:00 - 18:00 (Пн-Пт)\n"
            "⏱ Длительность слота: 60 минут\n\n"
            "Выберите действие:"
        )
        
        keyboard = ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="📅 Забронировать время")],
                [KeyboardButton(text="📋 Мои бронирования")],
                [KeyboardButton(text="ℹ️ Информация")],
            ],
            resize_keyboard=True
        )
        await message.answer(welcome_text, reply_markup=keyboard)
        return
    
    welcome_text = message_texts.get('welcome', 
        "🚀 Привет! Я бот POLYTOPE.\n\n"
        "Здесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине "
        "на нашей закрытой распродаже с 21 по 23 ноября.\n\n"
        "Выберите действие:"
    )
    
    await message.answer(welcome_text, reply_markup=create_main_menu_keyboard(payment_enabled, button_texts))

async def handle_free_key(message: types.Message, bot_id: int):
    '''Обработка запроса бесплатного ключа (только для шаблона keys)'''
    user_id = register_telegram_user(bot_id, message.from_user)
    telegram_user_id = message.from_user.id
    qr_key = get_free_qr_key(bot_id, user_id, telegram_user_id)
    
    bot_settings = get_bot_settings(bot_id)
    message_texts = bot_settings.get('message_texts', {}) if bot_settings else {}
    bot_template = bot_settings.get('template', 'keys') if bot_settings else 'keys'
    payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
    
    print(f"[DEBUG] Bot {bot_id} message_texts: {message_texts}")
    print(f"[DEBUG] Bot {bot_id} template: {bot_template}")
    
    admin_note = ""
    if is_admin(bot_id, telegram_user_id):
        admin_note = "\n\n🔧 Режим администратора: ключ НЕ помечен как использованный"
    
    if qr_key:
        qr_image = generate_qr_image(qr_key['code_number'])
        
        text_template = message_texts.get('free_key_success', 
            "✅ Ваш бесплатный ключ №{code_number}\n\n"
            "Покажите этот QR-код на кассе:\n"
            "• Участвуете в розыгрыше подарка\n"
            "• Получаете право на участие в Закрытой распродаже"
        )
        text = text_template.format(code_number=qr_key['code_number']) + admin_note
        
        keyboard_buttons = []
        
        if bot_template == 'keys' and payment_enabled:
            keyboard_buttons.extend([
                [InlineKeyboardButton(text="🔐 Что такое Тайная витрина?", callback_data="secret_shop")],
                [InlineKeyboardButton(text="💎 Купить VIP-ключ", callback_data="buy_vip")]
            ])
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons) if keyboard_buttons else None
        
        if keyboard:
            await message.answer_photo(
                photo=types.BufferedInputFile(qr_image.read(), filename=f"key_{qr_key['code_number']}.png"),
                caption=text,
                reply_markup=keyboard
            )
        else:
            await message.answer_photo(
                photo=types.BufferedInputFile(qr_image.read(), filename=f"key_{qr_key['code_number']}.png"),
                caption=text
            )
    else:
        text = message_texts.get('free_key_empty',
            "😔 Бесплатные ключи на сегодня закончились.\n\n"
            "Но вы всё ещё можете получить VIP-ключ и попасть в Тайную витрину!"
        )
        
        keyboard_buttons = []
        if bot_template == 'keys' and payment_enabled:
            keyboard_buttons.append([InlineKeyboardButton(text="💎 Купить VIP-ключ", callback_data="buy_vip")])
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons) if keyboard_buttons else None
        
        if keyboard:
            await message.answer(text, reply_markup=keyboard)
        else:
            await message.answer(text)

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

async def handle_buy_vip(message: types.Message, bot_id: int, state: FSMContext, bot: Bot):
    '''Обработка покупки VIP-ключа - показывает информацию и запускает форму'''
    
    telegram_user_id = message.from_user.id
    user_id = register_telegram_user(bot_id, message.from_user)
    
    # Проверяем есть ли у пользователя платёж со статусом NEW или в процессе
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    payment_check_query = f'''SELECT order_id, status FROM t_p5255237_telegram_bot_service.payments 
                              WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}
                              AND status IN ('NEW', 'AUTHORIZED', 'CONFIRMED')
                              ORDER BY created_at DESC LIMIT 1'''
    cursor.execute(payment_check_query)
    existing_payment = cursor.fetchone()
    
    if existing_payment:
        order_id = existing_payment['order_id']
        status = existing_payment['status']
        
        if status == 'CONFIRMED':
            # Платёж уже подтверждён, выдаём ключ если ещё не выдан
            qr_key = get_vip_qr_key(bot_id, user_id, telegram_user_id)
            
            if qr_key:
                qr_image = generate_qr_image(qr_key['code_number'])
                
                bot_settings = get_bot_settings(bot_id)
                success_message_template = bot_settings.get('vip_success_message') if bot_settings else None
                
                if success_message_template:
                    text = success_message_template.format(code_number=qr_key['code_number'])
                else:
                    text = (
                        f"✅ Ключ оплачен! Спасибо за покупку!\n\n"
                        f"💎 Ваш VIP QR-код №{qr_key['code_number']}\n\n"
                        f"Покажите этот код на кассе для получения доступа к VIP-товарам"
                    )
                
                await message.answer_photo(
                    photo=types.BufferedInputFile(qr_image.read(), filename=f"vip_key_{qr_key['code_number']}.png"),
                    caption=text
                )
            else:
                await message.answer("✅ У вас уже есть оплаченный VIP-ключ!")
            
            cursor.close()
            conn.close()
            return
        
        # Проверяем статус платежа в T-Bank
        await message.answer("⏳ Проверяю статус вашего платежа...")
        
        try:
            import urllib.request
            
            req = urllib.request.Request(
                'https://functions.poehali.dev/b4079ccb-abcb-4171-b656-2462d93e1ac9',
                data=json.dumps({'order_id': order_id}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                if result.get('confirmed'):
                    # Платёж подтверждён! Выдаём VIP-ключ
                    qr_key = get_vip_qr_key(bot_id, user_id, telegram_user_id)
                    
                    if qr_key:
                        qr_image = generate_qr_image(qr_key['code_number'])
                        
                        bot_settings = get_bot_settings(bot_id)
                        success_message_template = bot_settings.get('vip_success_message') if bot_settings else None
                        
                        if success_message_template:
                            text = success_message_template.format(code_number=qr_key['code_number'])
                        else:
                            text = (
                                f"✅ Ключ оплачен! Спасибо за покупку!\n\n"
                                f"💎 Ваш VIP QR-код №{qr_key['code_number']}\n\n"
                                f"Покажите этот код на кассе для получения доступа к VIP-товарам"
                            )
                        
                        await message.answer_photo(
                            photo=types.BufferedInputFile(qr_image.read(), filename=f"vip_key_{qr_key['code_number']}.png"),
                            caption=text
                        )
                        cursor.close()
                        conn.close()
                        return
                    
        except:
            pass
        
        # Закрываем соединение после проверки существующих платежей
        cursor.close()
        conn.close()
    
    # Открываем новое соединение для получения данных бота
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Получаем данные бота из БД
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

async def handle_privacy_policy(message: types.Message, bot_id: int):
    '''Показать политику конфиденциальности'''
    bot_settings = get_bot_settings(bot_id)
    user_id = register_telegram_user(bot_id, message.from_user)
    
    privacy_text = bot_settings.get('privacy_policy_text') if bot_settings else None
    if not privacy_text:
        privacy_text = (
            "📄 Политика конфиденциальности и обработки персональных данных\n\n"
            "1. Общие положения\n"
            "Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей бота.\n\n"
            "2. Персональные данные\n"
            "Мы собираем: имя, фамилию, номер телефона, Telegram ID.\n\n"
            "3. Цели обработки\n"
            "- Идентификация пользователя\n"
            "- Предоставление доступа к услугам\n"
            "- Уведомления о статусе заказа\n\n"
            "4. Хранение данных\n"
            "Данные хранятся на защищенных серверах и не передаются третьим лицам.\n\n"
            "5. Ваши права\n"
            "Вы можете запросить удаление своих данных, связавшись с администратором.\n\n"
            "Используя бота, вы соглашаетесь с данной политикой конфиденциальности."
        )
    
    has_consent = check_privacy_consent(bot_id, user_id)
    
    if has_consent:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Согласие уже принято", callback_data="consent_accepted")],
            [InlineKeyboardButton(text="🔙 В главное меню", callback_data="main_menu")]
        ])
    else:
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Принимаю соглашение", callback_data="accept_privacy")],
            [InlineKeyboardButton(text="🔙 В главное меню", callback_data="main_menu")]
        ])
    
    await message.answer(privacy_text, reply_markup=keyboard)

async def handle_accept_privacy(callback: types.CallbackQuery, bot_id: int, bot: Bot):
    '''Обработка принятия соглашения'''
    user_id = register_telegram_user(bot_id, callback.from_user)
    telegram_user_id = callback.from_user.id
    
    bot_settings = get_bot_settings(bot_id)
    privacy_text = bot_settings.get('privacy_policy_text', 'Согласие на обработку персональных данных')
    bot_template = bot_settings.get('template', 'keys') if bot_settings else 'keys'
    message_texts = bot_settings.get('message_texts', {}) if bot_settings else {}
    button_texts = bot_settings.get('button_texts', {}) if bot_settings else {}
    payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
    
    unique_code = f"USER_{telegram_user_id}_{bot_id}"
    
    success = save_privacy_consent(bot_id, user_id, telegram_user_id, privacy_text, unique_code)
    
    if success:
        await callback.message.edit_text(
            "✅ Спасибо! Ваше согласие принято и сохранено.\n\n"
            f"Ваш уникальный код: {unique_code}"
        )
        
        owner_telegram_id = 718091347
        admin_telegram_id = 500136108
        
        username = callback.from_user.username or "без username"
        first_name = callback.from_user.first_name or ""
        last_name = callback.from_user.last_name or ""
        full_name = f"{first_name} {last_name}".strip()
        
        notification_text = (
            f"🔔 Новое согласие на обработку персональных данных\n\n"
            f"Пользователь: {full_name}\n"
            f"Username: @{username}\n"
            f"Telegram ID: {telegram_user_id}\n"
            f"Уникальный код: {unique_code}\n"
            f"Время: {asyncio.get_event_loop().time()}"
        )
        
        try:
            await bot.send_message(owner_telegram_id, notification_text)
        except:
            pass
        
        try:
            await bot.send_message(admin_telegram_id, notification_text)
        except:
            pass
        
        if bot_template == 'shop':
            welcome_text = message_texts.get('welcome', 
                "🛍 Добро пожаловать в наш магазин!\n\n"
                "Здесь вы можете выбрать товары из каталога и оформить заказ.\n\n"
                "Выберите действие:"
            )
            
            keyboard = ReplyKeyboardMarkup(
                keyboard=[
                    [KeyboardButton(text="🛍️ Каталог товаров")],
                    [KeyboardButton(text="🛒 Корзина")],
                ],
                resize_keyboard=True
            )
            await callback.message.answer(welcome_text, reply_markup=keyboard)
        
        elif bot_template == 'warehouse':
            welcome_text = message_texts.get('welcome',
                "🏭 Добро пожаловать в систему бронирования склада!\n\n"
                "Здесь вы можете забронировать время для разгрузки товара.\n\n"
                "📅 Рабочие часы: 8:00 - 18:00 (Пн-Пт)\n"
                "⏱ Длительность слота: 60 минут\n\n"
                "Выберите действие:"
            )
            
            keyboard = ReplyKeyboardMarkup(
                keyboard=[
                    [KeyboardButton(text="📅 Забронировать время")],
                    [KeyboardButton(text="📋 Мои бронирования")],
                    [KeyboardButton(text="ℹ️ Информация")],
                ],
                resize_keyboard=True
            )
            await callback.message.answer(welcome_text, reply_markup=keyboard)
        
        else:
            welcome_text = message_texts.get('welcome', 
                "🚀 Привет! Я бот POLYTOPE.\n\n"
                "Здесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине "
                "на нашей закрытой распродаже с 21 по 23 ноября.\n\n"
                "Выберите действие:"
            )
            
            await callback.message.answer(welcome_text, reply_markup=create_main_menu_keyboard(payment_enabled, button_texts))
    else:
        await callback.message.edit_text(
            "❌ Произошла ошибка при сохранении согласия. Попробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 В главное меню", callback_data="main_menu")]
            ])
        )
    
    await callback.answer()

async def handle_accept_privacy_payment(callback: types.CallbackQuery, bot_id: int, bot: Bot, state: FSMContext):
    '''Обработка принятия согласия при оплате'''
    user_id = register_telegram_user(bot_id, callback.from_user)
    telegram_user_id = callback.from_user.id
    
    bot_settings = get_bot_settings(bot_id)
    privacy_text = bot_settings.get('privacy_policy_text', 'Согласие на обработку персональных данных')
    
    unique_code = f"USER_{telegram_user_id}_{bot_id}"
    
    success = save_privacy_consent(bot_id, user_id, telegram_user_id, privacy_text, unique_code)
    
    if success:
        owner_telegram_id = 718091347
        admin_telegram_id = 500136108
        
        username = callback.from_user.username or "без username"
        first_name = callback.from_user.first_name or ""
        last_name = callback.from_user.last_name or ""
        full_name = f"{first_name} {last_name}".strip()
        
        notification_text = (
            f"🔔 Новое согласие на обработку данных (при оплате)\n\n"
            f"Пользователь: {full_name}\n"
            f"Username: @{username}\n"
            f"Telegram ID: {telegram_user_id}\n"
            f"Уникальный код: {unique_code}"
        )
        
        try:
            await bot.send_message(owner_telegram_id, notification_text)
        except:
            pass
        
        try:
            await bot.send_message(admin_telegram_id, notification_text)
        except:
            pass
    
    await callback.message.answer("✅ Согласие принято. Теперь введите ваши данные для оплаты.")
    await callback.message.answer("📝 Введите вашу *Фамилию*:", parse_mode='Markdown')
    await state.set_state(BotStates.waiting_for_last_name)
    await callback.answer()

async def handle_help(message: types.Message):
    '''Помощь пользователю'''
    text = (
        "❓ Как пользоваться ботом:\n\n"
        "🎁 Получить бесплатный ключ - выдает QR-код (номера 1-500)\n"
        "🔐 Узнать про Тайную витрину - информация о закрытой распродаже\n"
        "💎 Купить VIP-ключ - получить доступ к эксклюзивным товарам\n"
        "📄 Согласие на обработку данных - политика конфиденциальности\n\n"
        "По всем вопросам пишите в поддержку."
    )
    await message.answer(text)

async def handle_shop_catalog(message: types.Message, bot_id: int):
    '''Показать каталог магазина с категориями'''
    categories = get_shop_categories(bot_id)
    
    if not categories:
        await message.answer(
            "🛍 Каталог пока пуст. Администратор еще не добавил товары.",
            reply_markup=create_main_menu_keyboard(True, {})
        )
        return
    
    text = "🛍 *Каталог товаров*\n\nВыберите категорию:"
    
    keyboard_buttons = []
    for cat in categories:
        emoji = cat.get('emoji', '📦')
        button_text = f"{emoji} {cat['name']}"
        keyboard_buttons.append([KeyboardButton(text=button_text)])
    
    keyboard_buttons.append([KeyboardButton(text="🛒 Корзина")])
    keyboard_buttons.append([KeyboardButton(text="⬅ Главное меню")])
    
    keyboard = ReplyKeyboardMarkup(keyboard=keyboard_buttons, resize_keyboard=True)
    await message.answer(text, reply_markup=keyboard, parse_mode="Markdown")

async def handle_category_products(message: types.Message, bot_id: int, category_name: str):
    '''Показать товары в категории'''
    categories = get_shop_categories(bot_id)
    category = next((c for c in categories if c['name'] in message.text), None)
    
    if not category:
        return
    
    products = get_shop_products(bot_id, category['id'])
    
    if not products:
        await message.answer(f"В категории '{category['name']}' пока нет товаров.")
        return
    
    for product in products[:10]:
        text = f"*{product['name']}*\n\n"
        text += f"{product.get('description', 'Описание отсутствует')}\n\n"
        text += f"💰 Цена: {product['price']} ₽\n"
        
        if product.get('stock_quantity', 0) > 0:
            text += f"📦 В наличии: {product['stock_quantity']} шт."
        else:
            text += "⚠️ Нет в наличии"
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="➕ В корзину", callback_data=f"add_to_cart:{product['id']}")],
        ])
        
        if product.get('image_url'):
            try:
                await message.answer_photo(
                    photo=product['image_url'],
                    caption=text,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )
            except:
                await message.answer(text, reply_markup=keyboard, parse_mode="Markdown")
        else:
            await message.answer(text, reply_markup=keyboard, parse_mode="Markdown")

async def handle_view_cart(message: types.Message, bot_id: int):
    '''Показать корзину пользователя'''
    user_id = register_telegram_user(bot_id, message.from_user)
    cart_items = get_user_cart(bot_id, user_id)
    
    if not cart_items:
        await message.answer(
            "🛒 Ваша корзина пуста\n\nДобавьте товары из каталога!",
            reply_markup=create_main_menu_keyboard(True, {})
        )
        return
    
    text = "🛒 *Ваша корзина:*\n\n"
    total = 0
    
    for item in cart_items:
        subtotal = float(item['price']) * item['quantity']
        total += subtotal
        text += f"• {item['name']}\n"
        text += f"  {item['quantity']} шт. × {item['price']} ₽ = {subtotal} ₽\n\n"
    
    text += f"*Итого: {total} ₽*"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Оформить заказ", callback_data="checkout")],
        [InlineKeyboardButton(text="🗑 Очистить корзину", callback_data="clear_cart")],
    ])
    
    await message.answer(text, reply_markup=keyboard, parse_mode="Markdown")

async def handle_warehouse_booking_start(message: types.Message, bot_id: int, state: FSMContext):
    '''Начало процесса бронирования - выбор даты'''
    from datetime import datetime
    available_dates = get_available_dates(bot_id, days_ahead=14)
    
    if not available_dates:
        await message.answer("К сожалению, нет доступных дат для бронирования.")
        return
    
    text = "📅 *Выберите дату для разгрузки:*\n\n"
    
    keyboard_buttons = []
    for i, date in enumerate(available_dates[:10]):
        date_str = date.strftime('%d.%m.%Y (%a)')
        callback_data = f"warehouse_date:{date.strftime('%Y-%m-%d')}"
        keyboard_buttons.append([InlineKeyboardButton(text=date_str, callback_data=callback_data)])
    
    keyboard_buttons.append([InlineKeyboardButton(text="⬅ Главное меню", callback_data="main_menu")])
    keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons)
    
    await message.answer(text, reply_markup=keyboard, parse_mode="Markdown")

async def handle_warehouse_date_selected(callback: types.CallbackQuery, bot_id: int, state: FSMContext):
    '''Обработка выбора даты - показ доступных слотов времени'''
    from datetime import datetime
    date_str = callback.data.split(':')[1]
    selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    available_slots = get_available_time_slots(bot_id, selected_date)
    
    if not available_slots:
        await callback.message.edit_text(
            f"😔 На {selected_date.strftime('%d.%m.%Y')} все слоты заняты.\n\nВыберите другую дату.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="⬅ Назад к датам", callback_data="warehouse_booking")]
            ])
        )
        await callback.answer()
        return
    
    text = f"🕐 *Доступное время на {selected_date.strftime('%d.%m.%Y')}:*\n\n"
    text += "Выберите удобный слот:"
    
    keyboard_buttons = []
    for time_slot in available_slots[:10]:
        callback_data = f"warehouse_time:{date_str}:{time_slot}"
        keyboard_buttons.append([InlineKeyboardButton(text=f"⏰ {time_slot}", callback_data=callback_data)])
    
    keyboard_buttons.append([InlineKeyboardButton(text="⬅ Назад к датам", callback_data="warehouse_booking")])
    keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons)
    
    await callback.message.edit_text(text, reply_markup=keyboard, parse_mode="Markdown")
    await callback.answer()

async def handle_warehouse_time_selected(callback: types.CallbackQuery, bot_id: int, state: FSMContext):
    '''Обработка выбора времени - начало заполнения данных'''
    parts = callback.data.split(':')
    date_str = parts[1]
    time_str = parts[2]
    
    await state.update_data(
        bot_id=bot_id,
        booking_date=date_str,
        booking_time=time_str
    )
    
    await callback.message.edit_text(
        f"✅ Выбрано: {date_str} в {time_str}\n\n"
        f"📝 Теперь введите ваши данные.\n\n"
        f"Введите *номер телефона* для связи:",
        parse_mode="Markdown"
    )
    await state.set_state(BotStates.warehouse_entering_phone)
    await callback.answer()

async def process_warehouse_phone(message: types.Message, state: FSMContext):
    '''Обработка ввода телефона для склада'''
    await state.update_data(warehouse_phone=message.text)
    await message.answer("🏢 Введите *название компании*:", parse_mode="Markdown")
    await state.set_state(BotStates.warehouse_entering_company)

async def process_warehouse_company(message: types.Message, state: FSMContext):
    '''Обработка ввода компании'''
    await state.update_data(warehouse_company=message.text)
    await message.answer("🚚 Введите *тип транспортного средства* (например: Газель, Фура 20т):", parse_mode="Markdown")
    await state.set_state(BotStates.warehouse_entering_vehicle)

async def process_warehouse_vehicle(message: types.Message, state: FSMContext):
    '''Обработка ввода типа ТС'''
    await state.update_data(warehouse_vehicle=message.text)
    await message.answer("📦 Введите *описание груза* (например: Стройматериалы, 5 паллет):", parse_mode="Markdown")
    await state.set_state(BotStates.warehouse_entering_cargo)

async def process_warehouse_cargo_and_confirm(message: types.Message, state: FSMContext, bot: Bot):
    '''Обработка описания груза и создание бронирования'''
    from datetime import datetime
    user_data = await state.get_data()
    bot_id = user_data.get('bot_id')
    date_str = user_data.get('booking_date')
    time_str = user_data.get('booking_time')
    phone = user_data.get('warehouse_phone')
    company = user_data.get('warehouse_company')
    vehicle = user_data.get('warehouse_vehicle')
    cargo = message.text
    
    telegram_user_id = message.from_user.id
    username = message.from_user.username or 'без username'
    
    success = create_warehouse_booking(
        bot_id, telegram_user_id, username, phone, company,
        date_str, time_str, vehicle, cargo
    )
    
    if success:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        text = (
            f"✅ *Бронирование подтверждено!*\n\n"
            f"📅 Дата: {date_obj.strftime('%d.%m.%Y')}\n"
            f"🕐 Время: {time_str}\n"
            f"📱 Телефон: {phone}\n"
            f"🏢 Компания: {company}\n"
            f"🚚 ТС: {vehicle}\n"
            f"📦 Груз: {cargo}\n\n"
            f"Мы ждем вас в указанное время. За день до разгрузки придет напоминание."
        )
        await message.answer(text, parse_mode="Markdown")
        
        # Отправить уведомление администраторам о новом бронировании
        bot_settings = get_bot_settings(bot_id)
        admin_ids = bot_settings.get('admin_telegram_ids', []) if bot_settings else []
        
        admin_notification = (
            f"🔔 *Новое бронирование склада*\n\n"
            f"📅 Дата: {date_obj.strftime('%d.%m.%Y')}\n"
            f"🕐 Время: {time_str}\n\n"
            f"👤 Клиент:\n"
            f"• Telegram: @{username} (ID: {telegram_user_id})\n"
            f"• Телефон: {phone}\n"
            f"• Компания: {company}\n\n"
            f"🚚 Транспорт: {vehicle}\n"
            f"📦 Груз: {cargo}"
        )
        
        for admin_id in admin_ids:
            try:
                await bot.send_message(admin_id, admin_notification, parse_mode='Markdown')
            except:
                pass
    else:
        await message.answer(
            "❌ Ошибка при создании бронирования. Возможно, это время уже занято. "
            "Попробуйте выбрать другой слот.",
            parse_mode="Markdown"
        )
    
    await state.clear()

async def handle_warehouse_my_bookings(message: types.Message, bot_id: int):
    '''Показать бронирования пользователя'''
    from datetime import datetime
    telegram_user_id = message.from_user.id
    bookings = get_user_bookings(bot_id, telegram_user_id)
    
    if not bookings:
        await message.answer(
            "📋 У вас нет активных бронирований.\n\n"
            "Забронируйте время для разгрузки!"
        )
        return
    
    text = "📋 *Ваши бронирования:*\n\n"
    
    keyboard_buttons = []
    for booking in bookings:
        date_obj = booking['booking_date']
        time_str = str(booking['booking_time'])[:5]
        date_str = date_obj.strftime('%d.%m.%Y')
        
        text += f"• {date_str} в {time_str}\n"
        text += f"  🏢 {booking['user_company']}\n"
        text += f"  🚚 {booking['vehicle_type']}\n\n"
        
        keyboard_buttons.append([
            InlineKeyboardButton(
                text=f"🗑 Отменить бронь {date_str} {time_str}",
                callback_data=f"warehouse_cancel:{booking['id']}"
            )
        ])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons)
    await message.answer(text, reply_markup=keyboard, parse_mode="Markdown")

async def handle_warehouse_info(message: types.Message, bot_id: int):
    '''Информация о складе'''
    schedule = get_warehouse_schedule(bot_id)
    
    work_days_map = {1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс'}
    work_days = [int(d) for d in schedule['work_days'].split(',')]
    work_days_str = ', '.join([work_days_map[d] for d in work_days])
    
    text = (
        f"ℹ️ *Информация о складе*\n\n"
        f"🕐 Рабочие часы: {str(schedule['work_start_time'])[:5]} - {str(schedule['work_end_time'])[:5]}\n"
        f"📅 Рабочие дни: {work_days_str}\n"
        f"⏱ Длительность слота: {schedule['slot_duration_minutes']} минут\n"
        f"📆 Бронирование доступно на 60 дней вперед\n\n"
        f"📝 Для бронирования вам понадобится:\n"
        f"• Номер телефона\n"
        f"• Название компании\n"
        f"• Тип транспортного средства\n"
        f"• Описание груза\n\n"
        f"⚠️ Обратите внимание:\n"
        f"• Бронирование можно отменить\n"
        f"• Прошедшие даты недоступны\n"
        f"• Занятые слоты не показываются"
    )
    
    await message.answer(text, parse_mode="Markdown")

async def start_payment_form(callback: types.CallbackQuery, state: FSMContext):
    '''Начало заполнения формы для оплаты'''
    user_data = await state.get_data()
    bot_id = user_data.get('bot_id')
    telegram_user_id = callback.from_user.id
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f"SELECT require_privacy_consent, privacy_policy_text FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id}"
    cursor.execute(query)
    bot_settings = cursor.fetchone()
    
    if bot_settings and bot_settings.get('require_privacy_consent'):
        consent_query = f"""SELECT id FROM t_p5255237_telegram_bot_service.privacy_consents 
                           WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}"""
        cursor.execute(consent_query)
        consent = cursor.fetchone()
        
        if not consent:
            privacy_text = bot_settings.get('privacy_policy_text') or 'Политика конфиденциальности не указана'
            
            max_length = 3500
            if len(privacy_text) > max_length:
                privacy_text = privacy_text[:max_length] + '...'
            
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ Принимаю соглашение", callback_data="accept_privacy_payment")],
                [InlineKeyboardButton(text="❌ Отмена", callback_data="main_menu")]
            ])
            
            await callback.message.answer(
                f"📄 *Согласие на обработку персональных данных*\n\n{privacy_text}\n\n"
                f"Для продолжения оплаты необходимо принять соглашение.",
                parse_mode='Markdown',
                reply_markup=keyboard
            )
            cursor.close()
            conn.close()
            await callback.answer()
            return
    
    cursor.close()
    conn.close()
    
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

async def process_phone_and_create_payment(message: types.Message, state: FSMContext, bot: Bot):
    '''Обработка телефона и создание платежа'''
    user_data = await state.get_data()
    last_name = user_data.get('last_name')
    first_name = user_data.get('first_name')
    phone = message.text
    
    bot_id = user_data.get('bot_id')
    vip_price = user_data.get('vip_price')
    terminal_key = user_data.get('terminal_key')
    password = user_data.get('password')
    
    try:
        import urllib.request
        import urllib.error
        
        telegram_user_id = message.from_user.id
        order_id = f'vip_{bot_id}_{telegram_user_id}_{int(asyncio.get_event_loop().time())}'
        
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
            'email': f'{telegram_user_id}@telegram.user'
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
                payment_id = result.get('payment_id', order_id)
                
                # Сохраняем платёж в БД
                save_payment_to_db(bot_id, telegram_user_id, order_id, payment_id, 
                                  payment_url, vip_price, phone, first_name, last_name)
                
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
                
                # Отправляем сообщение о проверке статуса
                await message.answer("⏳ Статус: на проверке...")
                
                # Запускаем проверку статуса платежа
                user_id = register_telegram_user(bot_id, message.from_user)
                asyncio.create_task(check_payment_status_loop(
                    bot, message.chat.id, order_id, bot_id, telegram_user_id, user_id
                ))
                
                await state.clear()
            else:
                error_msg = result.get('error', 'Неизвестная ошибка')
                await message.answer(f"⚠️ Ошибка создания платежа: {error_msg}")
                await state.clear()
                
    except Exception as e:
        await message.answer(f"⚠️ Ошибка при создании платежа: {str(e)}")
        await state.clear()

async def check_payment_status_loop(bot: Bot, chat_id: int, order_id: str, bot_id: int, telegram_user_id: int, user_id: int):
    '''Проверка статуса платежа с несколькими попытками: 5 сек, 10 сек, 60 сек'''
    delays = [5, 10, 60]  # Задержки между проверками
    
    for delay in delays:
        await asyncio.sleep(delay)
        
        # Проверяем статус через API
        try:
            import urllib.request
            
            req = urllib.request.Request(
                'https://functions.poehali.dev/b4079ccb-abcb-4171-b656-2462d93e1ac9',
                data=json.dumps({'order_id': order_id}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                if result.get('confirmed'):
                    # Платёж подтверждён! Выдаём VIP-ключ
                    qr_key = get_vip_qr_key(bot_id, user_id, telegram_user_id)
                    
                    if qr_key:
                        qr_image = generate_qr_image(qr_key['code_number'])
                        
                        bot_settings = get_bot_settings(bot_id)
                        success_message_template = bot_settings.get('vip_success_message') if bot_settings else None
                        
                        if success_message_template:
                            text = success_message_template.format(code_number=qr_key['code_number'])
                        else:
                            text = (
                                f"✅ Ключ оплачен! Спасибо за покупку!\n\n"
                                f"💎 Ваш VIP QR-код №{qr_key['code_number']}\n\n"
                                f"Покажите этот код на кассе для получения доступа к VIP-товарам"
                            )
                        
                        await bot.send_photo(
                            chat_id=chat_id,
                            photo=types.BufferedInputFile(qr_image.read(), filename=f"vip_key_{qr_key['code_number']}.png"),
                            caption=text
                        )
                    else:
                        await bot.send_message(chat_id, "✅ Оплата подтверждена! Но VIP-ключи закончились. Обратитесь к администратору.")
                    
                    return  # Выходим из цикла
                    
        except:
            pass  # Игнорируем ошибки проверки
    
    # Если после всех попыток платёж не подтверждён
    await bot.send_message(
        chat_id,
        "⏱ Время проверки истекло. Если вы оплатили заказ, нажмите 'Купить VIP-ключ' снова для проверки статуса."
    )

async def callback_handler(callback: types.CallbackQuery, bot_id: int, state: FSMContext, bot: Bot):
    '''Обработчик inline кнопок'''
    if callback.data == "secret_shop":
        await handle_secret_shop(callback.message, bot_id)
    elif callback.data == "buy_vip":
        await handle_buy_vip(callback.message, bot_id, state, bot)
    elif callback.data == "start_payment_form":
        await start_payment_form(callback, state)
    elif callback.data == "accept_privacy":
        await handle_accept_privacy(callback, bot_id, bot)
    elif callback.data == "accept_privacy_payment":
        await handle_accept_privacy_payment(callback, bot_id, bot, state)
    elif callback.data == "consent_accepted":
        await callback.answer("Вы уже приняли соглашение ранее", show_alert=True)
    elif callback.data.startswith("add_to_cart:"):
        product_id = int(callback.data.split(":")[1])
        user_id = register_telegram_user(bot_id, callback.from_user)
        add_to_cart(bot_id, user_id, product_id, 1)
        await callback.answer("✅ Товар добавлен в корзину!", show_alert=True)
    elif callback.data == "checkout":
        await callback.message.answer("🚧 Оформление заказа находится в разработке. Свяжитесь с администратором для оформления.")
        await callback.answer()
    elif callback.data == "clear_cart":
        user_id = register_telegram_user(bot_id, callback.from_user)
        clear_user_cart(bot_id, user_id)
        await callback.answer("🗑 Корзина очищена")
        await handle_view_cart(callback.message, bot_id)
    elif callback.data == "warehouse_booking":
        await handle_warehouse_booking_start(callback.message, bot_id, state)
        await callback.answer()
    elif callback.data.startswith("warehouse_date:"):
        await handle_warehouse_date_selected(callback, bot_id, state)
    elif callback.data.startswith("warehouse_time:"):
        await handle_warehouse_time_selected(callback, bot_id, state)
    elif callback.data.startswith("warehouse_cancel:"):
        booking_id = int(callback.data.split(":")[1])
        
        # Получить информацию о бронировании перед отменой
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = f'''SELECT * FROM t_p5255237_telegram_bot_service.warehouse_bookings 
                   WHERE id = {booking_id}'''
        cursor.execute(query)
        booking = cursor.fetchone()
        cursor.close()
        conn.close()
        
        success = cancel_warehouse_booking(booking_id)
        if success:
            await callback.answer("✅ Бронирование отменено", show_alert=True)
            
            # Уведомить администраторов об отмене
            if booking:
                bot_settings = get_bot_settings(bot_id)
                admin_ids = bot_settings.get('admin_telegram_ids', []) if bot_settings else []
                
                date_str = booking['booking_date'].strftime('%d.%m.%Y')
                time_str = str(booking['booking_time'])[:5]
                username = booking.get('telegram_username', 'без username')
                
                admin_notification = (
                    f"🔔 *Бронирование отменено клиентом*\n\n"
                    f"📅 Дата: {date_str}\n"
                    f"🕐 Время: {time_str}\n\n"
                    f"👤 Клиент:\n"
                    f"• Telegram: @{username} (ID: {booking['telegram_user_id']})\n"
                    f"• Телефон: {booking['user_phone']}\n"
                    f"• Компания: {booking['user_company']}\n\n"
                    f"🚚 Транспорт: {booking['vehicle_type']}\n"
                    f"📦 Груз: {booking['cargo_description']}"
                )
                
                for admin_id in admin_ids:
                    try:
                        await bot.send_message(admin_id, admin_notification, parse_mode='Markdown')
                    except:
                        pass
            
            await handle_warehouse_my_bookings(callback.message, bot_id)
        else:
            await callback.answer("❌ Ошибка при отмене", show_alert=True)
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
    
    @dp.message(BotStates.waiting_for_last_name)
    async def last_name_handler(message: types.Message, state: FSMContext):
        await process_last_name(message, state)
    
    @dp.message(BotStates.waiting_for_first_name)
    async def first_name_handler(message: types.Message, state: FSMContext):
        await process_first_name(message, state)
    
    @dp.message(BotStates.waiting_for_phone)
    async def phone_handler(message: types.Message, state: FSMContext):
        await process_phone_and_create_payment(message, state, bot)
    
    @dp.message(BotStates.warehouse_entering_phone)
    async def warehouse_phone_handler(message: types.Message, state: FSMContext):
        await process_warehouse_phone(message, state)
    
    @dp.message(BotStates.warehouse_entering_company)
    async def warehouse_company_handler(message: types.Message, state: FSMContext):
        await process_warehouse_company(message, state)
    
    @dp.message(BotStates.warehouse_entering_vehicle)
    async def warehouse_vehicle_handler(message: types.Message, state: FSMContext):
        await process_warehouse_vehicle(message, state)
    
    @dp.message(BotStates.warehouse_entering_cargo)
    async def warehouse_cargo_handler(message: types.Message, state: FSMContext):
        await process_warehouse_cargo_and_confirm(message, state, bot)
    
    @dp.message(F.text)
    async def text_handler(message: types.Message, state: FSMContext):
        bot_settings = get_bot_settings(bot_id)
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        button_texts = bot_settings.get('button_texts', {}) if bot_settings else {}
        bot_template = bot_settings.get('template', 'keys') if bot_settings else 'keys'
        
        text = message.text
        
        print(f"[DEBUG Bot {bot_id}] Received text: '{text}'")
        print(f"[DEBUG Bot {bot_id}] Payment enabled: {payment_enabled}")
        print(f"[DEBUG Bot {bot_id}] Button texts: {button_texts}")
        print(f"[DEBUG Bot {bot_id}] Template: {bot_template}")
        
        if bot_template == 'keys':
            free_key_text = button_texts.get('free_key', '🎁 Получить бесплатный ключ')
            if text == free_key_text or text == '🎁 Получить бесплатный ключ':
                await handle_free_key(message, bot_id)
                return
            
            if payment_enabled:
                secret_shop_text = button_texts.get('secret_shop', '🔐 Узнать про Тайную витрину')
                if text == secret_shop_text or text == '🔐 Узнать про Тайную витрину':
                    await handle_secret_shop(message, bot_id)
                    return
                
                buy_vip_text = button_texts.get('buy_vip', '💎 Купить VIP-ключ')
                if text == buy_vip_text or text == '💎 Купить VIP-ключ':
                    await handle_buy_vip(message, bot_id, state, bot)
                    return
            
            privacy_text = button_texts.get('privacy', '📄 Согласие на обработку данных')
            if text == privacy_text or text == '📄 Согласие на обработку данных':
                await handle_privacy_policy(message, bot_id)
                return
            
            help_text = button_texts.get('help', '❓ Помощь')
            if text == help_text or text == '❓ Помощь':
                await handle_help(message)
                return
        
        if bot_template == 'shop':
            if text == '🛍 Каталог' or text == '🛍️ Каталог товаров':
                await handle_shop_catalog(message, bot_id)
                return
            
            if text == '🛒 Корзина':
                await handle_view_cart(message, bot_id)
                return
            
            if text == '⬅ Главное меню':
                await cmd_start(message, bot_id)
                return
            
            categories = get_shop_categories(bot_id)
            for cat in categories:
                emoji = cat.get('emoji', '📦')
                button_text = f"{emoji} {cat['name']}"
                if text == button_text or text == cat['name']:
                    await handle_category_products(message, bot_id, cat['name'])
                    return
        
        if bot_template == 'warehouse':
            if text == '📅 Забронировать время':
                await handle_warehouse_booking_start(message, bot_id, state)
                return
            
            if text == '📋 Мои бронирования':
                await handle_warehouse_my_bookings(message, bot_id)
                return
            
            if text == 'ℹ️ Информация':
                await handle_warehouse_info(message, bot_id)
                return
    
    @dp.callback_query()
    async def callback_handler_wrapper(callback: types.CallbackQuery, state: FSMContext):
        await callback_handler(callback, bot_id, state, bot)
    
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

async def process_update(bot_id: int, update_data: Dict[str, Any]) -> None:
    '''Обрабатывает один Update от Telegram webhook'''
    # Получаем данные бота
    bot_settings = get_bot_settings(bot_id)
    if not bot_settings:
        print(f"[ERROR] Bot {bot_id} not found")
        return
    
    bot = Bot(token=bot_settings['telegram_token'])
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)
    
    # Регистрируем все обработчики (копия из run_bot)
    @dp.message(Command("start"))
    async def start_handler(message: types.Message, state: FSMContext):
        await cmd_start(message, bot_id)
        await state.clear()
    
    @dp.message(BotStates.waiting_for_last_name)
    async def last_name_handler(message: types.Message, state: FSMContext):
        await process_last_name(message, state)
    
    @dp.message(BotStates.waiting_for_first_name)
    async def first_name_handler(message: types.Message, state: FSMContext):
        await process_first_name(message, state)
    
    @dp.message(BotStates.waiting_for_phone)
    async def phone_handler(message: types.Message, state: FSMContext):
        await process_phone_and_create_payment(message, state, bot)
    
    @dp.message(BotStates.warehouse_entering_phone)
    async def warehouse_phone_handler(message: types.Message, state: FSMContext):
        await process_warehouse_phone(message, state)
    
    @dp.message(BotStates.warehouse_entering_company)
    async def warehouse_company_handler(message: types.Message, state: FSMContext):
        await process_warehouse_company(message, state)
    
    @dp.message(BotStates.warehouse_entering_vehicle)
    async def warehouse_vehicle_handler(message: types.Message, state: FSMContext):
        await process_warehouse_vehicle(message, state)
    
    @dp.message(BotStates.warehouse_entering_cargo)
    async def warehouse_cargo_handler(message: types.Message, state: FSMContext):
        await process_warehouse_cargo_and_confirm(message, state, bot)
    
    @dp.message(F.text)
    async def text_handler(message: types.Message, state: FSMContext):
        bot_settings = get_bot_settings(bot_id)
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        button_texts = bot_settings.get('button_texts', {}) if bot_settings else {}
        bot_template = bot_settings.get('template', 'keys') if bot_settings else 'keys'
        
        text = message.text
        
        print(f"[DEBUG Bot {bot_id}] Received text: '{text}'")
        print(f"[DEBUG Bot {bot_id}] Payment enabled: {payment_enabled}")
        print(f"[DEBUG Bot {bot_id}] Button texts: {button_texts}")
        print(f"[DEBUG Bot {bot_id}] Template: {bot_template}")
        
        if bot_template == 'keys':
            free_key_text = button_texts.get('free_key', '🎁 Получить бесплатный ключ')
            if text == free_key_text or text == '🎁 Получить бесплатный ключ':
                await handle_free_key(message, bot_id)
                return
            
            if payment_enabled:
                secret_shop_text = button_texts.get('secret_shop', '🔐 Узнать про Тайную витрину')
                if text == secret_shop_text or text == '🔐 Узнать про Тайную витрину':
                    await handle_secret_shop(message, bot_id)
                    return
                
                buy_vip_text = button_texts.get('buy_vip', '💎 Купить VIP-ключ')
                if text == buy_vip_text or text == '💎 Купить VIP-ключ':
                    await handle_buy_vip(message, bot_id, state, bot)
                    return
            
            privacy_text = button_texts.get('privacy', '📄 Согласие на обработку данных')
            if text == privacy_text or text == '📄 Согласие на обработку данных':
                await handle_privacy_policy(message, bot_id)
                return
            
            help_text = button_texts.get('help', '❓ Помощь')
            if text == help_text or text == '❓ Помощь':
                await handle_help(message)
                return
        
        if bot_template == 'shop':
            if text == '🛍 Каталог' or text == '🛍️ Каталог товаров':
                await handle_shop_catalog(message, bot_id)
                return
            
            if text == '🛒 Корзина':
                await handle_view_cart(message, bot_id)
                return
            
            if text == '⬅ Главное меню':
                await cmd_start(message, bot_id)
                return
            
            categories = get_shop_categories(bot_id)
            for cat in categories:
                emoji = cat.get('emoji', '📦')
                button_text = f"{emoji} {cat['name']}"
                if text == button_text or text == cat['name']:
                    await handle_category_products(message, bot_id, cat['name'])
                    return
        
        if bot_template == 'warehouse':
            if text == '📅 Забронировать время':
                await handle_warehouse_booking_start(message, bot_id, state)
                return
            
            if text == '📋 Мои бронирования':
                await handle_warehouse_my_bookings(message, bot_id)
                return
            
            if text == 'ℹ️ Информация':
                await handle_warehouse_info(message, bot_id)
                return
    
    @dp.callback_query()
    async def callback_handler_wrapper(callback: types.CallbackQuery, state: FSMContext):
        await callback_handler(callback, bot_id, state, bot)
    
    # Обрабатываем Update
    update = types.Update(**update_data)
    await dp.feed_update(bot, update)

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
        # Логируем полный event для отладки
        print(f"[DEBUG WEBHOOK] Full event received: {json.dumps(event, default=str)}")
        
        # Извлекаем bot_id - он всегда последний сегмент URL после /webhook/
        bot_id = None
        
        # Получаем все возможные источники path
        paths_to_check = [
            event.get('url', ''),
            event.get('requestContext', {}).get('http', {}).get('path', ''),
            event.get('path', ''),
        ]
        
        print(f"[DEBUG WEBHOOK] Paths to check: {paths_to_check}")
        
        # Ищем bot_id в любом из путей
        for path in paths_to_check:
            if path and isinstance(path, str):
                # Убираем query string если есть
                path = path.split('?')[0]
                # Берём последний сегмент пути
                segments = [s for s in path.split('/') if s]
                if segments:
                    try:
                        # Если последний сегмент - число, это bot_id
                        bot_id = int(segments[-1])
                        break
                    except:
                        pass
        
        # Если bot_id не найден, возвращаем понятный ответ Telegram
        if not bot_id:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'ok': False, 'description': 'Bot ID not found in URL'}),
                'isBase64Encoded': False
            }
        
        # Получаем Update из body
        body_str = event.get('body', '{}') or '{}'
        update_data = json.loads(body_str) if body_str else {}
        
        # Проверяем что бот активен
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
        
        # Обрабатываем Update
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(process_update(bot_id, update_data))
            loop.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        except Exception as e:
            print(f"[ERROR] Processing update: {e}")
            import traceback
            traceback.print_exc()
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)}),
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