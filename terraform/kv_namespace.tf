resource "cloudflare_workers_kv_namespace" "choirlesskv" {
  account_id = var.cloudflare_account_id
  title      = "choirless-${terraform.workspace}"
}

output "kv_id" {
  value = cloudflare_workers_kv_namespace.choirlesskv.id
}
