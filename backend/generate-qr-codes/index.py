import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    '''Создает подключение к базе данных'''
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(database_url)

def generate_qr_codes_for_bot(bot_id: int, free_count: int, paid_count: int) -> Dict[str, int]:
    '''Генерирует QR-коды для бота'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    check_query = f'''SELECT COUNT(*) as count FROM t_p5255237_telegram_bot_service.qr_codes 
                     WHERE bot_id = {bot_id}'''
    cursor.execute(check_query)
    existing = cursor.fetchone()
    
    if existing and existing['count'] > 0:
        cursor.close()
        conn.close()
        return {'free': 0, 'paid': 0, 'message': 'QR codes already exist for this bot'}
    
    free_inserted = 0
    paid_inserted = 0
    
    if free_count > 0:
        free_query = f'''INSERT INTO t_p5255237_telegram_bot_service.qr_codes 
                        (bot_id, code_number, code_type, is_used)
                        SELECT {bot_id}, generate_series, 'free', false
                        FROM generate_series(1, {free_count})'''
        cursor.execute(free_query)
        free_inserted = cursor.rowcount
    
    if paid_count > 0:
        start_number = free_count + 1
        end_number = free_count + paid_count
        paid_query = f'''INSERT INTO t_p5255237_telegram_bot_service.qr_codes 
                        (bot_id, code_number, code_type, is_used)
                        SELECT {bot_id}, generate_series, 'vip', false
                        FROM generate_series({start_number}, {end_number})'''
        cursor.execute(paid_query)
        paid_inserted = cursor.rowcount
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {'free': free_inserted, 'paid': paid_inserted}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate QR codes for bot after approval
    Args: event - with bot_id
          context - cloud function context
    Returns: HTTP response with generation result
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = f'SELECT * FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id}'
        cursor.execute(query)
        bot = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not bot:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Bot not found'}),
                'isBase64Encoded': False
            }
        
        free_count = bot.get('qr_free_count', 500)
        paid_count = bot.get('qr_paid_count', 500)
        
        result = generate_qr_codes_for_bot(bot_id, free_count, paid_count)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'bot_id': bot_id,
                'bot_name': bot['name'],
                'qr_codes_created': result
            }),
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
