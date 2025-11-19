import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

WEBHOOK_URL_BASE = 'https://functions.poehali.dev/e8eb375e-9ff3-4b43-9b51-12ac8338c9fe'

def get_db_connection():
    '''Создает подключение к базе данных'''
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(database_url)

def setup_telegram_webhook(bot_token: str) -> Dict[str, Any]:
    '''Настраивает webhook для Telegram бота'''
    webhook_url = f'{WEBHOOK_URL_BASE}?token={bot_token}'
    
    set_webhook_url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
    response = requests.post(set_webhook_url, json={'url': webhook_url})
    
    return response.json()

def delete_telegram_webhook(bot_token: str) -> Dict[str, Any]:
    '''Удаляет webhook для Telegram бота'''
    delete_webhook_url = f'https://api.telegram.org/bot{bot_token}/deleteWebhook'
    response = requests.post(delete_webhook_url)
    
    return response.json()

def get_webhook_info(bot_token: str) -> Dict[str, Any]:
    '''Получает информацию о webhook'''
    url = f'https://api.telegram.org/bot{bot_token}/getWebhookInfo'
    response = requests.get(url)
    
    return response.json()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Setup Telegram webhook for active bots
    Args: event - with bot_id and action (setup/delete/info)
          context - cloud function context
    Returns: HTTP response with webhook status
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
        action = body_data.get('action', 'setup')
        
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
        
        bot_token = bot['telegram_token']
        
        if action == 'setup':
            result = setup_telegram_webhook(bot_token)
        elif action == 'delete':
            result = delete_telegram_webhook(bot_token)
        elif action == 'info':
            result = get_webhook_info(bot_token)
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid action. Use setup/delete/info'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'action': action,
                'bot_id': bot_id,
                'bot_name': bot['name'],
                'telegram_result': result
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
