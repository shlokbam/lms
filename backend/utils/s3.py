import os
import boto3
from botocore.exceptions import ClientError

USE_S3 = os.getenv("USE_S3", "false").lower() == "true"
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "eagle-lms-uploads")
AWS_ENDPOINT = os.getenv("AWS_ENDPOINT_URL")

s3_client = None
if USE_S3:
    s3_client = boto3.client(
        "s3",
        endpoint_url=AWS_ENDPOINT,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "mock_key"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "mock_key"),
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )

def upload_file_to_s3(local_path: str, s3_key: str) -> bool:
    if not USE_S3:
        return False
    try:
        s3_client.upload_file(local_path, S3_BUCKET, s3_key)
        return True
    except ClientError as e:
        print(f"S3 upload error: {e}")
        return False

def download_file_from_s3(s3_key: str, local_path: str) -> bool:
    if not USE_S3:
        return False
    try:
        s3_client.download_file(S3_BUCKET, s3_key, local_path)
        return True
    except ClientError as e:
        print(f"S3 download error: {e}")
        return False

def delete_file_from_s3(s3_key: str) -> bool:
    if not USE_S3:
        return False
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        return True
    except ClientError as e:
        print(f"S3 delete error: {e}")
        return False
