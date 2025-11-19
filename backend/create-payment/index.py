import json
import hashlib
import urllib.request
import urllib.error
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Create T-Bank payment with different methods (card, SBP, gift)
    Args: event with httpMethod, body containing bot_id, user_id, amount, payment_method
    Returns: HTTP response with payment URL or gift link
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
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_str = event.get('body', '{}')
    if not body_str:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Empty request body'})
        }
    
    body_data = json.loads(body_str)
    
    terminal_key = body_data.get('terminal_key', '')
    password = body_data.get('password', '')
    amount = body_data.get('amount', 0)
    order_id = body_data.get('order_id', '')
    description = body_data.get('description', 'Оплата')
    payment_method = body_data.get('payment_method', 'card')
    success_url = body_data.get('success_url', '')
    fail_url = body_data.get('fail_url', '')
    
    if not terminal_key or not password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Terminal key and password are required'})
        }
    
    if amount <= 0:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Amount must be greater than 0'})
        }
    
    try:
        if payment_method == 'card':
            payment_url = create_card_payment(
                terminal_key, password, amount, order_id, description, success_url, fail_url
            )
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'payment_method': 'card',
                    'payment_url': payment_url
                })
            }
        
        elif payment_method == 'sbp':
            qr_data = create_sbp_payment(
                terminal_key, password, amount, order_id, description
            )
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'payment_method': 'sbp',
                    'qr_code': qr_data['qr_code'],
                    'payment_id': qr_data['payment_id']
                })
            }
        
        elif payment_method == 'gift':
            gift_url = body_data.get('gift_url', '')
            if not gift_url:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Gift URL is required for gift payment'})
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'payment_method': 'gift',
                    'gift_url': gift_url
                })
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Unknown payment method: {payment_method}'})
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
            })
        }


def create_card_payment(terminal_key: str, password: str, amount: int, order_id: str, 
                        description: str, success_url: str, fail_url: str) -> str:
    '''Create card payment via T-Bank API'''
    api_url = 'https://securepay.tinkoff.ru/v2/Init'
    
    payload = {
        'TerminalKey': terminal_key,
        'Amount': amount,
        'OrderId': order_id,
        'Description': description,
        'SuccessURL': success_url or 'https://t.me',
        'FailURL': fail_url or 'https://t.me'
    }
    
    token = generate_token(payload, password)
    payload['Token'] = token
    
    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            if data.get('Success'):
                return data.get('PaymentURL', '')
            else:
                raise Exception(data.get('Message', 'Payment creation failed'))
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'T-Bank API error: {e.code} - {error_body}')


def create_sbp_payment(terminal_key: str, password: str, amount: int, 
                       order_id: str, description: str) -> Dict[str, str]:
    '''Create SBP payment via T-Bank API'''
    api_url = 'https://securepay.tinkoff.ru/v2/Init'
    
    payload = {
        'TerminalKey': terminal_key,
        'Amount': amount,
        'OrderId': order_id,
        'Description': description,
        'PayType': 'T'
    }
    
    token = generate_token(payload, password)
    payload['Token'] = token
    
    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            if data.get('Success'):
                payment_id = data.get('PaymentId', '')
                
                qr_url = f'https://securepay.tinkoff.ru/v2/GetQr'
                qr_payload = {
                    'TerminalKey': terminal_key,
                    'PaymentId': payment_id
                }
                qr_token = generate_token(qr_payload, password)
                qr_payload['Token'] = qr_token
                
                qr_req = urllib.request.Request(
                    qr_url,
                    data=json.dumps(qr_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(qr_req, timeout=30) as qr_response:
                    qr_data = json.loads(qr_response.read().decode('utf-8'))
                    
                    return {
                        'qr_code': qr_data.get('Data', ''),
                        'payment_id': payment_id
                    }
            else:
                raise Exception(data.get('Message', 'SBP payment creation failed'))
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'T-Bank API error: {e.code} - {error_body}')


def generate_token(params: Dict[str, Any], password: str) -> str:
    '''Generate token for T-Bank API'''
    params_copy = params.copy()
    params_copy['Password'] = password
    
    sorted_keys = sorted(params_copy.keys())
    values = [str(params_copy[key]) for key in sorted_keys if key not in ['Token', 'Receipt', 'Data']]
    
    concatenated = ''.join(values)
    token = hashlib.sha256(concatenated.encode('utf-8')).hexdigest()
    
    return token
