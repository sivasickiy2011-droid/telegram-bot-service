import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Shop products management API - CRUD for categories and products
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response dict with shop data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
    
    conn = psycopg2.connect(database_url)
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        bot_id = params.get('bot_id')
        entity_type = params.get('type', 'products')
        
        if not bot_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bot_id parameter is required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if entity_type == 'categories':
            query = f'''SELECT * FROM t_p5255237_telegram_bot_service.shop_categories 
                       WHERE bot_id = {bot_id} AND is_active = true 
                       ORDER BY sort_order, name'''
            cursor.execute(query)
            categories = cursor.fetchall()
            result = {'categories': [dict(cat) for cat in categories]}
        else:
            category_id = params.get('category_id')
            if category_id:
                query = f'''SELECT * FROM t_p5255237_telegram_bot_service.shop_products 
                           WHERE bot_id = {bot_id} AND category_id = {category_id} AND is_available = true 
                           ORDER BY sort_order, name'''
            else:
                query = f'''SELECT * FROM t_p5255237_telegram_bot_service.shop_products 
                           WHERE bot_id = {bot_id} AND is_available = true 
                           ORDER BY sort_order, name'''
            cursor.execute(query)
            products = cursor.fetchall()
            result = {'products': [dict(prod) for prod in products]}
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        entity_type = body_data.get('type', 'product')
        bot_id = body_data.get('bot_id')
        
        if not bot_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'bot_id is required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if entity_type == 'category':
            name = body_data.get('name', '')
            description = body_data.get('description', '')
            emoji = body_data.get('emoji', '')
            sort_order = body_data.get('sort_order', 0)
            
            name_escaped = name.replace("'", "''")
            description_escaped = description.replace("'", "''")
            emoji_escaped = emoji.replace("'", "''")
            
            query = f'''INSERT INTO t_p5255237_telegram_bot_service.shop_categories 
                       (bot_id, name, description, emoji, sort_order)
                       VALUES ({bot_id}, '{name_escaped}', '{description_escaped}', '{emoji_escaped}', {sort_order})
                       RETURNING *'''
            cursor.execute(query)
            category = cursor.fetchone()
            conn.commit()
            result = {'category': dict(category)}
        else:
            name = body_data.get('name', '')
            description = body_data.get('description', '')
            price = body_data.get('price', 0)
            category_id = body_data.get('category_id')
            image_url = body_data.get('image_url', '')
            stock_quantity = body_data.get('stock_quantity', 0)
            
            name_escaped = name.replace("'", "''")
            description_escaped = description.replace("'", "''")
            image_url_escaped = image_url.replace("'", "''")
            category_id_str = str(category_id) if category_id else 'NULL'
            
            query = f'''INSERT INTO t_p5255237_telegram_bot_service.shop_products 
                       (bot_id, category_id, name, description, price, image_url, stock_quantity)
                       VALUES ({bot_id}, {category_id_str}, '{name_escaped}', '{description_escaped}', 
                               {price}, '{image_url_escaped}', {stock_quantity})
                       RETURNING *'''
            cursor.execute(query)
            product = cursor.fetchone()
            conn.commit()
            result = {'product': dict(product)}
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
    
    conn.close()
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
