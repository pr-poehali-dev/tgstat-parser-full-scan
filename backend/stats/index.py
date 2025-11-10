'''
Business: Get statistics dashboard data (total channels, subscribers, scans)
Args: event - dict with httpMethod
      context - object with request_id attribute
Returns: HTTP response with statistics
'''

import json
import os
import psycopg2
from typing import Dict, Any

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'GET':
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM channels")
        total_channels = cur.fetchone()[0]
        
        cur.execute("SELECT COALESCE(SUM(subscribers), 0) FROM channels")
        total_subscribers = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT category) FROM scan_jobs WHERE category != 'N/A'")
        categories_scanned = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM scan_jobs WHERE status = 'running'")
        active_scans = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'totalChannels': total_channels,
                'totalSubscribers': total_subscribers,
                'categoriesScanned': categories_scanned,
                'activeScans': active_scans
            })
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
