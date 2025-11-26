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

def create_main_menu_keyboard(payment_enabled: bool = True) -> ReplyKeyboardMarkup:
    '''Создает главное меню с кнопками'''
    keyboard_buttons = [
        [KeyboardButton(text="🎁 Получить бесплатный ключ")],
    ]
    
    if payment_enabled:
        keyboard_buttons.extend([
            [KeyboardButton(text="🔐 Узнать про Тайную витрину")],
            [KeyboardButton(text="💎 Купить VIP-ключ")],
            [KeyboardButton(text="📄 Согласие на обработку данных")],
            [KeyboardButton(text="❓ Помощь")]
        ])
    
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
    
    welcome_text = (
        "🚀 Привет! Я бот POLYTOPE.\n\n"
        "Здесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине "
        "на нашей закрытой распродаже с 21 по 23 ноября.\n\n"
        "Выберите действие:"
    )
    
    await message.answer(welcome_text, reply_markup=create_main_menu_keyboard(payment_enabled))

async def handle_free_key(message: types.Message, bot_id: int):
    '''Обработка запроса бесплатного ключа'''
    user_id = register_telegram_user(bot_id, message.from_user)
    telegram_user_id = message.from_user.id
    qr_key = get_free_qr_key(bot_id, user_id, telegram_user_id)
    
    bot_settings = get_bot_settings(bot_id)
    message_texts = bot_settings.get('message_texts', {}) if bot_settings else {}
    
    print(f"[DEBUG] Bot {bot_id} message_texts: {message_texts}")
    
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
        
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        keyboard_buttons = []
        
        if payment_enabled:
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
    
    unique_code = f"USER_{telegram_user_id}_{bot_id}"
    
    success = save_privacy_consent(bot_id, user_id, telegram_user_id, privacy_text, unique_code)
    
    if success:
        await callback.message.edit_text(
            "✅ Спасибо! Ваше согласие принято и сохранено.\n\n"
            f"Ваш уникальный код: {unique_code}",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 В главное меню", callback_data="main_menu")]
            ])
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
        bot_settings = get_bot_settings(bot_id)
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        if not payment_enabled:
            return
        await handle_secret_shop(message, bot_id)
    
    @dp.message(F.text == "💎 Купить VIP-ключ")
    async def buy_vip_handler(message: types.Message, state: FSMContext):
        bot_settings = get_bot_settings(bot_id)
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        if not payment_enabled:
            return
        await handle_buy_vip(message, bot_id, state, bot)
    
    @dp.message(F.text == "📄 Согласие на обработку данных")
    async def privacy_handler(message: types.Message):
        bot_settings = get_bot_settings(bot_id)
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        if not payment_enabled:
            return
        await handle_privacy_policy(message, bot_id)
    
    @dp.message(F.text == "❓ Помощь")
    async def help_handler(message: types.Message):
        bot_settings = get_bot_settings(bot_id)
        payment_enabled = bot_settings.get('payment_enabled', True) if bot_settings else True
        if not payment_enabled:
            return
        await handle_help(message)
    
    @dp.message(BotStates.waiting_for_last_name)
    async def last_name_handler(message: types.Message, state: FSMContext):
        await process_last_name(message, state)
    
    @dp.message(BotStates.waiting_for_first_name)
    async def first_name_handler(message: types.Message, state: FSMContext):
        await process_first_name(message, state)
    
    @dp.message(BotStates.waiting_for_phone)
    async def phone_handler(message: types.Message, state: FSMContext):
        await process_phone_and_create_payment(message, state, bot)
    
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