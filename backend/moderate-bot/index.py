import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Bot moderation API - approve or reject bots by admin
    Args: event - dict with httpMethod, body with bot_id, action, admin_id, reason
          context - object with request_id attribute
    Returns: HTTP response with moderation result
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = '''SELECT b.*, u.username as owner_name 
                   FROM bots b 
                   JOIN users u ON b.user_id = u.id 
                   WHERE b.moderation_status = 'pending' 
                   ORDER BY b.created_at ASC'''
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
        bot_id = body_data.get('bot_id')
        action = body_data.get('action')
        admin_id = body_data.get('admin_id')
        reason = body_data.get('reason', '')
        
        if not bot_id or not action or not admin_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bot_id, action, and admin_id are required'}),
                'isBase64Encoded': False
            }
        
        if action not in ['approve', 'reject']:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'action must be approve or reject'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Проверяем, что пользователь - администратор
        admin_check = f"SELECT role FROM users WHERE id = {admin_id}"
        cursor.execute(admin_check)
        admin_result = cursor.fetchone()
        
        if not admin_result or admin_result['role'] != 'admin':
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Only admins can moderate bots'}),
                'isBase64Encoded': False
            }
        
        moderation_status = 'approved' if action == 'approve' else 'rejected'
        new_bot_status = 'active' if action == 'approve' else 'inactive'
        reason_escaped = reason.replace("'", "''")
        
        query = f'''UPDATE bots 
                   SET moderation_status = '{moderation_status}',
                       status = '{new_bot_status}',
                       moderation_reason = '{reason_escaped}',
                       moderated_by = {admin_id},
                       moderated_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = {bot_id} 
                   RETURNING *'''
        
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
            'body': json.dumps({'bot': dict(bot), 'message': f'Bot {moderation_status}'}, default=str),
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
