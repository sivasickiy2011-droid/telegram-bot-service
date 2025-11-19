import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import qrcode
from io import BytesIO
import base64
import requests

def get_db_connection():
    '''Создает подключение к базе данных'''
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(database_url)

def get_owner_telegram_id(bot_id: int) -> Optional[int]:
    '''Получить Telegram ID владельца бота'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f'''SELECT u.telegram_id 
               FROM t_p5255237_telegram_bot_service.bots b
               JOIN t_p5255237_telegram_bot_service.users u ON b.user_id = u.id
               WHERE b.id = {bot_id}'''
    cursor.execute(query)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return result['telegram_id'] if result else None

def is_user_admin(bot_id: int, telegram_user_id: int) -> bool:
    '''Проверить является ли пользователь администратором бота'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f'''SELECT is_admin FROM t_p5255237_telegram_bot_service.bot_users 
               WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}'''
    cursor.execute(query)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return result and result.get('is_admin', False)

def get_bot_by_token(token: str) -> Optional[Dict]:
    '''Получить бота по токену'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    token_escaped = token.replace("'", "''")
    query = f'''SELECT * FROM t_p5255237_telegram_bot_service.bots 
               WHERE telegram_token = '{token_escaped}' 
               AND status = 'active' 
               AND moderation_status = 'approved' '''
    cursor.execute(query)
    bot = cursor.fetchone()
    cursor.close()
    conn.close()
    return dict(bot) if bot else None

def register_telegram_user(bot_id: int, user_data: Dict, owner_telegram_id: int = None) -> int:
    '''Регистрирует пользователя Telegram в базе данных и проверяет администратора'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    user_id = user_data.get('id')
    username = user_data.get('username', '')
    first_name = user_data.get('first_name', '')
    last_name = user_data.get('last_name', '')
    
    username_escaped = username.replace("'", "''")
    first_name_escaped = first_name.replace("'", "''")
    last_name_escaped = last_name.replace("'", "''")
    
    check_query = f'''SELECT id, is_admin FROM t_p5255237_telegram_bot_service.bot_users 
                     WHERE bot_id = {bot_id} AND telegram_user_id = {user_id}'''
    cursor.execute(check_query)
    existing = cursor.fetchone()
    
    is_admin = owner_telegram_id and user_id == owner_telegram_id
    
    if existing:
        db_user_id = existing['id']
        if is_admin and not existing.get('is_admin'):
            update_query = f'''UPDATE t_p5255237_telegram_bot_service.bot_users 
                              SET is_admin = true WHERE id = {db_user_id}'''
            cursor.execute(update_query)
            conn.commit()
    else:
        insert_query = f'''INSERT INTO t_p5255237_telegram_bot_service.bot_users 
                          (bot_id, telegram_user_id, username, first_name, last_name, is_admin)
                          VALUES ({bot_id}, {user_id}, '{username_escaped}', '{first_name_escaped}', '{last_name_escaped}', {is_admin})
                          RETURNING id'''
        cursor.execute(insert_query)
        db_user_id = cursor.fetchone()['id']
        conn.commit()
    
    cursor.close()
    conn.close()
    return db_user_id

def get_user_state(bot_id: int, telegram_user_id: int) -> Optional[Dict]:
    '''Получить состояние пользователя'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f'''SELECT * FROM t_p5255237_telegram_bot_service.user_states 
               WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}'''
    cursor.execute(query)
    state = cursor.fetchone()
    cursor.close()
    conn.close()
    return dict(state) if state else None

def set_user_state(bot_id: int, telegram_user_id: int, state: str, data: Dict = None):
    '''Установить состояние пользователя'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    data_json = json.dumps(data or {}).replace("'", "''")
    state_escaped = state.replace("'", "''")
    
    query = f'''INSERT INTO t_p5255237_telegram_bot_service.user_states 
               (bot_id, telegram_user_id, state, data, updated_at)
               VALUES ({bot_id}, {telegram_user_id}, '{state_escaped}', '{data_json}'::jsonb, CURRENT_TIMESTAMP)
               ON CONFLICT (bot_id, telegram_user_id) 
               DO UPDATE SET state = '{state_escaped}', data = '{data_json}'::jsonb, updated_at = CURRENT_TIMESTAMP'''
    cursor.execute(query)
    conn.commit()
    cursor.close()
    conn.close()

