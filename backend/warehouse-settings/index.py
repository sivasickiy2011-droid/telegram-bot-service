import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Warehouse settings API - manage warehouse schedule and bookings
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response dict with warehouse data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS OPTIONS handling
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(database_url)
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        bot_id = params.get('bot_id')
        action = params.get('action', 'schedule')
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if action == 'schedule':
            # Get warehouse schedule settings
            query = f'''SELECT * FROM t_p5255237_telegram_bot_service.warehouse_schedule 
                       WHERE bot_id = {bot_id}'''
            cursor.execute(query)
            schedule = cursor.fetchone()
            
            if schedule:
                result = {'schedule': dict(schedule)}
            else:
                # Return defaults if not set
                result = {
                    'schedule': {
                        'bot_id': int(bot_id),
                        'work_start_time': '08:00:00',
                        'work_end_time': '18:00:00',
                        'slot_duration_minutes': 60,
                        'max_slots_per_day': 10,
                        'work_days': '1,2,3,4,5'
                    }
                }
        
        elif action == 'bookings':
            # Get all bookings for bot
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            
            if date_from and date_to:
                query = f'''SELECT * FROM t_p5255237_telegram_bot_service.warehouse_bookings 
                           WHERE bot_id = {bot_id} AND booking_date >= '{date_from}' 
                           AND booking_date <= '{date_to}' 
                           ORDER BY booking_date, booking_time'''
            else:
                query = f'''SELECT * FROM t_p5255237_telegram_bot_service.warehouse_bookings 
                           WHERE bot_id = {bot_id} 
                           ORDER BY booking_date DESC, booking_time DESC 
                           LIMIT 100'''
            
            cursor.execute(query)
            bookings = cursor.fetchall()
            result = {'bookings': [dict(b) for b in bookings]}
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        bot_id = body_data.get('bot_id')
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create or update warehouse schedule
        work_start = body_data.get('work_start_time', '08:00:00')
        work_end = body_data.get('work_end_time', '18:00:00')
        slot_duration = body_data.get('slot_duration_minutes', 60)
        max_slots = body_data.get('max_slots_per_day', 10)
        work_days = body_data.get('work_days', '1,2,3,4,5')
        
        query = f'''INSERT INTO t_p5255237_telegram_bot_service.warehouse_schedule 
                   (bot_id, work_start_time, work_end_time, slot_duration_minutes, 
                    max_slots_per_day, work_days)
                   VALUES ({bot_id}, '{work_start}', '{work_end}', {slot_duration}, 
                           {max_slots}, '{work_days}')
                   ON CONFLICT (bot_id) 
                   DO UPDATE SET 
                       work_start_time = '{work_start}',
                       work_end_time = '{work_end}',
                       slot_duration_minutes = {slot_duration},
                       max_slots_per_day = {max_slots},
                       work_days = '{work_days}',
                       updated_at = CURRENT_TIMESTAMP
                   RETURNING *'''
        
        cursor.execute(query)
        schedule = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'schedule': dict(schedule)}, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        body_data = json.loads(event.get('body', '{}'))
        booking_id = body_data.get('booking_id')
        
        cursor = conn.cursor()
        query = f'''UPDATE t_p5255237_telegram_bot_service.warehouse_bookings 
                   SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP,
                   cancellation_reason = 'Cancelled by admin'
                   WHERE id = {booking_id}'''
        cursor.execute(query)
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
