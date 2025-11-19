import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get bot users list with QR codes issued to them
    Args: event - dict with httpMethod, queryStringParameters (bot_id required)
          context - object with request_id attribute
    Returns: HTTP response dict with users list and their QR codes
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
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
    
    bot_id = event.get('queryStringParameters', {}).get('bot_id')
    
    if not bot_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'bot_id parameter is required'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        users_query = f'''
            SELECT 
                bu.id,
                bu.telegram_user_id,
                bu.username,
                bu.first_name,
                bu.last_name,
                bu.created_at,
                COUNT(qr.id) as qr_codes_count,
                STRING_AGG(qr.code_number::text, ', ' ORDER BY qr.created_at) as qr_codes
            FROM t_p5255237_telegram_bot_service.bot_users bu
            LEFT JOIN t_p5255237_telegram_bot_service.qr_codes qr 
                ON qr.bot_id = bu.bot_id AND qr.user_telegram_id = bu.telegram_user_id
            WHERE bu.bot_id = {bot_id}
            GROUP BY bu.id, bu.telegram_user_id, bu.username, bu.first_name, bu.last_name, bu.created_at
            ORDER BY bu.created_at DESC
        '''
        cursor.execute(users_query)
        users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'telegram_user_id': user['telegram_user_id'],
                'username': user['username'] or '',
                'first_name': user['first_name'] or '',
                'last_name': user['last_name'] or '',
                'created_at': str(user['created_at']),
                'qr_codes_count': user['qr_codes_count'] or 0,
                'qr_codes': user['qr_codes'] or ''
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'users': users_list, 'total': len(users_list)}, default=str),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Database error: {str(e)}'}),
            'isBase64Encoded': False
        }