def clear_user_state(bot_id: int, telegram_user_id: int):
    '''Очистить состояние пользователя'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = f'''UPDATE t_p5255237_telegram_bot_service.user_states 
               SET state = 'idle', data = '{{}}'::jsonb, updated_at = CURRENT_TIMESTAMP
               WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}'''
    cursor.execute(query)
    conn.commit()
    cursor.close()
    conn.close()

def get_free_qr_key(bot_id: int, user_id: int, telegram_user_id: int) -> Optional[Dict]:
    '''Получить свободный бесплатный QR-ключ с проверкой ограничений'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    check_user_query = f'''SELECT received_free_qr, is_admin FROM t_p5255237_telegram_bot_service.bot_users 
                          WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}'''
    cursor.execute(check_user_query)
    user_info = cursor.fetchone()
    
    if not user_info:
        cursor.close()
        conn.close()
        return None
    
    if user_info['received_free_qr'] and not user_info['is_admin']:
        cursor.close()
        conn.close()
        return {'already_received': True}
    
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
        
        if not user_info['is_admin']:
            mark_user_query = f'''UPDATE t_p5255237_telegram_bot_service.bot_users 
                                 SET received_free_qr = true, free_qr_received_at = CURRENT_TIMESTAMP 
                                 WHERE bot_id = {bot_id} AND telegram_user_id = {telegram_user_id}'''
            cursor.execute(mark_user_query)
        
        conn.commit()
    
    cursor.close()
    conn.close()
    return dict(qr_code) if qr_code else None

def generate_qr_base64(code_number: int) -> str:
    '''Генерирует QR-код как base64 строку'''
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f'POLYTOPE_KEY_{code_number}')
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    bio = BytesIO()
    img.save(bio, 'PNG')
    bio.seek(0)
    return base64.b64encode(bio.read()).decode()

def send_telegram_message(token: str, chat_id: int, text: str, reply_markup: Dict = None):
    '''Отправляет сообщение в Telegram'''
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        data['reply_markup'] = reply_markup
    
    response = requests.post(url, json=data)
    return response.json()

def send_telegram_photo(token: str, chat_id: int, photo_base64: str, caption: str, reply_markup: Dict = None):
    '''Отправляет фото в Telegram'''
    url = f'https://api.telegram.org/bot{token}/sendPhoto'
    
    files = {'photo': ('qr.png', base64.b64decode(photo_base64), 'image/png')}
    data = {
        'chat_id': chat_id,
        'caption': caption,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    response = requests.post(url, data=data, files=files)
    return response.json()

def create_main_menu_keyboard(bot_id: int = None, telegram_user_id: int = None) -> Dict:
    '''Создает главное меню с кнопками (с дополнительными кнопками для администратора)'''
    buttons = [
        [{'text': '🎁 Получить бесплатный ключ'}],
        [{'text': '🔐 Узнать про Тайную витрину'}],
        [{'text': '💎 Купить VIP-ключ'}]
    ]
    
    if bot_id and telegram_user_id and is_user_admin(bot_id, telegram_user_id):
        buttons.append([{'text': '👑 Получить бесплатный VIP-ключ (Админ)'}])
        buttons.append([{'text': '📊 Статистика'}])
    
    buttons.append([{'text': '❓ Помощь'}])
    
    return {
        'keyboard': buttons,
        'resize_keyboard': True
    }

def create_inline_keyboard(buttons: list) -> Dict:
    '''Создает inline клавиатуру'''
    return {
        'inline_keyboard': buttons
    }

def handle_start(bot_data: Dict, message: Dict):
    '''Обработка команды /start'''
    chat_id = message['chat']['id']
    user = message['from']
    
    owner_telegram_id = get_owner_telegram_id(bot_data['id'])
    register_telegram_user(bot_data['id'], user, owner_telegram_id)
    
    text = (
        "🚀 Привет! Я бот POLYTOPE.\n\n"
        "Здесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине "
        "на нашей закрытой распродаже с 21 по 23 ноября.\n\n"
        "Выберите действие:"
    )
    
    keyboard = create_main_menu_keyboard(bot_data['id'], user['id'])
    send_telegram_message(bot_data['telegram_token'], chat_id, text, keyboard)

def handle_free_key(bot_data: Dict, message: Dict):
    '''Обработка запроса бесплатного ключа'''
    chat_id = message['chat']['id']
    user = message['from']
    
    owner_telegram_id = get_owner_telegram_id(bot_data['id'])
    user_id = register_telegram_user(bot_data['id'], user, owner_telegram_id)
    qr_key = get_free_qr_key(bot_data['id'], user_id, user['id'])
    
    if qr_key and qr_key.get('already_received'):
        text = (
            "✅ Вы уже получили свой бесплатный ключ!\n\n"
            "Каждый пользователь может получить только один бесплатный ключ.\n\n"
            "Но вы можете приобрести VIP-ключ для доступа к Тайной витрине!"
        )
        
        inline_keyboard = create_inline_keyboard([
            [{'text': '💎 Купить VIP-ключ', 'callback_data': 'buy_vip'}]
        ])
        
        send_telegram_message(bot_data['telegram_token'], chat_id, text, inline_keyboard)
        return
    
    if qr_key:
        qr_base64 = generate_qr_base64(qr_key['code_number'])
        
        caption = (
            f"✅ Ваш бесплатный ключ №{qr_key['code_number']}\n\n"
            f"Покажите этот QR-код на кассе:\n"
            f"• Участвуете в розыгрыше подарка\n"
            f"• Получаете право на участие в Чёрной пятнице"
        )
        
        inline_keyboard = create_inline_keyboard([
            [{'text': '🔐 Что такое Тайная витрина?', 'callback_data': 'secret_shop'}],
            [{'text': '💎 Купить VIP-ключ', 'callback_data': 'buy_vip'}]
        ])
        
        send_telegram_photo(bot_data['telegram_token'], chat_id, qr_base64, caption, inline_keyboard)
    else:
        text = (
            "😔 Бесплатные ключи на сегодня закончились.\n\n"
            "Но вы всё ещё можете получить VIP-ключ и попасть в Тайную витрину!"
        )
        
        inline_keyboard = create_inline_keyboard([
            [{'text': '💎 Купить VIP-ключ', 'callback_data': 'buy_vip'}]
        ])
        
        send_telegram_message(bot_data['telegram_token'], chat_id, text, inline_keyboard)

def handle_secret_shop(bot_data: Dict, chat_id: int):
    '''Информация о Тайной витрине'''
    text = (
        "🔐 Тайная витрина — это эксклюзивная закрытая распродажа!\n\n"
        "📅 Даты: 21-23 ноября\n"
        "💎 Доступ: Только с VIP-ключом\n"
        "🎁 Специальные предложения и скидки до 70%\n\n"
        "VIP-ключ открывает доступ к товарам, которых нет в обычном магазине."
    )
    
    inline_keyboard = create_inline_keyboard([
        [{'text': '💎 Купить VIP-ключ', 'callback_data': 'buy_vip'}]
    ])
    
    send_telegram_message(bot_data['telegram_token'], chat_id, text, inline_keyboard)

def handle_buy_vip(bot_data: Dict, chat_id: int):
    '''Обработка покупки VIP-ключа'''
    payment_enabled = bot_data.get('payment_enabled', False)
    terminal_key = bot_data.get('tbank_terminal_key')
    password = bot_data.get('tbank_password')
    vip_price = bot_data.get('vip_price', 500)
    vip_purchase_message = bot_data.get('vip_purchase_message', 'VIP-ключ открывает доступ к эксклюзивным материалам и привилегиям.')
    
    if not payment_enabled or not terminal_key or not password:
        text = (
            "💎 VIP-ключ дает доступ к Тайной витрине!\n\n"
            "⚠️ Оплата временно недоступна. Обратитесь к администратору."
        )
        send_telegram_message(bot_data['telegram_token'], chat_id, text)
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
    
    text += "\n✅ Для оплаты нажмите кнопку ниже"
    
    # Кнопки
    inline_keyboard = create_inline_keyboard([
        [{'text': '✅ Оплатить VIP-ключ', 'callback_data': 'start_payment'}],
        [{'text': '⬅ Вернуться назад', 'callback_data': 'main_menu'}]
    ])
    
    send_telegram_message(bot_data['telegram_token'], chat_id, text, inline_keyboard)

def handle_help(bot_data: Dict, chat_id: int):
    '''Помощь пользователю'''
    text = (
        "❓ Как пользоваться ботом:\n\n"
        "🎁 Получить бесплатный ключ - выдает QR-код (номера 1-500)\n"
        "🔐 Узнать про Тайную витрину - информация о закрытой распродаже\n"
        "💎 Купить VIP-ключ - получить доступ к эксклюзивным товарам\n\n"
        "По всем вопросам пишите в поддержку."
    )
    send_telegram_message(bot_data['telegram_token'], chat_id, text)

def handle_admin_free_vip(bot_data: Dict, message: Dict):
    '''Выдача бесплатного VIP-ключа для администратора'''
    chat_id = message['chat']['id']
    user = message['from']
    telegram_user_id = user['id']
    
    if not is_user_admin(bot_data['id'], telegram_user_id):
        text = "⚠️ Эта функция доступна только администратору бота."
        send_telegram_message(bot_data['telegram_token'], chat_id, text)
        return
    
    owner_telegram_id = get_owner_telegram_id(bot_data['id'])
    user_id = register_telegram_user(bot_data['id'], user, owner_telegram_id)
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    qr_query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
                  WHERE bot_id = {bot_data['id']} AND code_type = 'vip' AND is_used = false 
                  ORDER BY code_number LIMIT 1'''
    cursor.execute(qr_query)
    qr_code = cursor.fetchone()
    
    if qr_code:
        update_query = f'''UPDATE t_p5255237_telegram_bot_service.qr_codes 
                          SET is_used = true, used_by_user_id = {user_id}, used_at = CURRENT_TIMESTAMP 
                          WHERE id = {qr_code['id']}'''
        cursor.execute(update_query)
        conn.commit()
        cursor.close()
        conn.close()
        
        qr_base64 = generate_qr_base64(qr_code['code_number'])
        
        caption = (
            f"👑 Ваш VIP QR-код №{qr_code['code_number']} (Админ)\n\n"
            f"Покажите этот код на кассе для получения доступа к VIP-товарам"
        )
        
        send_telegram_photo(bot_data['telegram_token'], chat_id, qr_base64, caption)
    else:
        cursor.close()
        conn.close()
        text = "😔 VIP-ключи закончились."
        send_telegram_message(bot_data['telegram_token'], chat_id, text)

