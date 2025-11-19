'''
Business: Управление бронированиями времени разгрузки на складе
Args: event с httpMethod, body, queryStringParameters
Returns: HTTP response с данными бронирований или результатом операции
'''

import json
import os
from datetime import datetime, time, timedelta
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'list')
            
            if action == 'schedule':
                bot_id = params.get('bot_id')
                cursor.execute(
                    "SELECT * FROM warehouse_schedule WHERE bot_id = %s",
                    (bot_id,)
                )
                schedule = cursor.fetchone()
                
                if not schedule:
                    schedule = {
                        'work_start_time': '08:00:00',
                        'work_end_time': '18:00:00',
                        'slot_duration_minutes': 60,
                        'work_days': '1,2,3,4,5'
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'schedule': dict(schedule)}, default=str)
                }
            
            elif action == 'available':
                date_str = params.get('date')
                bot_id = params.get('bot_id')
                
                if not date_str:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Date required'})
                    }
                
                cursor.execute(
                    "SELECT * FROM warehouse_schedule WHERE bot_id = %s",
                    (bot_id,)
                )
                schedule = cursor.fetchone()
                
                work_start = schedule['work_start_time'] if schedule else time(8, 0)
                work_end = schedule['work_end_time'] if schedule else time(18, 0)
                slot_duration = schedule['slot_duration_minutes'] if schedule else 60
                
                cursor.execute(
                    "SELECT booking_time FROM warehouse_bookings WHERE booking_date = %s AND status = 'active'",
                    (date_str,)
                )
                booked_times = [row['booking_time'] for row in cursor.fetchall()]
                
                available_slots = []
                current_time = datetime.combine(datetime.today(), work_start)
                end_time = datetime.combine(datetime.today(), work_end)
                
                while current_time < end_time:
                    slot_time = current_time.time()
                    if slot_time not in booked_times:
                        available_slots.append(slot_time.strftime('%H:%M'))
                    current_time += timedelta(minutes=slot_duration)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'available_slots': available_slots})
                }
            
            else:
                user_id = params.get('user_id')
                date_from = params.get('date_from')
                status = params.get('status', 'active')
                
                query = "SELECT * FROM warehouse_bookings WHERE status = %s"
                query_params = [status]
                
                if user_id:
                    query += " AND telegram_user_id = %s"
                    query_params.append(user_id)
                
                if date_from:
                    query += " AND booking_date >= %s"
                    query_params.append(date_from)
                
                query += " ORDER BY booking_date, booking_time"
                
                cursor.execute(query, query_params)
                bookings = cursor.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'bookings': [dict(b) for b in bookings]}, default=str)
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            telegram_user_id = body_data.get('telegram_user_id')
            telegram_username = body_data.get('telegram_username')
            booking_date = body_data.get('booking_date')
            booking_time = body_data.get('booking_time')
            user_phone = body_data.get('user_phone')
            user_company = body_data.get('user_company')
            vehicle_type = body_data.get('vehicle_type')
            cargo_description = body_data.get('cargo_description')
            bot_id = body_data.get('bot_id')
            
            cursor.execute(
                "SELECT id FROM warehouse_bookings WHERE booking_date = %s AND booking_time = %s AND status = 'active'",
                (booking_date, booking_time)
            )
            
            if cursor.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Это время уже занято'})
                }
            
            cursor.execute(
                '''INSERT INTO warehouse_bookings 
                (telegram_user_id, telegram_username, booking_date, booking_time, 
                user_phone, user_company, vehicle_type, cargo_description, bot_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id''',
                (telegram_user_id, telegram_username, booking_date, booking_time,
                 user_phone, user_company, vehicle_type, cargo_description, bot_id)
            )
            
            booking_id = cursor.fetchone()['id']
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True, 
                    'booking_id': booking_id,
                    'message': 'Бронирование создано'
                })
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {}) or {}
            booking_id = params.get('id')
            reason = params.get('reason', 'Отменено пользователем')
            
            if not booking_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Booking ID required'})
                }
            
            cursor.execute(
                '''UPDATE warehouse_bookings 
                SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = %s
                WHERE id = %s AND status = 'active'
                RETURNING id''',
                (reason, booking_id)
            )
            
            result = cursor.fetchone()
            conn.commit()
            
            if result:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Бронирование отменено'})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Бронирование не найдено'})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
