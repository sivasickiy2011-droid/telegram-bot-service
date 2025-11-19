import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get bot statistics - users count, active users, messages count, QR codes usage
    Args: event - dict with httpMethod, queryStringParameters (bot_id required)
          context - object with request_id attribute
    Returns: HTTP response dict with statistics data
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
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    bot_query = f'''SELECT id, name, qr_free_count, qr_paid_count, payment_url, payment_enabled, 
                          total_users, total_messages, created_at 
                   FROM t_p5255237_telegram_bot_service.bots 
                   WHERE id = {bot_id}'''
    cursor.execute(bot_query)
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
    
    qr_stats_query = f'''SELECT 
                           COUNT(*) as total_qr_codes,
                           COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as used_qr_codes,
                           COUNT(CASE WHEN user_id IS NULL THEN 1 END) as available_qr_codes,
                           COUNT(CASE WHEN is_vip = true THEN 1 END) as vip_codes,
                           COUNT(CASE WHEN is_vip = false THEN 1 END) as free_codes
                        FROM t_p5255237_telegram_bot_service.qr_codes 
                        WHERE bot_id = {bot_id}'''
    cursor.execute(qr_stats_query)
    qr_stats = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    stats = {
        'bot_id': bot['id'],
        'bot_name': bot['name'],
        'total_users': bot['total_users'] or 0,
        'total_messages': bot['total_messages'] or 0,
        'created_at': str(bot['created_at']),
        'payment_enabled': bot['payment_enabled'],
        'payment_url': bot['payment_url'] or '',
        'qr_codes': {
            'total': qr_stats['total_qr_codes'] or 0,
            'used': qr_stats['used_qr_codes'] or 0,
            'available': qr_stats['available_qr_codes'] or 0,
            'vip_total': qr_stats['vip_codes'] or 0,
            'free_total': qr_stats['free_codes'] or 0,
            'free_configured': bot['qr_free_count'] or 0,
            'vip_configured': bot['qr_paid_count'] or 0
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'stats': stats}, default=str),
        'isBase64Encoded': False
    }
