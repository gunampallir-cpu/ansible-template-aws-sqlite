# AWS Terraform Infrastructure for Ansible Template

This directory contains Terraform infrastructure-as-code (IaC) for deploying the Ansible Template application to AWS using Amazon EKS (Elastic Kubernetes Service) and ECR (Elastic Container Registry).

## Architecture

- **AWS EKS**: Managed Kubernetes cluster (v1.28)
- **Amazon ECR**: Private container registry for Docker images
- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **NAT Gateways**: High availability NAT in each AZ for private subnet internet access
- **Istio Service Mesh**: Traffic management, security, and observability
- **CloudWatch**: Centralized logging and monitoring

## Prerequisites

1. **AWS CLI** (v2.x or higher)
   ```bash
   aws --version
   ```
   Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

2. **Terraform** (v1.6.0 or higher)
   ```bash
   terraform version
   ```
   Install: https://developer.hashicorp.com/terraform/install

3. **kubectl** (v1.28 or higher)
   ```bash
   kubectl version --client
   ```
   Install: https://kubernetes.io/docs/tasks/tools/

4. **Helm** (v3.13 or higher)
   ```bash
   helm version
   ```
   Install: https://helm.sh/docs/intro/install/

5. **AWS Account**
   - Active AWS account with appropriate permissions
   - IAM user with AdministratorAccess or equivalent permissions

## AWS Setup

### 1. Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# Verify credentials
aws sts get-caller-identity
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### 2. Create S3 Backend (Optional but Recommended)

The Terraform state is stored in S3 for team collaboration:

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket ansible-template-tfstate \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ansible-template-tfstate \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name ansible-template-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Files Overview

- **main.tf**: Main Terraform configuration with provider and backend setup
- **variables.tf**: Input variable definitions
- **terraform.tfvars**: Variable values (customize for your environment)
- **vpc.tf**: VPC, subnets, NAT gateways, security groups
- **ecr.tf**: ECR repositories for frontend and backend images
- **iam.tf**: IAM roles and policies for EKS cluster and nodes
- **eks.tf**: EKS cluster, node group, and add-ons
- **istio.tf**: Istio service mesh installation via Helm
- **cloudwatch.tf**: CloudWatch log groups
- **outputs.tf**: Output values (cluster endpoint, ECR URLs, etc.)

## Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform-aws
terraform init
```

This will:
- Download required providers (AWS, Kubernetes, Helm)
- Configure the S3 backend
- Prepare the working directory

### 2. Review Configuration

Edit `terraform.tfvars` to customize your deployment:

```hcl
aws_account_id = "995995866018"  # Your AWS account ID
aws_region     = "us-east-1"     # Your preferred region
project_name   = "ansible-template"
environment    = "production"
```

### 3. Validate Configuration

```bash
terraform validate
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully. This will show:
- Resources to be created (VPC, EKS, ECR, IAM roles, etc.)
- Estimated costs
- Any potential issues

### 5. Apply Infrastructure

```bash
terraform apply tfplan
```

This will take approximately **15-20 minutes** to complete. Resources created:
- VPC with 6 subnets (3 public, 3 private)
- NAT Gateways (3)
- EKS Cluster
- EKS Node Group (2-5 t3.medium instances)
- ECR Repositories (frontend, backend)
- IAM Roles and Policies
- Istio Service Mesh
- CloudWatch Log Groups

### 6. Configure kubectl

After deployment completes, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name ansible-template-eks

# Verify connection
kubectl get nodes
kubectl get namespaces
```

### 7. Verify Istio Installation

```bash
kubectl get pods -n istio-system
kubectl get svc -n istio-ingress
```

## Outputs

After successful deployment, Terraform will display:

```hcl
eks_cluster_endpoint = "https://xxxxx.eks.us-east-1.amazonaws.com"
eks_cluster_name = "ansible-template-eks"
ecr_repository_urls = {
  "frontend" = "995995866018.dkr.ecr.us-east-1.amazonaws.com/frontend"
  "backend"  = "995995866018.dkr.ecr.us-east-1.amazonaws.com/backend"
}
configure_kubectl = "aws eks update-kubeconfig --region us-east-1 --name ansible-template-eks"
```

## Working with ECR

### Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  995995866018.dkr.ecr.us-east-1.amazonaws.com
```

