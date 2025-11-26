import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import asyncio
from aiogram import Bot

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Warehouse booking reminder - send notifications 24h before booking
    Args: event - cloud function event (scheduled trigger)
          context - cloud function context
    Returns: HTTP response with reminder stats
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Get tomorrow's date (bookings to remind about)
    tomorrow = (datetime.now() + timedelta(days=1)).date()
    
    database_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get all active bookings for tomorrow
    query = f'''SELECT b.*, bt.telegram_token, bt.admin_telegram_ids, bt.name as bot_name
               FROM t_p5255237_telegram_bot_service.warehouse_bookings b
               JOIN t_p5255237_telegram_bot_service.bots bt ON b.bot_id = bt.id
               WHERE b.booking_date = '{tomorrow}' AND b.status = 'active' 
               AND bt.status = 'active' AND bt.template = 'warehouse' '''
    
    cursor.execute(query)
    bookings = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if not bookings:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'No bookings to remind', 'count': 0}),
            'isBase64Encoded': False
        }
    
    # Send reminders
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    sent_count = 0
    for booking in bookings:
        try:
            result = loop.run_until_complete(send_reminder(booking))
            if result:
                sent_count += 1
        except Exception as e:
            print(f"Error sending reminder for booking {booking['id']}: {str(e)}")
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Reminders sent',
            'total_bookings': len(bookings),
            'sent': sent_count
        }),
        'isBase64Encoded': False
    }

async def send_reminder(booking: dict) -> bool:
    '''Отправить напоминание пользователю и администраторам'''
    bot_token = booking.get('telegram_token')
    if not bot_token:
        return False
    
    bot = Bot(token=bot_token)
    
    booking_date_str = booking['booking_date'].strftime('%d.%m.%Y')
    booking_time_str = str(booking['booking_time'])[:5]
    
    # Message for user
    user_message = (
        f"🔔 *Напоминание о разгрузке*\n\n"
        f"Завтра {booking_date_str} в {booking_time_str} вас ждут на складе!\n\n"
        f"📋 Ваши данные:\n"
        f"🏢 Компания: {booking['user_company']}\n"
        f"📱 Телефон: {booking['user_phone']}\n"
        f"🚚 ТС: {booking['vehicle_type']}\n"
        f"📦 Груз: {booking['cargo_description']}\n\n"
        f"⏰ Пожалуйста, прибудьте вовремя!\n"
        f"Если нужно изменить или отменить бронь - сообщите заранее."
    )
    
    # Send to user
    try:
        await bot.send_message(
            chat_id=booking['telegram_user_id'],
            text=user_message,
            parse_mode='Markdown'
        )
    except Exception as e:
        print(f"Failed to send reminder to user {booking['telegram_user_id']}: {str(e)}")
    
    # Message for admins
    username = booking.get('telegram_username') or 'без username'
    admin_message = (
        f"🔔 *Напоминание: завтра разгрузка*\n\n"
        f"Бот: {booking.get('bot_name', 'Unknown')}\n\n"
        f"📅 Дата: {booking_date_str}\n"
        f"🕐 Время: {booking_time_str}\n\n"
        f"👤 Клиент:\n"
        f"• Telegram: @{username} (ID: {booking['telegram_user_id']})\n"
        f"• Телефон: {booking['user_phone']}\n"
        f"• Компания: {booking['user_company']}\n\n"
        f"🚚 Транспорт: {booking['vehicle_type']}\n"
        f"📦 Груз: {booking['cargo_description']}\n\n"
        f"Бронирование ID: {booking['id']}"
    )
    
    # Send to admins
    admin_ids = booking.get('admin_telegram_ids') or []
    for admin_id in admin_ids:
        try:
            await bot.send_message(
                chat_id=admin_id,
                text=admin_message,
                parse_mode='Markdown'
            )
        except Exception as e:
            print(f"Failed to send reminder to admin {admin_id}: {str(e)}")
    
    await bot.session.close()
    return True
