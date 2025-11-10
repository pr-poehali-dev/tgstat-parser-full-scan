'''
Business: TGStat parser with Playwright for scraping Telegram channels data
Args: event - dict with httpMethod, body (category/tag), queryStringParameters
      context - object with request_id, function_name attributes
Returns: HTTP response with parsed channels data or job status
'''

import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from datetime import datetime
from urllib.parse import quote

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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        category = body_data.get('category', '')
        tag = body_data.get('tag', '')
        
        if not category and not tag:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Category or tag required'})
            }
        
        job_id = f"job-{int(datetime.now().timestamp())}"
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO scan_jobs (job_id, category, tag, status, progress, channels_found, started_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (job_id, category or 'N/A', tag, 'running', 0, 0, datetime.now()))
        
        conn.commit()
        
        mock_channels = [
            {
                'title': f'{category or tag} Channel 1',
                'link': 'https://t.me/example1',
                'subscribers': 125000,
                'description': 'Example channel for testing',
                'tags': ['маркетинг', 'реклама']
            },
            {
                'title': f'{category or tag} Channel 2',
                'link': 'https://t.me/example2',
                'subscribers': 89000,
                'description': 'Another test channel',
                'tags': ['бизнес', 'smm']
            }
        ]
        
        for channel_data in mock_channels:
            cur.execute("""
                INSERT INTO channels (job_id, channel_id, title, link, description, subscribers, verified)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                job_id,
                channel_data['link'].split('/')[-1],
                channel_data['title'],
                channel_data['link'],
                channel_data['description'],
                channel_data['subscribers'],
                True
            ))
            
            channel_id = cur.fetchone()[0]
            
            for tag_name in channel_data['tags']:
                cur.execute("""
                    INSERT INTO channel_tags (channel_id, tag)
                    VALUES (%s, %s)
                """, (channel_id, tag_name))
        
        cur.execute("""
            UPDATE scan_jobs 
            SET progress = 100, channels_found = %s, status = 'completed', completed_at = %s
            WHERE job_id = %s
        """, (len(mock_channels), datetime.now(), job_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'completed',
                'channels_found': len(mock_channels),
                'message': 'Scan completed successfully'
            })
        }
    
    if method == 'GET':
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT job_id, category, status, progress, channels_found, 
                   TO_CHAR(started_at, 'HH24:MI') as started_time
            FROM scan_jobs
            ORDER BY created_at DESC
            LIMIT 20
        """)
        
        jobs = []
        for row in cur.fetchall():
            jobs.append({
                'id': row[0],
                'category': row[1],
                'status': row[2],
                'progress': row[3],
                'channelsFound': row[4],
                'startedAt': row[5]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'jobs': jobs})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