### Build and Push Images

```bash
# Backend
cd ../backend
docker build -t backend:latest .
docker tag backend:latest 995995866018.dkr.ecr.us-east-1.amazonaws.com/backend:latest
docker push 995995866018.dkr.ecr.us-east-1.amazonaws.com/backend:latest

# Frontend
cd ../frontend
docker build -t frontend:latest .
docker tag frontend:latest 995995866018.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
docker push 995995866018.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
```

## Monitoring

### View CloudWatch Logs

```bash
# EKS cluster logs
aws logs tail /aws/eks/ansible-template-eks/cluster --follow

# Application logs
aws logs tail /aws/eks/ansible-template/backend --follow
aws logs tail /aws/eks/ansible-template/frontend --follow
```

### Access EKS Dashboard

```bash
kubectl proxy
```

Then access: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

## Troubleshooting

### EKS Cluster Not Accessible

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name ansible-template-eks

# Check cluster status
aws eks describe-cluster --name ansible-template-eks --region us-east-1
```

### Nodes Not Ready

```bash
# Check node status
kubectl get nodes -o wide

# Check node group
aws eks describe-nodegroup \
  --cluster-name ansible-template-eks \
  --nodegroup-name ansible-template-node-group \
  --region us-east-1
```

### ECR Push Issues

```bash
# Re-authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  995995866018.dkr.ecr.us-east-1.amazonaws.com

# Check repository exists
aws ecr describe-repositories --region us-east-1
```

### Istio Issues

```bash
# Check Istio installation
istioctl version
kubectl get pods -n istio-system

# Check Istio configuration
istioctl analyze -n production
```

## Cost Estimation

Monthly costs (us-east-1):
- **EKS Cluster**: ~$73/month ($0.10/hour)
- **EC2 Instances**: ~$60-150/month (2-5 x t3.medium)
- **NAT Gateways**: ~$97/month (3 x $0.045/hour)
- **ALB**: ~$16/month
- **ECR Storage**: ~$1-5/month (varies with image count)
- **Data Transfer**: Variable based on usage
- **CloudWatch Logs**: ~$0.50-5/month (varies with log volume)

**Estimated Total**: ~$247-346/month

## Resource Cleanup

To destroy all AWS resources:

```bash
# Delete application deployments first
kubectl delete namespace production

# Destroy Terraform infrastructure
terraform destroy -auto-approve
```

**Warning**: This will permanently delete all resources including data. Make backups if needed.

### Manual Cleanup (if needed)

If `terraform destroy` fails:

```bash
# Delete EKS cluster
aws eks delete-cluster --name ansible-template-eks --region us-east-1

# Delete node group
aws eks delete-nodegroup \
  --cluster-name ansible-template-eks \
  --nodegroup-name ansible-template-node-group \
  --region us-east-1

# Delete ECR repositories
aws ecr delete-repository --repository-name frontend --region us-east-1 --force
aws ecr delete-repository --repository-name backend --region us-east-1 --force

# Delete VPC (after all resources are removed)
aws ec2 delete-vpc --vpc-id <vpc-id> --region us-east-1
```

## Security Best Practices

1. **IAM Roles**: Use IAM roles for service accounts (IRSA) instead of hardcoded credentials
2. **Network Policies**: Implement Kubernetes network policies to restrict pod communication
3. **Secrets Management**: Use AWS Secrets Manager or Parameter Store for sensitive data
4. **Image Scanning**: Enable ECR image scanning (already configured)
5. **Private Endpoints**: Consider using VPC endpoints for AWS services
6. **Encryption**: Enable encryption for EKS secrets and EBS volumes
7. **Audit Logging**: Enable EKS audit logs in CloudWatch

## Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Istio Documentation](https://istio.io/latest/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Check Terraform state: `terraform state list`
4. Verify AWS service limits: https://console.aws.amazon.com/servicequotas/
