import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Bot runner API - activate/deactivate Telegram bots
    Args: event - dict with httpMethod, body with bot_id, action
          context - object with request_id attribute
    Returns: HTTP response with activation result
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
        # Get all approved bots that need activation
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = '''SELECT b.*, u.username as owner_username 
                   FROM bots b 
                   JOIN users u ON b.user_id = u.id 
                   WHERE b.moderation_status = 'approved' 
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
        bot_id = body_data.get('bot_id')
        action = body_data.get('action')  # 'activate' or 'deactivate'
        admin_id = body_data.get('admin_id')
        
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
        
        # Check if user is admin
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        check_admin = f"SELECT role FROM users WHERE id = {admin_id}"
        cursor.execute(check_admin)
        admin = cursor.fetchone()
        
        if not admin or admin['role'] != 'admin':
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Admin access required'}),
                'isBase64Encoded': False
            }
        
        # Get bot data
        query = f"SELECT * FROM bots WHERE id = {bot_id}"
        cursor.execute(query)
        bot = cursor.fetchone()
        
        if not bot:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Bot not found'}),
                'isBase64Encoded': False
            }
        
        if bot['moderation_status'] != 'approved':
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Bot must be approved before activation'}),
                'isBase64Encoded': False
            }
        
        # Update bot status
        new_status = 'active' if action == 'activate' else 'inactive'
        update_query = f"UPDATE bots SET status = '{new_status}', updated_at = CURRENT_TIMESTAMP WHERE id = {bot_id} RETURNING *"
        cursor.execute(update_query)
        updated_bot = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': f'Bot {action}d successfully',
                'bot': dict(updated_bot)
            }, default=str),
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
