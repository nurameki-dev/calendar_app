output "bucket_name" {
  description = "S3バケット名"
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "S3バケットのARN（IAMポリシーなどで使用）"
  value       = aws_s3_bucket.website.arn
}

output "website_endpoint" {
  description = "静的ウェブサイトのURL"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}
