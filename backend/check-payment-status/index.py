import json
import os
import hashlib
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Check T-Bank payment status and update database
    Args: event with order_id or payment_id
    Returns: Payment status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    if method == 'POST':
        body = event.get('body', '{}')
        if not body or body == '':
            body = '{}'
        body_data = json.loads(body)
        order_id = body_data.get('order_id')
        
        if not order_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'order_id required'})
            }
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем данные платежа из БД
        query = f"""SELECT p.*, b.tbank_terminal_key, b.tbank_password 
                   FROM t_p5255237_telegram_bot_service.payments p
                   JOIN t_p5255237_telegram_bot_service.bots b ON p.bot_id = b.id
                   WHERE p.order_id = '{order_id.replace("'", "''")}'"""
        cursor.execute(query)
        payment = cursor.fetchone()
        
        if not payment:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Payment not found'})
            }
        
        terminal_key = payment['tbank_terminal_key']
        password = payment['tbank_password']
        payment_id = payment.get('payment_id')
        
        if not terminal_key or not password:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'T-Bank credentials not configured'})
            }
        
        # Проверяем статус в T-Bank API
        try:
            import urllib.request
            
            check_params = {
                'TerminalKey': terminal_key,
                'PaymentId': payment_id
            }
            
            # Генерируем токен
            token_data = {
                'TerminalKey': terminal_key,
                'PaymentId': payment_id,
                'Password': password
            }
            sorted_values = ''.join(str(v) for k, v in sorted(token_data.items()))
            token = hashlib.sha256(sorted_values.encode()).hexdigest()
            check_params['Token'] = token
            
            req = urllib.request.Request(
                'https://securepay.tinkoff.ru/v2/GetState',
                data=json.dumps(check_params).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                status = result.get('Status', 'UNKNOWN')
                
                # Обновляем статус в БД
                update_query = f"""UPDATE t_p5255237_telegram_bot_service.payments 
                                  SET status = '{status}', 
                                      last_check_at = CURRENT_TIMESTAMP,
                                      check_attempts = check_attempts + 1
                                  WHERE order_id = '{order_id.replace("'", "''")}'"""
                
                # Если платёж подтверждён
                if status == 'CONFIRMED':
                    update_query = f"""UPDATE t_p5255237_telegram_bot_service.payments 
                                      SET status = 'CONFIRMED', 
                                          confirmed_at = CURRENT_TIMESTAMP,
                                          last_check_at = CURRENT_TIMESTAMP,
                                          check_attempts = check_attempts + 1
                                      WHERE order_id = '{order_id.replace("'", "''")}'"""
                
                cursor.execute(update_query)
                conn.commit()
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'status': status,
                        'confirmed': status == 'CONFIRMED',
                        'details': result
                    })
                }
                
        except Exception as e:
            cursor.close()
            conn.close()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to check status: {str(e)}'})
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }