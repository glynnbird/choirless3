resource "cloudflare_r2_bucket" "video_bucket" {
  account_id = var.cloudflare_account_id
  name = "choirless3-video-storage"
}

resource "cloudflare_r2_bucket_cors" "video_bucket_cors" {
  account_id = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.video_bucket.name
  rules = [{
    allowed = {
      methods = ["GET","PUT"]
      origins = ["http://localhost:3000"]
      headers = ["x-requested-by","Content-Type"]
    }
    id = "Allow Local Development"
    expose_headers = ["Content-Encoding","Content-Type","ETag"]
    max_age_seconds = 3600
  },
  {
    allowed = {
      methods = ["GET","PUT"]
      origins = ["https://${var.cloudflare_subdomain}.${var.cloudflare_hostname}"]
      headers = ["x-requested-by","Content-Type"]
    }
    id = "Allow Local Development"
    expose_headers = ["Content-Encoding","Content-Type","ETag"]
    max_age_seconds = 3600
  }]
}
