import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User management API - create/get user data
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response dict with user data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        telegram_id = body_data.get('telegram_id')
        username = body_data.get('username', '')
        first_name = body_data.get('first_name', '')
        last_name = body_data.get('last_name', '')
        photo_url = body_data.get('photo_url', '')
        
        if not telegram_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'telegram_id is required'}),
                'isBase64Encoded': False
            }
        
        # Escape strings for simple query
        username_escaped = username.replace("'", "''")
        first_name_escaped = first_name.replace("'", "''")
        last_name_escaped = last_name.replace("'", "''")
        photo_url_escaped = photo_url.replace("'", "''")
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = f'''INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
               VALUES ({telegram_id}, '{username_escaped}', '{first_name_escaped}', '{last_name_escaped}', '{photo_url_escaped}')
               ON CONFLICT (telegram_id) DO UPDATE
               SET username = EXCLUDED.username,
                   first_name = EXCLUDED.first_name,
                   last_name = EXCLUDED.last_name,
                   photo_url = EXCLUDED.photo_url,
                   updated_at = CURRENT_TIMESTAMP
               RETURNING *'''
        cursor.execute(query)
        user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'user': dict(user)}, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {}) or {}
        telegram_id = params.get('telegram_id')
        get_all = params.get('all')
        
        if get_all == 'true':
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            query = '''SELECT u.id, u.telegram_id, u.username, u.first_name, u.last_name, 
                       u.role, u.created_at, COUNT(b.id) as bots_count 
                       FROM users u 
                       LEFT JOIN bots b ON u.id = b.user_id 
                       GROUP BY u.id 
                       ORDER BY u.created_at DESC'''
            cursor.execute(query)
            users = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'users': [dict(user) for user in users]}, default=str),
                'isBase64Encoded': False
            }
        
        if not telegram_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'telegram_id parameter is required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = f'SELECT * FROM users WHERE telegram_id = {telegram_id}'
        cursor.execute(query)
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'user': dict(user)}, default=str),
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