def handle_stats(bot_data: Dict, chat_id: int, telegram_user_id: int):
    '''Показать статистику по ключам (только для администратора)'''
    if not is_user_admin(bot_data['id'], telegram_user_id):
        text = "⚠️ Эта команда доступна только администратору бота."
        send_telegram_message(bot_data['telegram_token'], chat_id, text)
        return
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Статистика по бесплатным ключам
        free_total_query = f'''SELECT COUNT(*) as total FROM t_p5255237_telegram_bot_service.qr_codes 
                              WHERE bot_id = {bot_data['id']} AND code_type = 'free' '''
        cursor.execute(free_total_query)
        free_total = cursor.fetchone()['total']
        
        free_used_query = f'''SELECT COUNT(*) as used FROM t_p5255237_telegram_bot_service.qr_codes 
                             WHERE bot_id = {bot_data['id']} AND code_type = 'free' AND is_used = true'''
        cursor.execute(free_used_query)
        free_used = cursor.fetchone()['used']
        
        free_available = free_total - free_used
        
        # Статистика по VIP ключам
        vip_total_query = f'''SELECT COUNT(*) as total FROM t_p5255237_telegram_bot_service.qr_codes 
                             WHERE bot_id = {bot_data['id']} AND code_type = 'vip' '''
        cursor.execute(vip_total_query)
        vip_total = cursor.fetchone()['total']
        
        vip_used_query = f'''SELECT COUNT(*) as used FROM t_p5255237_telegram_bot_service.qr_codes 
                            WHERE bot_id = {bot_data['id']} AND code_type = 'vip' AND is_used = true'''
        cursor.execute(vip_used_query)
        vip_used = cursor.fetchone()['used']
        
        vip_available = vip_total - vip_used
        
        # Статистика по пользователям
        users_total_query = f'''SELECT COUNT(*) as total FROM t_p5255237_telegram_bot_service.bot_users 
                               WHERE bot_id = {bot_data['id']}'''
        cursor.execute(users_total_query)
        users_total = cursor.fetchone()['total']
        
        users_with_free_query = f'''SELECT COUNT(*) as count FROM t_p5255237_telegram_bot_service.bot_users 
                                   WHERE bot_id = {bot_data['id']} AND received_free_qr = true'''
        cursor.execute(users_with_free_query)
        users_with_free = cursor.fetchone()['count']
        
        users_with_vip_query = f'''SELECT COUNT(*) as count FROM t_p5255237_telegram_bot_service.bot_users 
                                  WHERE bot_id = {bot_data['id']} AND received_vip_qr = true'''
        cursor.execute(users_with_vip_query)
        users_with_vip = cursor.fetchone()['count']
        
        # Статистика по платежам
        payments_total_query = f'''SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as sum 
                                  FROM t_p5255237_telegram_bot_service.payments 
                                  WHERE bot_id = {bot_data['id']}'''
        cursor.execute(payments_total_query)
        payments_data = cursor.fetchone()
        payments_total = payments_data['total']
        payments_sum = payments_data['sum']
        
        payments_confirmed_query = f'''SELECT COUNT(*) as confirmed, COALESCE(SUM(amount), 0) as sum 
                                      FROM t_p5255237_telegram_bot_service.payments 
                                      WHERE bot_id = {bot_data['id']} AND status = 'CONFIRMED' '''
        cursor.execute(payments_confirmed_query)
        payments_confirmed_data = cursor.fetchone()
        payments_confirmed = payments_confirmed_data['confirmed']
        payments_confirmed_sum = payments_confirmed_data['sum']
        
        # Платежи за сегодня
        payments_today_query = f'''SELECT COUNT(*) as today, COALESCE(SUM(amount), 0) as sum 
                                  FROM t_p5255237_telegram_bot_service.payments 
                                  WHERE bot_id = {bot_data['id']} AND created_at >= CURRENT_DATE'''
        cursor.execute(payments_today_query)
        payments_today_data = cursor.fetchone()
        payments_today = payments_today_data['today']
        payments_today_sum = payments_today_data['sum']
        
        cursor.close()
        conn.close()
        
        # Формируем сообщение
        text = (
            f"📊 <b>Статистика бота</b>\n\n"
            f"<b>🎁 Бесплатные ключи:</b>\n"
            f"├ Всего: {free_total}\n"
            f"├ Выдано: {free_used}\n"
            f"└ Осталось: {free_available}\n\n"
            f"<b>💎 VIP-ключи:</b>\n"
            f"├ Всего: {vip_total}\n"
            f"├ Выдано: {vip_used}\n"
            f"└ Осталось: {vip_available}\n\n"
            f"<b>👥 Пользователи:</b>\n"
            f"├ Всего: {users_total}\n"
            f"├ Получили бесплатный ключ: {users_with_free}\n"
            f"└ Получили VIP-ключ: {users_with_vip}\n\n"
            f"<b>💳 Платежи:</b>\n"
            f"├ Всего попыток: {payments_total} ({payments_sum} ₽)\n"
            f"├ Подтверждено: {payments_confirmed} ({payments_confirmed_sum} ₽)\n"
            f"└ За сегодня: {payments_today} ({payments_today_sum} ₽)\n"
        )
        
        send_telegram_message(bot_data['telegram_token'], chat_id, text)
        
    except Exception as e:
        send_telegram_message(bot_data['telegram_token'], chat_id, f"⚠️ Ошибка при получении статистики: {str(e)}")

def handle_check_payment(bot_data: Dict, chat_id: int, telegram_user_id: int):
    '''Проверка статуса всех платежей пользователя за сегодня'''
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем внутренний user_id и проверяем статус VIP
        user_query = f'''SELECT id, received_vip_qr, is_admin FROM t_p5255237_telegram_bot_service.bot_users 
                        WHERE bot_id = {bot_data['id']} AND telegram_user_id = {telegram_user_id}'''
        cursor.execute(user_query)
        user_record = cursor.fetchone()
        
        if not user_record:
            cursor.close()
            conn.close()
            send_telegram_message(bot_data['telegram_token'], chat_id, "⚠️ Ошибка: пользователь не найден")
            return
        
        user_id = user_record['id']
        is_admin = user_record.get('is_admin', False)
        already_received_vip = user_record.get('received_vip_qr', False)
        
        if already_received_vip and not is_admin:
            send_telegram_message(bot_data['telegram_token'], chat_id, 
                "✅ Вы уже получили свой VIP-ключ!\n\nКаждый пользователь может получить только один VIP-ключ за оплату.")
            cursor.close()
            conn.close()
            return
        
        # Получаем все платежи пользователя за сегодня со статусом NEW, AUTHORIZED
        payments_query = f'''SELECT order_id, payment_id, status, amount 
                            FROM t_p5255237_telegram_bot_service.payments 
                            WHERE bot_id = {bot_data['id']} 
                            AND telegram_user_id = {telegram_user_id}
                            AND status IN ('NEW', 'AUTHORIZED')
                            AND created_at >= CURRENT_DATE
                            ORDER BY created_at DESC'''
        cursor.execute(payments_query)
        payments = cursor.fetchall()
        
        if not payments:
            send_telegram_message(bot_data['telegram_token'], chat_id, "⚠️ У вас нет активных платежей за сегодня")
            cursor.close()
            conn.close()
            return
        
        confirmed_count = 0
        
        # Проверяем каждый платёж
        for payment in payments:
            order_id = payment['order_id']
            
            try:
                # Запрашиваем статус платежа через API
                response = requests.post(
                    'https://functions.poehali.dev/b4079ccb-abcb-4171-b656-2462d93e1ac9',
                    json={'order_id': order_id},
                    timeout=10
                )
                result = response.json()
                
                if result.get('confirmed'):
                    confirmed_count += 1
                    
                    # Получаем свободный VIP QR-ключ
                    qr_query = f'''SELECT * FROM t_p5255237_telegram_bot_service.qr_codes 
                                  WHERE bot_id = {bot_data['id']} AND code_type = 'vip' AND is_used = false 
                                  ORDER BY code_number LIMIT 1'''
                    cursor.execute(qr_query)
                    qr_code = cursor.fetchone()
                    
                    if qr_code:
                        # Помечаем ключ как использованный
                        update_query = f'''UPDATE t_p5255237_telegram_bot_service.qr_codes 
                                          SET is_used = true, used_by_user_id = {user_id}, used_at = CURRENT_TIMESTAMP 
                                          WHERE id = {qr_code['id']}'''
                        cursor.execute(update_query)
                        
                        # Помечаем что пользователь получил VIP-ключ (кроме админа)
                        if not is_admin:
                            mark_vip_query = f'''UPDATE t_p5255237_telegram_bot_service.bot_users 
                                               SET received_vip_qr = true, vip_qr_received_at = CURRENT_TIMESTAMP 
                                               WHERE bot_id = {bot_data['id']} AND telegram_user_id = {telegram_user_id}'''
                            cursor.execute(mark_vip_query)
                        
                        conn.commit()
                        
                        # Генерируем QR-код
                        qr_base64 = generate_qr_base64(qr_code['code_number'])
                        
                        caption = (
                            f"✅ Оплата подтверждена! Спасибо за покупку!\n\n"
                            f"💎 Ваш VIP QR-код №{qr_code['code_number']}\n\n"
                            f"Покажите этот код на кассе для получения доступа к VIP-товарам"
                        )
                        
                        send_telegram_photo(bot_data['telegram_token'], chat_id, qr_base64, caption)
                    else:
                        send_telegram_message(bot_data['telegram_token'], chat_id, "✅ Оплата подтверждена! Но VIP-ключи закончились. Обратитесь к администратору.")
                        
            except Exception as e:
                # Игнорируем ошибки отдельных платежей
                pass
        
        cursor.close()
        conn.close()
        
        if confirmed_count == 0:
            send_telegram_message(
                bot_data['telegram_token'], 
                chat_id, 
                f"⏳ Проверено платежей: {len(payments)}\n\nОплаты ещё не поступили. Попробуйте через минуту после оплаты."
            )
            
    except Exception as e:
        send_telegram_message(bot_data['telegram_token'], chat_id, f"⚠️ Ошибка при проверке статуса: {str(e)}")

