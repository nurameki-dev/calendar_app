terraform {
  backend "s3" {
    bucket = "aws-s3-for-study-202512"
    key    = "tfstate/terraform_calender_app.tfstate"
    region = "ap-northeast-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = "ap-northeast-1"
}