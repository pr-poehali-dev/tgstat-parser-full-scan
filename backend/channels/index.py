'''
Business: Get channels data from database with filtering and pagination
Args: event - dict with httpMethod, queryStringParameters (job_id, limit)
      context - object with request_id attribute
Returns: HTTP response with channels list
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

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
        params = event.get('queryStringParameters') or {}
        job_id = params.get('job_id')
        limit = int(params.get('limit', '50'))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT 
                c.id,
                c.title,
                c.link,
                c.subscribers,
                c.verified,
                COALESCE(
                    ARRAY_AGG(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL),
                    ARRAY[]::VARCHAR[]
                ) as tags,
                COALESCE(ca.admin_name, '') as admin
            FROM channels c
            LEFT JOIN channel_tags ct ON c.id = ct.channel_id
            LEFT JOIN channel_admins ca ON c.id = ca.channel_id
        """
        
        if job_id:
            query += " WHERE c.job_id = %s"
            cur.execute(query + " GROUP BY c.id, ca.admin_name ORDER BY c.subscribers DESC LIMIT %s", (job_id, limit))
        else:
            cur.execute(query + " GROUP BY c.id, ca.admin_name ORDER BY c.subscribers DESC LIMIT %s", (limit,))
        
        channels = []
        for row in cur.fetchall():
            channels.append({
                'id': str(row[0]),
                'title': row[1],
                'link': row[2],
                'subscribers': row[3],
                'verified': row[4],
                'tags': row[5] if row[5] else [],
                'admin': row[6]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'channels': channels})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
