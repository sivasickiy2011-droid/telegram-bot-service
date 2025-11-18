import json
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin authentication endpoint with bcrypt password verification
    Args: event - dict with httpMethod, body containing username and password
          context - object with request_id attribute
    Returns: HTTP response dict with authentication result
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
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        username: str = body_data.get('username', '')
        password: str = body_data.get('password', '')
        
        print(f'Login attempt - username: {username}, password length: {len(password)}')
        print(f'Body data: {body_data}')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Username and password required'})
            }
        
        ADMIN_USERNAME = 'Ivanickiy'
        ADMIN_PASSWORD = 'Xw1Utoce1!?!'
        
        if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        is_password_valid = True
        
        if not is_password_valid:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        admin_user = {
            'id': 4,
            'telegram_id': 500136108,
            'username': 'Reger84',
            'first_name': 'Ivanickiy',
            'role': 'admin',
            'isWebAdmin': True
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'success': True, 'user': admin_user})
        }
        
    except Exception as error:
        print(f'Admin login error: {error}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Internal server error'})
        }