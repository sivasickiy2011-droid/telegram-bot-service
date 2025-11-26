import json
import os
from typing import Dict, Any
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Set Telegram webhook for a bot
    Args: event - dict with httpMethod, body containing bot_id
          context - object with request_id attribute
    Returns: HTTP response with webhook setup status
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
    
    # Parse request body
    body_str = event.get('body', '{}')
    body_data = json.loads(body_str) if body_str else {}
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
    
    # Get bot from database
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
    
    query = f"SELECT telegram_token FROM t_p5255237_telegram_bot_service.bots WHERE id = {bot_id}"
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
    
    bot_token = bot['telegram_token']
    
    # Webhook URL для этого бота
    webhook_url = f'https://functions.poehali.dev/eb2c54e4-0f90-4e8a-ab2c-d043b163229e/webhook/{bot_id}'
    
    # Set webhook через Telegram API
    telegram_api_url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
    
    try:
        webhook_data = json.dumps({
            'url': webhook_url,
            'allowed_updates': ['message', 'callback_query']
        }).encode('utf-8')
        
        req = urllib.request.Request(
            telegram_api_url,
            data=webhook_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('ok'):
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'webhook_url': webhook_url,
                        'message': 'Webhook установлен успешно'
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': result.get('description', 'Unknown error')
                    }),
                    'isBase64Encoded': False
                }
                
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'isBase64Encoded': False
        }
