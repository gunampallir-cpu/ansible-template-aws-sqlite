# AWS Deployment Guide

## Ansible Template Application - AWS Infrastructure

This guide provides comprehensive instructions for deploying the Ansible Template application to AWS using Amazon EKS (Elastic Kubernetes Service), ECR (Elastic Container Registry), and supporting AWS services.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [AWS Account Setup](#aws-account-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Deployment Process](#deployment-process)
6. [Accessing the Application](#accessing-the-application)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)
9. [Cost Estimation](#cost-estimation)
10. [Cleanup](#cleanup)

## Architecture Overview

The application is deployed with the following AWS architecture:

### Infrastructure Components

- **Amazon EKS**: Managed Kubernetes cluster (v1.28) for container orchestration
- **Amazon ECR**: Private container registry for Docker images
- **VPC**: Custom VPC with public and private subnets across 3 availability zones
- **NAT Gateways**: High availability NAT configuration for outbound internet access
- **Application Load Balancer**: Managed by Istio Ingress Gateway
- **Amazon CloudWatch**: Centralized logging and monitoring
- **IAM Roles**: Service roles for EKS cluster and node groups

### Application Architecture

- **Frontend**: React 18 application served by Nginx (2 replicas, autoscaling to 5)
- **Backend**: Node.js/Express API with SQLite database (2 replicas, autoscaling to 5)
- **Service Mesh**: Istio for traffic management, security, and observability
- **Storage**: Amazon EBS volumes for persistent data (SQLite database)

### Network Architecture

```
Internet
    |
Istio Ingress Gateway (NLB)
    |
    ├── Frontend Service (React)
    │   └── Pods (2-5 replicas)
    |
    └── Backend Service (Node.js)
        └── Pods (2-5 replicas) + Persistent Volume (SQLite)
```

## Prerequisites

### Required Tools

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

5. **Docker** (v24.x or higher)
   ```bash
   docker version
   ```
   Install: https://docs.docker.com/get-docker/

### AWS Account Requirements

- Active AWS account with billing enabled
- IAM user with the following permissions:
  - `AdministratorAccess` (recommended for initial setup)
  - Or custom policy with permissions for: EC2, EKS, ECR, VPC, IAM, CloudWatch, S3, DynamoDB

### Knowledge Requirements

- Basic understanding of Kubernetes concepts
- Familiarity with AWS services
- Experience with Infrastructure as Code (Terraform)
- Understanding of CI/CD pipelines (GitHub Actions)

## AWS Account Setup

### Step 1: Configure AWS CLI

Configure your AWS credentials:

```bash
aws configure
```

You will be prompted for:
- **AWS Access Key ID**: Your IAM user access key
- **AWS Secret Access Key**: Your IAM user secret key
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

Verify your configuration:

```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "995995866018",
    "Arn": "arn:aws:iam::995995866018:user/your-username"
}
```

### Step 2: Create IAM User for CI/CD (Optional but Recommended)

Create a dedicated IAM user for GitHub Actions:

```bash
# Create IAM user
aws iam create-user --user-name github-actions-ansible-template

# Attach required policies
aws iam attach-user-policy \
  --user-name github-actions-ansible-template \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-user-policy \
  --user-name github-actions-ansible-template \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

aws iam attach-user-policy \
  --user-name github-actions-ansible-template \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

# Create access key
aws iam create-access-key --user-name github-actions-ansible-template
```

Save the `AccessKeyId` and `SecretAccessKey` from the output for GitHub Secrets.

### Step 3: Create S3 Backend for Terraform State

Create an S3 bucket and DynamoDB table for Terraform state management:

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket ansible-template-tfstate \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ansible-template-tfstate \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket ansible-template-tfstate \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name ansible-template-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

### Navigate to Repository Settings

1. Go to your repository: https://github.com/gunampallir-cpu/ansible-template-aws-sqlite
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**

### Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for GitHub Actions user | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for deployment | `us-east-1` |
| `AWS_ACCOUNT_ID` | Your AWS account ID | `995995866018` |

### Using the Setup Script (Automated)

Run the provided script to automate secret configuration:

```bash
# Make the script executable
chmod +x scripts/setup-aws-github-secrets.sh

# Run the script
./scripts/setup-aws-github-secrets.sh
```

The script will:
1. Prompt for your GitHub personal access token
2. Prompt for AWS credentials
3. Automatically create all required secrets

### Manual Secret Creation

Alternatively, create each secret manually:

```bash
# Using GitHub CLI (gh)
gh secret set AWS_ACCESS_KEY_ID -b "YOUR_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY -b "YOUR_SECRET_ACCESS_KEY"
gh secret set AWS_REGION -b "us-east-1"
gh secret set AWS_ACCOUNT_ID -b "995995866018"
```

## Deployment Process

### Option 1: Automated Deployment via GitHub Actions (Recommended)

The CI/CD pipeline automatically deploys on push to the `main` branch.

#### Workflow Overview

The pipeline consists of the following jobs:

1. **Code Quality**: Linting and testing
2. **Security Scan**: Trivy vulnerability scanning
3. **Build Images**: Build and push to ECR (backend & frontend)
4. **Scan Images**: Security scan of Docker images
5. **Terraform Plan**: Plan infrastructure changes
6. **Terraform Apply**: Apply infrastructure (on `main` branch)
7. **Deploy to EKS**: Deploy applications with Helm

#### Trigger Deployment

```bash
# Commit and push changes
git add .
git commit -m "Deploy to AWS"
git push origin main
```

The pipeline will automatically:
- Run code quality checks
- Build and scan Docker images
- Push images to ECR
- Provision AWS infrastructure with Terraform
- Deploy applications to EKS with Helm

#### Monitor Pipeline Progress

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select the running workflow
4. Monitor each job's progress

Expected duration: **20-25 minutes** for complete deployment

### Option 2: Manual Deployment

For manual deployment or local testing:

#### Step 1: Initialize Terraform

```bash
cd terraform-aws
terraform init
```

#### Step 2: Plan Infrastructure

```bash
terraform plan -out=tfplan
```

Review the plan carefully. Expected resources:
- VPC with 6 subnets
- EKS cluster
- EKS node group
- 2 ECR repositories
- IAM roles and policies
- CloudWatch log groups
- Istio service mesh

#### Step 3: Apply Infrastructure

```bash
terraform apply tfplan
```

This takes approximately **15-20 minutes**.

#### Step 4: Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name ansible-template-eks
kubectl get nodes
```

#### Step 5: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  995995866018.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t backend:latest .
docker tag backend:latest 995995866018.dkr.ecr.us-east-1.amazonaws.com/backend:latest
docker push 995995866018.dkr.ecr.us-east-1.amazonaws.com/backend:latest

# Build and push frontend
cd ../frontend
docker build -t frontend:latest .
docker tag frontend:latest 995995866018.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
docker push 995995866018.dkr.ecr.us-east-1.amazonaws.com/frontend:latest
```

#### Step 6: Deploy with Helm

```bash
# Deploy backend
helm upgrade --install ansible-template-backend ./helm/backend \
  --namespace production \
  --create-namespace \
  --set image.tag=latest \
  --wait

# Deploy frontend
helm upgrade --install ansible-template-frontend ./helm/frontend \
  --namespace production \
  --set image.tag=latest \
  --wait
```

#### Step 7: Verify Deployment

```bash
kubectl get pods -n production
kubectl get services -n production
kubectl get svc -n istio-ingress
```

## Accessing the Application

### Get the Application URL

The application is exposed through the Istio Ingress Gateway using a Network Load Balancer:

```bash
# Get the load balancer URL
kubectl get svc -n istio-ingress istio-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Example output:
```
a1234567890abcdef1234567890abcd-1234567890.us-east-1.elb.amazonaws.com
```

### Access the Application

Open your browser and navigate to the load balancer URL:

```
http://a1234567890abcdef1234567890abcd-1234567890.us-east-1.elb.amazonaws.com
```

**Note**: It may take 2-3 minutes for the load balancer to become fully operational and pass health checks.

### Configure Custom Domain (Optional)

To use a custom domain:

1. **Create Route 53 Hosted Zone** (if not exists):
   ```bash
   aws route53 create-hosted-zone --name example.com --caller-reference $(date +%s)
   ```

2. **Create DNS Record**:
   ```bash
   # Get the hosted zone ID
   ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name example.com --query "HostedZones[0].Id" --output text)
   
   # Get the load balancer DNS name
   LB_DNS=$(kubectl get svc -n istio-ingress istio-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   
   # Create record
   aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{
     "Changes": [{
       "Action": "CREATE",
       "ResourceRecordSet": {
         "Name": "ansible-template.example.com",
         "Type": "CNAME",
         "TTL": 300,
         "ResourceRecords": [{"Value": "'$LB_DNS'"}]
       }
     }]
   }'
   ```

3. **Update Istio Gateway** in `helm/backend/templates/gateway.yaml` and `helm/frontend/templates/gateway.yaml`:
   ```yaml
   spec:
     servers:
     - hosts:
       - "ansible-template.example.com"  # Update this
   ```

## Monitoring and Logging

### CloudWatch Logs

#### View Application Logs

```bash
# Backend logs
aws logs tail /aws/eks/ansible-template/backend --follow --region us-east-1

# Frontend logs
aws logs tail /aws/eks/ansible-template/frontend --follow --region us-east-1

# EKS cluster logs
aws logs tail /aws/eks/ansible-template-eks/cluster --follow --region us-east-1
```

#### Access Logs via Console

1. Open AWS Console: https://console.aws.amazon.com/cloudwatch/
2. Navigate to **Logs** > **Log groups**
3. Select log group:
   - `/aws/eks/ansible-template/backend`
   - `/aws/eks/ansible-template/frontend`
   - `/aws/eks/ansible-template-eks/cluster`

### Kubernetes Dashboard

#### Install Kubernetes Dashboard

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

#### Create Admin User

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF
```

#### Get Access Token

```bash
kubectl -n kubernetes-dashboard create token admin-user
```

#### Access Dashboard

```bash
kubectl proxy
```

Open: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

### Istio Monitoring

#### Kiali Dashboard

```bash
# Install Kiali
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# Port forward
kubectl port-forward svc/kiali -n istio-system 20001:20001

# Access at http://localhost:20001
```

#### Prometheus Metrics

```bash
# Install Prometheus
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml

# Port forward
kubectl port-forward svc/prometheus -n istio-system 9090:9090

# Access at http://localhost:9090
```

#### Grafana Dashboards

```bash
# Install Grafana
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml

# Port forward
kubectl port-forward svc/grafana -n istio-system 3000:3000

# Access at http://localhost:3000
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: EKS Cluster Not Accessible

**Symptoms**: `kubectl` commands fail with connection errors

**Solution**:
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name ansible-template-eks

# Verify AWS credentials
aws sts get-caller-identity

# Check cluster status
aws eks describe-cluster --name ansible-template-eks --region us-east-1
```

#### Issue 2: Pods in Pending State

**Symptoms**: Pods stuck in `Pending` state

**Solution**:
```bash
# Check pod events
kubectl describe pod <pod-name> -n production

# Check node resources
kubectl top nodes

# Check node status
kubectl get nodes -o wide

# Common causes:
# - Insufficient node capacity (scale node group)
# - Image pull errors (check ECR permissions)
# - Persistent volume issues (check EBS CSI driver)
```

#### Issue 3: Image Pull Errors

**Symptoms**: `ImagePullBackOff` or `ErrImagePull`

**Solution**:
```bash
# Verify ECR repository exists
aws ecr describe-repositories --region us-east-1

# Check IAM role permissions
aws eks describe-nodegroup \
  --cluster-name ansible-template-eks \
  --nodegroup-name ansible-template-node-group \
  --region us-east-1

# Verify image exists in ECR
aws ecr list-images --repository-name backend --region us-east-1
aws ecr list-images --repository-name frontend --region us-east-1
```

#### Issue 4: Load Balancer Not Working

**Symptoms**: Cannot access application via load balancer URL

**Solution**:
```bash
# Check Istio Ingress Gateway
kubectl get svc -n istio-ingress
kubectl describe svc istio-ingress -n istio-ingress

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Verify security groups
kubectl get pods -n istio-ingress -o wide
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=ansible-template-eks-node-sg"
```

#### Issue 5: Terraform Apply Fails

**Symptoms**: Terraform apply errors

**Solution**:
```bash
# Check AWS service limits
aws service-quotas list-service-quotas \
  --service-code eks \
  --region us-east-1

# Verify IAM permissions
aws iam get-user

# Clean and retry
cd terraform-aws
rm -rf .terraform .terraform.lock.hcl
terraform init
terraform plan
```

#### Issue 6: Helm Deployment Fails

**Symptoms**: Helm upgrade/install errors

**Solution**:
```bash
# List current releases
helm list -n production

# Get release status
helm status ansible-template-backend -n production

# View release history
helm history ansible-template-backend -n production

# Rollback if needed
helm rollback ansible-template-backend 1 -n production

# Uninstall and reinstall
helm uninstall ansible-template-backend -n production
helm install ansible-template-backend ./helm/backend -n production
```

### Debugging Commands

```bash
# View pod logs
kubectl logs <pod-name> -n production
kubectl logs <pod-name> -n production --previous  # Previous container
kubectl logs <pod-name> -c <container-name> -n production  # Specific container

# Execute commands in pod
kubectl exec -it <pod-name> -n production -- /bin/sh

# View pod details
kubectl describe pod <pod-name> -n production

# View service endpoints
kubectl get endpoints -n production

# Check Istio sidecar injection
kubectl get pod <pod-name> -n production -o jsonpath='{.spec.containers[*].name}'

# View Istio configuration
istioctl analyze -n production

# Check resource usage
kubectl top pods -n production
kubectl top nodes
```

## Cost Estimation

### Monthly Costs (us-east-1 region)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| **Amazon EKS** | 1 cluster | ~$73/month |
| **EC2 Instances** | 2-5 x t3.medium (spot) | ~$40-100/month |
| **EC2 Instances** | 2-5 x t3.medium (on-demand) | ~$60-150/month |
| **NAT Gateways** | 3 gateways @ $0.045/hour | ~$97/month |
| **Network Load Balancer** | 1 NLB + data processing | ~$20-30/month |
| **Amazon ECR** | Storage for images | ~$1-5/month |
| **EBS Volumes** | 2-5 x 20GB gp3 | ~$2-5/month |
| **Data Transfer** | Outbound data transfer | ~$10-50/month |
| **CloudWatch Logs** | Log ingestion and storage | ~$5-20/month |

**Total Estimated Monthly Cost**: **$248-430/month**

### Cost Optimization Tips

1. **Use Spot Instances** for worker nodes (40-90% savings)
   ```hcl
   # In terraform-aws/eks.tf
   capacity_type = "SPOT"
   ```

2. **Reduce NAT Gateways** to 1 for non-production (saves ~$65/month)

3. **Enable EKS Pod Auto-scaling** to scale down during low usage

4. **Use CloudWatch Logs Retention** (set to 7 or 14 days instead of 30)

5. **Implement S3 VPC Endpoint** for ECR (reduces data transfer costs)

6. **Schedule Non-Production Environments** to shut down after hours

### Cost Monitoring

Enable AWS Cost Explorer and set up billing alerts:

```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ansible-template-billing-alarm \
  --alarm-description "Alert when estimated charges exceed $500" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD
```

## Cleanup

### Option 1: Automated Cleanup via GitHub Actions

Trigger the destroy workflow:

1. Go to **Actions** tab in GitHub
2. Select **AWS CI/CD Pipeline**
3. Click **Run workflow**
4. Select `destroy` action
5. Click **Run workflow**

This will:
1. Delete Helm releases
2. Delete Kubernetes namespace
3. Destroy all Terraform-managed resources

### Option 2: Manual Cleanup

#### Step 1: Delete Application Deployments

```bash
# Delete Helm releases
helm uninstall ansible-template-backend -n production
helm uninstall ansible-template-frontend -n production

# Delete namespace
kubectl delete namespace production
```

#### Step 2: Destroy Terraform Infrastructure

```bash
cd terraform-aws
terraform destroy -auto-approve
```

**Duration**: 10-15 minutes

#### Step 3: Clean Up ECR Images (Optional)

```bash
# Delete all images in repositories
aws ecr batch-delete-image \
  --repository-name backend \
  --image-ids "$(aws ecr list-images --repository-name backend --query 'imageIds[*]' --output json)" \
  --region us-east-1

aws ecr batch-delete-image \
  --repository-name frontend \
  --image-ids "$(aws ecr list-images --repository-name frontend --query 'imageIds[*]' --output json)" \
  --region us-east-1
```

#### Step 4: Delete S3 Terraform State (Optional)

```bash
# Empty S3 bucket
aws s3 rm s3://ansible-template-tfstate --recursive

# Delete S3 bucket
aws s3api delete-bucket \
  --bucket ansible-template-tfstate \
  --region us-east-1

# Delete DynamoDB table
aws dynamodb delete-table \
  --table-name ansible-template-tfstate-lock \
  --region us-east-1
```

#### Step 5: Delete IAM Resources (Optional)

```bash
# Detach policies
aws iam detach-user-policy \
  --user-name github-actions-ansible-template \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

# Delete access keys
aws iam list-access-keys --user-name github-actions-ansible-template
aws iam delete-access-key \
  --user-name github-actions-ansible-template \
  --access-key-id <ACCESS_KEY_ID>

# Delete user
aws iam delete-user --user-name github-actions-ansible-template
```

### Verification

Verify all resources are deleted:

```bash
# Check EKS clusters
aws eks list-clusters --region us-east-1

# Check ECR repositories
aws ecr describe-repositories --region us-east-1

# Check VPCs (look for ansible-template VPC)
aws ec2 describe-vpcs --region us-east-1

# Check CloudWatch log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/eks/ansible-template" --region us-east-1
```

## Additional Resources

### AWS Documentation

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [Amazon ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

### Terraform

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform EKS Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest)

### Kubernetes & Istio

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [Helm Documentation](https://helm.sh/docs/)

### GitHub Actions

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Actions for GitHub](https://github.com/aws-actions)

## Support

For issues or questions:

1. **Check Logs**: Review CloudWatch logs and pod logs
2. **GitHub Issues**: Create an issue at https://github.com/gunampallir-cpu/ansible-template-aws-sqlite/issues
3. **AWS Support**: Contact AWS Support for infrastructure issues
4. **Community**: Ask questions on Stack Overflow with tags: `aws-eks`, `terraform`, `istio`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- Your Team Name
- GitHub: https://github.com/gunampallir-cpu

## Changelog

### Version 1.0.0 (2024)
- Initial AWS deployment with EKS and ECR
- Terraform infrastructure as code
- GitHub Actions CI/CD pipeline
- Istio service mesh integration
- CloudWatch logging and monitoring
