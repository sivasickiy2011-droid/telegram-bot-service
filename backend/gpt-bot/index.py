import json
import os
from typing import Dict, Any, Optional
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Process GPT bot messages using ChatGPT or YandexGPT
    Args: event with httpMethod, body containing message, bot_id, user_id, config
    Returns: HTTP response with AI-generated reply
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
    
    message = body_data.get('message', '')
    provider = body_data.get('provider', 'chatgpt')
    config = body_data.get('config', {})
    context_messages = body_data.get('context', [])
    
    if not message:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message is required'})
        }
    
    try:
        if provider == 'chatgpt':
            reply = process_chatgpt(message, config, context_messages)
        elif provider == 'yandexgpt':
            reply = process_yandexgpt(message, config, context_messages)
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Unknown provider: {provider}'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'reply': reply,
                'provider': provider,
                'success': True
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'AI processing failed: {str(e)}',
                'success': False
            })
        }


def process_chatgpt(message: str, config: Dict[str, Any], context: list) -> str:
    '''Process message using ChatGPT API or proxy'''
    use_proxy = config.get('useProxy', True)
    api_key = config.get('apiKey', '')
    proxy_api_key = config.get('proxyApiKey', '')
    model = config.get('model', 'gpt-3.5-turbo')
    system_prompt = config.get('systemPrompt', 'Ты полезный ассистент.')
    max_tokens = config.get('maxTokens', 1000)
    temperature = config.get('temperature', 0.7)
    
    if use_proxy:
        proxy_url = config.get('proxyUrl', 'https://api.pawan.krd/v1')
        api_url = f'{proxy_url}/chat/completions'
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        if proxy_api_key:
            headers['Authorization'] = f'Bearer {proxy_api_key}'
    else:
        if not api_key:
            raise ValueError('API key is required when not using proxy')
        api_url = 'https://api.openai.com/v1/chat/completions'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
    
    messages = [{'role': 'system', 'content': system_prompt}]
    
    for ctx_msg in context[-10:]:
        messages.append(ctx_msg)
    
    messages.append({'role': 'user', 'content': message})
    
    payload = {
        'model': model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature
    }
    
    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            reply = data['choices'][0]['message']['content']
            return reply
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'ChatGPT API error: {e.code} - {error_body}')
    except urllib.error.URLError as e:
        raise Exception(f'Network error: {str(e)}')


def process_yandexgpt(message: str, config: Dict[str, Any], context: list) -> str:
    '''Process message using YandexGPT API'''
    api_key = config.get('apiKey', '')
    folder_id = config.get('folderId', '')
    model = config.get('model', 'yandexgpt-lite')
    system_prompt = config.get('systemPrompt', 'Ты полезный ассистент.')
    max_tokens = config.get('maxTokens', 1000)
    temperature = config.get('temperature', 0.7)
    
    if not api_key:
        raise ValueError('YandexGPT API key is required')
    
    if not folder_id:
        raise ValueError('YandexGPT folder_id is required')
    
    api_url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Api-Key {api_key}',
        'x-folder-id': folder_id
    }
    
    messages = [{'role': 'system', 'text': system_prompt}]
    
    for ctx_msg in context[-10:]:
        messages.append({
            'role': ctx_msg.get('role', 'user'),
            'text': ctx_msg.get('content', '')
        })
    
    messages.append({'role': 'user', 'text': message})
    
    payload = {
        'modelUri': f'gpt://{folder_id}/{model}/latest',
        'completionOptions': {
            'temperature': temperature,
            'maxTokens': max_tokens
        },
        'messages': messages
    }
    
    req = urllib.request.Request(
        api_url,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            reply = data['result']['alternatives'][0]['message']['text']
            return reply
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f'YandexGPT API error: {e.code} - {error_body}')
    except urllib.error.URLError as e:
        raise Exception(f'Network error: {str(e)}')