def handle_start_payment(bot_data: Dict, chat_id: int, telegram_user_id: int):
    '''Начало процесса оплаты - запрос фамилии'''
    vip_price = bot_data.get('vip_price', 500)
    terminal_key = bot_data.get('tbank_terminal_key')
    password = bot_data.get('tbank_password')
    
    # Сохраняем данные в state
    set_user_state(bot_data['id'], telegram_user_id, 'waiting_last_name', {
        'vip_price': vip_price,
        'terminal_key': terminal_key,
        'password': password
    })
    
    text = "📝 Введите вашу <b>Фамилию</b>:"
    send_telegram_message(bot_data['telegram_token'], chat_id, text)

def handle_last_name_input(bot_data: Dict, chat_id: int, telegram_user_id: int, last_name: str):
    '''Обработка ввода фамилии'''
    user_state = get_user_state(bot_data['id'], telegram_user_id)
    if not user_state:
        return
    
    state_data = user_state.get('data', {})
    state_data['last_name'] = last_name
    
    set_user_state(bot_data['id'], telegram_user_id, 'waiting_first_name', state_data)
    
    text = "📝 Введите ваше <b>Имя</b>:"
    send_telegram_message(bot_data['telegram_token'], chat_id, text)

def handle_first_name_input(bot_data: Dict, chat_id: int, telegram_user_id: int, first_name: str):
    '''Обработка ввода имени'''
    user_state = get_user_state(bot_data['id'], telegram_user_id)
    if not user_state:
        return
    
    state_data = user_state.get('data', {})
    state_data['first_name'] = first_name
    
    set_user_state(bot_data['id'], telegram_user_id, 'waiting_phone', state_data)
    
    text = "📝 Введите ваш <b>Телефон</b> (например, +79001234567):"
    send_telegram_message(bot_data['telegram_token'], chat_id, text)

