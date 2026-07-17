resource "aws_s3_bucket" "uploads" {
  bucket        = "eagle-lms-uploads"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "uploads_access" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
