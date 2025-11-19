import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Bot management API - CRUD operations for Telegram bots
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response dict with bot data
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    
    if method == 'GET':
        user_id = event.get('queryStringParameters', {}).get('user_id')
        
        if not user_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'user_id parameter is required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = f'''SELECT b.*, u.username as moderator_name 
                   FROM t_p5255237_telegram_bot_service.bots b 
                   LEFT JOIN t_p5255237_telegram_bot_service.users u ON b.moderated_by = u.id 
                   WHERE b.user_id = {user_id} 
                   ORDER BY b.created_at DESC'''
        cursor.execute(query)
        bots = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'bots': [dict(bot) for bot in bots]}, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        name = body_data.get('name')
        telegram_token = body_data.get('telegram_token')
        template = body_data.get('template', 'keys')
        description = body_data.get('description', '')
        logic = body_data.get('logic', '')
        qr_free_count = body_data.get('qr_free_count', 500)
        qr_paid_count = body_data.get('qr_paid_count', 500)
        qr_rotation_value = body_data.get('qr_rotation_value', 0)
        qr_rotation_unit = body_data.get('qr_rotation_unit', 'never')
        payment_enabled = body_data.get('payment_enabled', False)
        payment_url = body_data.get('payment_url', '')
        
        if not user_id or not name or not telegram_token or not description or not logic:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'user_id, name, telegram_token, description, and logic are required'}),
                'isBase64Encoded': False
            }
        
        # Check if user exists
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        check_user_query = f"SELECT id FROM t_p5255237_telegram_bot_service.users WHERE id = {user_id}"
        cursor.execute(check_user_query)
        user_exists = cursor.fetchone()
        
        if not user_exists:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'User with id {user_id} does not exist'}),
                'isBase64Encoded': False
            }
        
        # Escape strings for simple query
        name_escaped = name.replace("'", "''")
        token_escaped = telegram_token.replace("'", "''")
        template_escaped = template.replace("'", "''")
        description_escaped = description.replace("'", "''")
        logic_escaped = logic.replace("'", "''")
        qr_rotation_unit_escaped = qr_rotation_unit.replace("'", "''")
        payment_url_escaped = payment_url.replace("'", "''")
        
        query = f'''INSERT INTO t_p5255237_telegram_bot_service.bots 
               (user_id, name, telegram_token, template, bot_description, bot_logic, 
                qr_free_count, qr_paid_count, qr_rotation_value, qr_rotation_unit, 
                payment_enabled, payment_url, status, moderation_status)
               VALUES ({user_id}, '{name_escaped}', '{token_escaped}', '{template_escaped}', 
                       '{description_escaped}', '{logic_escaped}', {qr_free_count}, {qr_paid_count}, 
                       {qr_rotation_value}, '{qr_rotation_unit_escaped}', {payment_enabled}, 
                       '{payment_url_escaped}', 'inactive', 'pending') 
               RETURNING *'''
        cursor.execute(query)
        bot = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'bot': dict(bot)}, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        bot_id = body_data.get('bot_id')
        status = body_data.get('status')
        payment_url = body_data.get('payment_url')
        payment_enabled = body_data.get('payment_enabled')
        
        if not bot_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bot_id is required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        update_parts = []
        if status is not None:
            status_escaped = status.replace("'", "''")
            update_parts.append(f"status = '{status_escaped}'")
        
        if payment_url is not None:
            payment_url_escaped = payment_url.replace("'", "''")
            update_parts.append(f"payment_url = '{payment_url_escaped}'")
        
        if payment_enabled is not None:
            update_parts.append(f"payment_enabled = {payment_enabled}")
        
        if not update_parts:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No fields to update'}),
                'isBase64Encoded': False
            }
        
        update_parts.append("updated_at = CURRENT_TIMESTAMP")
        update_clause = ", ".join(update_parts)
        
        query = f"UPDATE t_p5255237_telegram_bot_service.bots SET {update_clause} WHERE id = {bot_id} RETURNING *"
        cursor.execute(query)
        bot = cursor.fetchone()
        conn.commit()
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
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'bot': dict(bot)}, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        body_data = json.loads(event.get('body', '{}'))
        bot_id = body_data.get('bot_id')
        
        if not bot_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bot_id is required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = f"DELETE FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id} RETURNING *"
        cursor.execute(query)
        deleted_bot = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if not deleted_bot:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Bot not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Bot deleted successfully'}),
            'isBase64Encoded': False
        }
    
    conn.close()
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }