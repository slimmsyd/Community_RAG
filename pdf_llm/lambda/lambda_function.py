import json
import base64
import boto3
import os
import uuid

# S3 client for storing files
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'pdf-llm-storage')

def lambda_handler(event, context):
    """Handler for Lambda function"""
    try:
        print(f"Received event: {json.dumps(event)}")
        
        # Check if this is a base64-encoded JSON payload
        if isinstance(event, dict) and 'filename' in event and 'file_content' in event:
            # Get the data from the JSON payload
            filename = event['filename']
            content_type = event.get('content_type', 'application/pdf')
            file_content_base64 = event['file_content']
            
            # Decode the base64 content
            file_content = base64.b64decode(file_content_base64)
            
            # Generate a session ID
            session_id = str(uuid.uuid4())
            
            # Upload to S3
            s3_path = f"uploads/{session_id}/{filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_path,
                Body=file_content,
                ContentType=content_type
            )
            
            # Return success response
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'session_id': session_id,
                    'message': f'PDF {filename} uploaded successfully'
                })
            }
            
        # If it's not a base64 JSON payload, handle API Gateway proxy request
        elif 'body' in event and 'httpMethod' in event:
            # Parse the request body
            body = event.get('body', '{}')
            if event.get('isBase64Encoded', False):
                body = base64.b64decode(body).decode('utf-8')
                
            try:
                payload = json.loads(body)
            except:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Invalid JSON in request body'
                    })
                }
                
            # Process the payload like above
            if 'filename' in payload and 'file_content' in payload:
                filename = payload['filename']
                content_type = payload.get('content_type', 'application/pdf')
                file_content_base64 = payload['file_content']
                
                # Decode the base64 content
                file_content = base64.b64decode(file_content_base64)
                
                # Generate a session ID
                session_id = str(uuid.uuid4())
                
                # Upload to S3
                s3_path = f"uploads/{session_id}/{filename}"
                s3_client.put_object(
                    Bucket=S3_BUCKET,
                    Key=s3_path,
                    Body=file_content,
                    ContentType=content_type
                )
                
                # Return success response
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'success': True,
                        'session_id': session_id,
                        'message': f'PDF {filename} uploaded successfully'
                    })
                }
                
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required fields: filename and file_content'
                })
            }
        
        # Return error for invalid request
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Invalid request format'
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        } 