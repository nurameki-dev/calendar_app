# ─────────────────────────────────────────
# S3 バケット本体
# ─────────────────────────────────────────
resource "aws_s3_bucket" "website" {
  bucket = var.bucket_name

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ─────────────────────────────────────────
# パブリックアクセスのブロック設定
# 静的ウェブサイトとして公開するため全てfalseにする
# ─────────────────────────────────────────
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ─────────────────────────────────────────
# 静的ウェブサイトホスティングの有効化
# ─────────────────────────────────────────
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPAのため404もindex.htmlに返す
  }
}

# ─────────────────────────────────────────
# バケットポリシー（全ユーザーが読み取り可能）
# public_access_block が反映されてから作成する必要があるため
# depends_on で順序を保証する
# ─────────────────────────────────────────
resource "aws_s3_bucket_policy" "website" {
  bucket     = aws_s3_bucket.website.id
  depends_on = [aws_s3_bucket_public_access_block.website]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

# ─────────────────────────────────────────
# バージョニング（任意：有効にすると上書き前のファイルを復元できる）
# ─────────────────────────────────────────
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}
