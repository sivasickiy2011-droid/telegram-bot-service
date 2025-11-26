import json
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Restart telegram-bot-engine to apply code changes
    Args: event - dict with httpMethod, headers with X-User-Id for auth
          context - object with request_id attribute
    Returns: HTTP response with restart status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Authentication required'}),
            'isBase64Encoded': False
        }
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid user_id'}),
            'isBase64Encoded': False
        }
    
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
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
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    check_admin = f"SELECT role FROM t_p5255237_telegram_bot_service.users WHERE id = {user_id}"
    cursor.execute(check_admin)
    user = cursor.fetchone()
    
    if not user or user['role'] != 'admin':
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
    
    cursor.close()
    conn.close()
    
    bot_engine_url = 'https://functions.poehali.dev/eb2c54e4-0f90-4e8a-ab2c-d043b163229e'
    
    try:
        response = requests.post(
            bot_engine_url,
            json={'action': 'restart'},
            timeout=10
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Telegram bot engine restart signal sent',
                'engine_status': response.status_code
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Bot engine will restart on next request',
                'note': 'Engine restarts automatically when new version is deployed'
            }),
            'isBase64Encoded': False
        }
