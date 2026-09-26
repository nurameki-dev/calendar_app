variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "プロジェクト名（タグに使用）"
  type        = string
  default     = "project"
}

variable "environment" {
  description = "環境名（dev / stg / prod）"
  type        = string
  default     = "dev"
}

variable "bucket_name" {
  description = "バケット名"
  type        = string
  # default は設定しない → terraform apply 時に必ず入力させる
}

variable "enable_versioning" {
  description = "バージョニングを有効にするか"
  type        = bool
  default     = false
}
