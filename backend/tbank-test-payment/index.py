import json
import hashlib
import os
from typing import Dict, Any

def generate_token(params: dict, password: str) -> str:
    '''
    Генерирует токен для T-Bank API
    Args: params - словарь параметров запроса, password - пароль терминала
    Returns: SHA-256 хеш токена
    '''
    sorted_params = {k: v for k, v in sorted(params.items()) if k != 'Token'}
    token_values = [str(v) for v in sorted_params.values()]
    token_values.append(password)
    token_string = ''.join(token_values)
    return hashlib.sha256(token_string.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Test T-Bank payment integration via СБП
    Args: event - dict with httpMethod, body with terminal_key, password, amount
          context - object with request_id attribute
    Returns: HTTP response with T-Bank test payment result
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
    
    body_data = json.loads(event.get('body', '{}'))
    terminal_key = body_data.get('terminal_key', '')
    password = body_data.get('password', '')
    amount = body_data.get('amount', 50000)
    
    if not terminal_key or not password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'terminal_key and password are required'}),
            'isBase64Encoded': False
        }
    
    init_params = {
        'TerminalKey': terminal_key,
        'Amount': amount,
        'OrderId': f'test_{context.request_id}',
        'Description': 'Тестовый платеж T-Bank',
        'DATA': {
            'Phone': '+71234567890',
            'Email': 'test@example.com'
        },
        'Receipt': {
            'Email': 'test@example.com',
            'Phone': '+71234567890',
            'Taxation': 'usn_income',
            'Items': [
                {
                    'Name': 'Тестовый товар',
                    'Price': amount,
                    'Quantity': 1,
                    'Amount': amount,
                    'Tax': 'none',
                    'PaymentMethod': 'full_payment',
                    'PaymentObject': 'service'
                }
            ]
        }
    }
    
    token = generate_token({
        'TerminalKey': init_params['TerminalKey'],
        'Amount': init_params['Amount'],
        'OrderId': init_params['OrderId'],
        'Description': init_params['Description'],
        'Receipt': init_params['Receipt']
    }, password)
    
    init_params['Token'] = token
    
    try:
        import urllib.request
        import urllib.error
        
        url = 'https://securepay.tinkoff.ru/v2/Init'
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'TeleBot-Platform/1.0',
            'Accept': 'application/json'
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(init_params).encode('utf-8'),
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('Success'):
                payment_id = result.get('PaymentId')
                payment_url = result.get('PaymentURL')
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'payment_id': payment_id,
                        'payment_url': payment_url,
                        'message': 'Тестовый платёж успешно создан',
                        'details': result
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
                        'error': result.get('Message', 'Неизвестная ошибка'),
                        'error_code': result.get('ErrorCode'),
                        'details': result
                    }),
                    'isBase64Encoded': False
                }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
        except:
            error_data = {'raw_error': error_body}
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': f'T-Bank API error: {e.code}',
                'details': error_data
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