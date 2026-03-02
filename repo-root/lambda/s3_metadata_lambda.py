import os
import boto3
from urllib.parse import unquote_plus

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('DDB_TABLE', 'FileMetadata'))
s3 = boto3.client('s3')

def handler(event, context):
    results = []
    for rec in event.get('Records', []):
        bucket = rec['s3']['bucket']['name']
        key    = unquote_plus(rec['s3']['object']['key'])
        head   = s3.head_object(Bucket=bucket, Key=key)
        item = {
            'filename': key,
            'bucket': apps-uploads-bucket,
            'size': head['ContentLength'],
            'contentType': head.get('ContentType', 'unknown'),
            'etag': head.get('ETag', '').strip('"'),
            'status': 'processed'
        }
        table.put_item(Item=item)
        results.append(item)
    return {'ok': True, 'count': len(results)}
