import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Sync bot statistics - update total_users and total_messages counters
    Args: event - dict with httpMethod, body (bot_id optional - if not provided, syncs all bots)
          context - object with request_id attribute
    Returns: HTTP response dict with sync result
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
    
    body_str = event.get('body', '{}')
    if body_str and body_str != '':
        body_data = json.loads(body_str)
        bot_id = body_data.get('bot_id')
    else:
        bot_id = None
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if bot_id:
            sync_query = f'''
                UPDATE t_p5255237_telegram_bot_service.bots
                SET total_users = COALESCE((
                    SELECT COUNT(DISTINCT telegram_user_id)
                    FROM t_p5255237_telegram_bot_service.bot_users
                    WHERE bot_id = {bot_id}
                ), 0),
                interactions_today = COALESCE((
                    SELECT COUNT(*)
                    FROM t_p5255237_telegram_bot_service.qr_codes
                    WHERE bot_id = {bot_id} AND DATE(created_at) = CURRENT_DATE
                ), 0),
                interactions_yesterday = COALESCE((
                    SELECT COUNT(*)
                    FROM t_p5255237_telegram_bot_service.qr_codes
                    WHERE bot_id = {bot_id} AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
                ), 0)
                WHERE id = {bot_id}
                RETURNING id, name, total_users, total_messages, interactions_today, interactions_yesterday
            '''
        else:
            sync_query = '''
                UPDATE t_p5255237_telegram_bot_service.bots b
                SET total_users = COALESCE((
                    SELECT COUNT(DISTINCT telegram_user_id)
                    FROM t_p5255237_telegram_bot_service.bot_users bu
                    WHERE bu.bot_id = b.id
                ), 0),
                interactions_today = COALESCE((
                    SELECT COUNT(*)
                    FROM t_p5255237_telegram_bot_service.qr_codes qr
                    WHERE qr.bot_id = b.id AND DATE(qr.created_at) = CURRENT_DATE
                ), 0),
                interactions_yesterday = COALESCE((
                    SELECT COUNT(*)
                    FROM t_p5255237_telegram_bot_service.qr_codes qr
                    WHERE qr.bot_id = b.id AND DATE(qr.created_at) = CURRENT_DATE - INTERVAL '1 day'
                ), 0)
                RETURNING id, name, total_users, total_messages, interactions_today, interactions_yesterday
            '''
        
        cursor.execute(sync_query)
        updated_bots = cursor.fetchall()
        conn.commit()
        cursor.close()
        conn.close()
        
        result = {
            'synced_bots': len(updated_bots),
            'bots': [dict(bot) for bot in updated_bots]
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str),
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