import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    '''Создает подключение к базе данных'''
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(database_url)

def get_rotation_timedelta(value: int, unit: str) -> timedelta:
    '''Преобразует значение и единицу в timedelta'''
    if unit == 'hours':
        return timedelta(hours=value)
    elif unit == 'days':
        return timedelta(days=value)
    elif unit == 'weeks':
        return timedelta(weeks=value)
    elif unit == 'years':
        return timedelta(days=value * 365)
    else:
        return timedelta(0)

def check_and_rotate_bot_qr_codes(bot: Dict) -> Dict[str, Any]:
    '''Проверяет и ротирует QR-коды для одного бота'''
    bot_id = bot['id']
    bot_name = bot['name']
    rotation_value = bot.get('qr_rotation_value', 0)
    rotation_unit = bot.get('qr_rotation_unit', 'never')
    
    if rotation_value == 0 or rotation_unit == 'never':
        return {
            'bot_id': bot_id,
            'bot_name': bot_name,
            'action': 'skipped',
            'reason': 'rotation disabled'
        }
    
    rotation_interval = get_rotation_timedelta(rotation_value, rotation_unit)
    last_rotation = bot.get('updated_at')
    
    if not last_rotation:
        last_rotation = bot.get('created_at')
    
    if isinstance(last_rotation, str):
        last_rotation = datetime.fromisoformat(last_rotation.replace('Z', '+00:00'))
    
    time_since_rotation = datetime.now() - last_rotation
    
    if time_since_rotation < rotation_interval:
        return {
            'bot_id': bot_id,
            'bot_name': bot_name,
            'action': 'skipped',
            'reason': f'rotation not due yet ({time_since_rotation} < {rotation_interval})'
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    reset_free_query = f'''UPDATE t_p5255237_telegram_bot_service.qr_codes 
                          SET is_used = false, used_by_user_id = NULL, used_at = NULL 
                          WHERE bot_id = {bot_id} AND code_type = 'free' AND is_used = true'''
    cursor.execute(reset_free_query)
    free_reset_count = cursor.rowcount
    
    update_bot_query = f'''UPDATE t_p5255237_telegram_bot_service.bots 
                          SET updated_at = CURRENT_TIMESTAMP 
                          WHERE id = {bot_id}'''
    cursor.execute(update_bot_query)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'bot_id': bot_id,
        'bot_name': bot_name,
        'action': 'rotated',
        'free_qr_reset': free_reset_count,
        'rotation_interval': str(rotation_interval)
    }

def rotate_all_active_bots() -> List[Dict[str, Any]]:
    '''Проверяет все активные боты и ротирует QR-коды где нужно'''
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = '''SELECT * FROM t_p5255237_telegram_bot_service.bots 
               WHERE status = 'active' 
               AND moderation_status = 'approved' 
               AND qr_rotation_value > 0 
               AND qr_rotation_unit != 'never' '''
    cursor.execute(query)
    bots = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    results = []
    for bot in bots:
        result = check_and_rotate_bot_qr_codes(dict(bot))
        results.append(result)
    
    return results

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Automatic QR codes rotation for bots based on schedule
    Args: event - can include specific bot_id or rotate all active bots
          context - cloud function context
    Returns: HTTP response with rotation results
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = '''SELECT id, name, qr_rotation_value, qr_rotation_unit, updated_at, created_at 
                   FROM t_p5255237_telegram_bot_service.bots 
                   WHERE status = 'active' 
                   AND moderation_status = 'approved' 
                   AND qr_rotation_value > 0 
                   AND qr_rotation_unit != 'never' '''
        cursor.execute(query)
        bots = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        bots_info = []
        for bot in bots:
            rotation_interval = get_rotation_timedelta(bot['qr_rotation_value'], bot['qr_rotation_unit'])
            last_rotation = bot.get('updated_at') or bot.get('created_at')
            
            if isinstance(last_rotation, str):
                last_rotation = datetime.fromisoformat(last_rotation.replace('Z', '+00:00'))
            
            next_rotation = last_rotation + rotation_interval
            time_until_rotation = next_rotation - datetime.now()
            
            bots_info.append({
                'bot_id': bot['id'],
                'bot_name': bot['name'],
                'rotation_interval': f"{bot['qr_rotation_value']} {bot['qr_rotation_unit']}",
                'last_rotation': str(last_rotation),
                'next_rotation': str(next_rotation),
                'time_until_rotation': str(time_until_rotation),
                'rotation_due': time_until_rotation.total_seconds() <= 0
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'total_bots': len(bots_info),
                'bots': bots_info
            }, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        bot_id = body_data.get('bot_id')
        
        if bot_id:
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
            
            result = check_and_rotate_bot_qr_codes(dict(bot))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'rotation_result': result
                }),
                'isBase64Encoded': False
            }
        else:
            results = rotate_all_active_bots()
            
            rotated_count = sum(1 for r in results if r['action'] == 'rotated')
            skipped_count = sum(1 for r in results if r['action'] == 'skipped')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'total_processed': len(results),
                    'rotated': rotated_count,
                    'skipped': skipped_count,
                    'details': results
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