def handle_phone_input_and_create_payment(bot_data: Dict, chat_id: int, telegram_user_id: int, phone: str):
    '''Обработка телефона и создание платежа'''
    user_state = get_user_state(bot_data['id'], telegram_user_id)
    if not user_state:
        return
    
    state_data = user_state.get('data', {})
    last_name = state_data.get('last_name', '')
    first_name = state_data.get('first_name', '')
    vip_price = state_data.get('vip_price', 500)
    terminal_key = state_data.get('terminal_key', '')
    password = state_data.get('password', '')
    
    # Получаем внутренний user_id из bot_users
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    user_query = f'''SELECT id FROM t_p5255237_telegram_bot_service.bot_users 
                     WHERE bot_id = {bot_data['id']} AND telegram_user_id = {telegram_user_id}'''
    cursor.execute(user_query)
    user_record = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user_record:
        send_telegram_message(bot_data['telegram_token'], chat_id, "⚠️ Ошибка: пользователь не найден")
        clear_user_state(bot_data['id'], telegram_user_id)
        return
    
    user_id = user_record['id']
    
    # Создаём платёж
    import time
    order_id = f'vip_{bot_data["id"]}_{telegram_user_id}_{int(time.time())}'
    
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
    
    try:
        response = requests.post(
            'https://functions.poehali.dev/99bbc805-8eab-41cb-89c3-b0dd02989907',
            json=payment_data,
            timeout=10
        )
        result = response.json()
        
        if result.get('success') and result.get('payment_url'):
            payment_url = result['payment_url']
            payment_id = result.get('payment_id', order_id)
            
            # Сохраняем платёж в БД
            conn = get_db_connection()
            cursor = conn.cursor()
            
            phone_escaped = phone.replace("'", "''")
            first_name_escaped = first_name.replace("'", "''")
            last_name_escaped = last_name.replace("'", "''")
            order_id_escaped = order_id.replace("'", "''")
            payment_id_escaped = payment_id.replace("'", "''")
            payment_url_escaped = payment_url.replace("'", "''")
            
            query = f'''INSERT INTO t_p5255237_telegram_bot_service.payments 
                       (bot_id, user_id, telegram_user_id, order_id, payment_id, payment_url, amount, status, 
                        customer_phone, customer_first_name, customer_last_name, created_at)
                       VALUES ({bot_data["id"]}, {user_id}, {telegram_user_id}, '{order_id_escaped}', '{payment_id_escaped}', 
                               '{payment_url_escaped}', {vip_price}, 'NEW', '{phone_escaped}', 
                               '{first_name_escaped}', '{last_name_escaped}', CURRENT_TIMESTAMP)'''
            cursor.execute(query)
            conn.commit()
            cursor.close()
            conn.close()
            
            text = (
                f"✅ Данные получены!\n\n"
                f"👤 ФИО: {first_name} {last_name}\n"
                f"📱 Телефон: {phone}\n\n"
                f"💳 Нажмите кнопку для оплаты:"
            )
            
            inline_keyboard = create_inline_keyboard([
                [{'text': '💳 Оплатить', 'url': payment_url}],
                [{'text': '🔄 Проверить статус оплаты', 'callback_data': 'check_payment'}]
            ])
            
            send_telegram_message(bot_data['telegram_token'], chat_id, text, inline_keyboard)
            
            # Очищаем состояние
            clear_user_state(bot_data['id'], telegram_user_id)
        else:
            error_msg = result.get('error', 'Неизвестная ошибка')
            send_telegram_message(bot_data['telegram_token'], chat_id, f"⚠️ Ошибка создания платежа: {error_msg}")
            clear_user_state(bot_data['id'], telegram_user_id)
    except Exception as e:
        send_telegram_message(bot_data['telegram_token'], chat_id, f"⚠️ Ошибка при создании платежа: {str(e)}")
        clear_user_state(bot_data['id'], telegram_user_id)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Telegram webhook handler - processes bot updates
    Args: event - webhook update from Telegram
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
    
    if method == 'POST':
        query_params = event.get('queryStringParameters', {})
        bot_token = query_params.get('token', '')
        
        if not bot_token:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bot token required in query parameters'}),
                'isBase64Encoded': False
            }
        
        bot_data = get_bot_by_token(bot_token)
        
        if not bot_data:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bot not found or inactive'}),
                'isBase64Encoded': False
            }
        
        update = json.loads(event.get('body', '{}'))
        
        if 'message' in update:
            message = update['message']
            text = message.get('text', '')
            chat_id = message['chat']['id']
            telegram_user_id = message['from']['id']
            
            # Проверяем состояние пользователя
            user_state = get_user_state(bot_data['id'], telegram_user_id)
            
            if user_state and user_state.get('state') != 'idle':
                state = user_state['state']
                
                if state == 'waiting_last_name':
                    handle_last_name_input(bot_data, chat_id, telegram_user_id, text)
                elif state == 'waiting_first_name':
                    handle_first_name_input(bot_data, chat_id, telegram_user_id, text)
                elif state == 'waiting_phone':
                    handle_phone_input_and_create_payment(bot_data, chat_id, telegram_user_id, text)
            else:
                # Обычная обработка команд
                if text == '/start':
                    handle_start(bot_data, message)
                elif text == '/stats':
                    handle_stats(bot_data, chat_id, telegram_user_id)
                elif text == '🎁 Получить бесплатный ключ':
                    handle_free_key(bot_data, message)
                elif text == '🔐 Узнать про Тайную витрину':
                    handle_secret_shop(bot_data, chat_id)
                elif text == '💎 Купить VIP-ключ':
                    handle_buy_vip(bot_data, chat_id)
                elif text == '👑 Получить бесплатный VIP-ключ (Админ)':
                    handle_admin_free_vip(bot_data, message)
                elif text == '📊 Статистика':
                    handle_stats(bot_data, chat_id, telegram_user_id)
                elif text == '❓ Помощь':
                    handle_help(bot_data, chat_id)
        
        elif 'callback_query' in update:
            callback = update['callback_query']
            chat_id = callback['message']['chat']['id']
            telegram_user_id = callback['from']['id']
            data = callback['data']
            
            if data == 'secret_shop':
                handle_secret_shop(bot_data, chat_id)
            elif data == 'buy_vip':
                handle_buy_vip(bot_data, chat_id)
            elif data == 'start_payment':
                handle_start_payment(bot_data, chat_id, telegram_user_id)
            elif data == 'main_menu':
                handle_start(bot_data, {'chat': {'id': chat_id}, 'from': callback['from']})
            elif data == 'check_payment':
                handle_check_payment(bot_data, chat_id, telegram_user_id)
            
            requests.post(
                f"https://api.telegram.org/bot{bot_data['telegram_token']}/answerCallbackQuery",
                json={'callback_query_id': callback['id']}
            )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }