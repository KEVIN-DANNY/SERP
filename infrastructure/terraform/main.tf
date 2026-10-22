terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# -------------------------------------------------------------
# 1. DynamoDB Table with Atomic Counters & Conditional Writes
# -------------------------------------------------------------
resource "aws_dynamodb_table" "serp_events" {
  name           = "serp-events-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST" # Serverless on-demand scaling
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project     = "SERP"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "serp_registrations" {
  name           = "serp-registrations-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "ticket_code"
    type = "S"
  }

  global_secondary_index {
    name            = "TicketCodeIndex"
    hash_key        = "ticket_code"
    projection_type = "ALL"
  }

  tags = {
    Project = "SERP"
  }
}

# -------------------------------------------------------------
# 2. Asynchronous SQS Queue with Dead-Letter Queue (DLQ)
# -------------------------------------------------------------
resource "aws_sqs_queue" "serp_dlq" {
  name                      = "serp-ticket-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_sqs_queue" "serp_notifications_queue" {
  name                      = "serp-ticket-queue-${var.environment}"
  visibility_timeout_seconds = 60
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.serp_dlq.arn
    maxReceiveCount     = 3
  })
}

# -------------------------------------------------------------
# 3. Serverless API Gateway HTTP API
# -------------------------------------------------------------
resource "aws_apigatewayv2_api" "serp_api" {
  name          = "serp-gateway-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }
}

# -------------------------------------------------------------
# 4. S3 Static Web Hosting & CloudFront CDN
# -------------------------------------------------------------
resource "aws_s3_bucket" "serp_frontend_bucket" {
  bucket = "serp-frontend-${var.environment}-${var.aws_region}"
}

resource "aws_cloudfront_distribution" "serp_cdn" {
  origin {
    domain_name = aws_s3_bucket.serp_frontend_bucket.bucket_regional_domain_name
    origin_id   = "S3-serp-frontend"
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-serp-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
