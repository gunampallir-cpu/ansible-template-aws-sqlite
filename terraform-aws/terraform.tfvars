# AWS Configuration
aws_account_id = "995995866018"
aws_region     = "us-east-1"
environment    = "production"
project_name   = "ansible-template"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]

# EKS Configuration
eks_cluster_version      = "1.28"
eks_node_instance_types  = ["t3.medium"]
eks_node_desired_size    = 2
eks_node_min_size        = 1
eks_node_max_size        = 5
eks_node_disk_size       = 30

# ECR Configuration
ecr_repositories         = ["ansible-template-frontend", "ansible-template-backend"]
ecr_image_retention_count = 10

# Istio Configuration
enable_istio    = true
istio_version   = "1.20.0"

# Monitoring
enable_cloudwatch_logs = true
log_retention_days     = 30

# Additional Tags
additional_tags = {
  Application = "Ansible Template Generator"
  Team        = "DevOps"
  CostCenter  = "Engineering"
}
