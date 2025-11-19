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

def register_telegram_user(bot_id: int, user_data: Dict) -> int:
    '''Регистрирует пользователя Telegram в базе данных'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    user_id = user_data.get('id')
    username = user_data.get('username', '')
    first_name = user_data.get('first_name', '')
    last_name = user_data.get('last_name', '')
    
    username_escaped = username.replace("'", "''")
    first_name_escaped = first_name.replace("'", "''")
    last_name_escaped = last_name.replace("'", "''")
    
    check_query = f'''SELECT id FROM t_p5255237_telegram_bot_service.bot_users 
                     WHERE bot_id = {bot_id} AND telegram_user_id = {user_id}'''
    cursor.execute(check_query)
    existing = cursor.fetchone()
    
    if existing:
        db_user_id = existing['id']
    else:
        insert_query = f'''INSERT INTO t_p5255237_telegram_bot_service.bot_users 
                          (bot_id, telegram_user_id, username, first_name, last_name)
                          VALUES ({bot_id}, {user_id}, '{username_escaped}', '{first_name_escaped}', '{last_name_escaped}')
                          RETURNING id'''
        cursor.execute(insert_query)
        db_user_id = cursor.fetchone()['id']
        conn.commit()
    
    cursor.close()
    conn.close()
    return db_user_id

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

def create_main_menu_keyboard() -> Dict:
    '''Создает главное меню с кнопками'''
    return {
        'keyboard': [
            [{'text': '🎁 Получить бесплатный ключ'}],
            [{'text': '🔐 Узнать про Тайную витрину'}],
            [{'text': '💎 Купить VIP-ключ'}],
            [{'text': '❓ Помощь'}]
        ],
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
    
    register_telegram_user(bot_data['id'], user)
    
    text = (
        "🚀 Привет! Я бот POLYTOPE.\n\n"
        "Здесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине "
        "на нашей закрытой распродаже с 21 по 23 ноября.\n\n"
        "Выберите действие:"
    )
    
    send_telegram_message(bot_data['telegram_token'], chat_id, text, create_main_menu_keyboard())

def handle_free_key(bot_data: Dict, message: Dict):
    '''Обработка запроса бесплатного ключа'''
    chat_id = message['chat']['id']
    user = message['from']
    
    user_id = register_telegram_user(bot_data['id'], user)
    qr_key = get_free_qr_key(bot_data['id'], user_id)
    
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
    text = (
        "💎 VIP-ключ дает доступ к Тайной витрине!\n\n"
        "Стоимость: 500 ₽\n\n"
        "После оплаты вы получите VIP QR-код с номером от 501 до 1000.\n\n"
        "⚠️ Функция оплаты появится в следующей версии."
    )
    send_telegram_message(bot_data['telegram_token'], chat_id, text)

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
            
            if text == '/start':
                handle_start(bot_data, message)
            elif text == '🎁 Получить бесплатный ключ':
                handle_free_key(bot_data, message)
            elif text == '🔐 Узнать про Тайную витрину':
                handle_secret_shop(bot_data, message['chat']['id'])
            elif text == '💎 Купить VIP-ключ':
                handle_buy_vip(bot_data, message['chat']['id'])
            elif text == '❓ Помощь':
                handle_help(bot_data, message['chat']['id'])
        
        elif 'callback_query' in update:
            callback = update['callback_query']
            chat_id = callback['message']['chat']['id']
            data = callback['data']
            
            if data == 'secret_shop':
                handle_secret_shop(bot_data, chat_id)
            elif data == 'buy_vip':
                handle_buy_vip(bot_data, chat_id)
            
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
