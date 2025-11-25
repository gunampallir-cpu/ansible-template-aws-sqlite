# Azure Deployment Guide - Ansible Template Downloader

## Overview
This guide provides step-by-step instructions for deploying the Ansible Template Downloader application to Azure Kubernetes Service (AKS) using Terraform, Docker, and Helm with Istio service mesh.

## Prerequisites

### Required Tools
- **Azure CLI** (`az`) version 2.50.0 or later
- **Terraform** version 1.6.0 or later
- **kubectl** version 1.28.0 or later
- **Helm** version 3.13.0 or later
- **Docker** version 24.0.0 or later
- **Git** version 2.40.0 or later

### Azure Subscription
- Subscription ID: `6a205d28-34bf-4d6c-931a-dd4709183421`
- Tenant ID: `7dfe41e1-4343-4613-8d2a-3624ea7b067e`
- Appropriate permissions to create resources

## Architecture

### Infrastructure Components
1. **Azure Container Registry (ACR)**: `ansibletemplateacr001`
   - Stores Docker images for frontend and backend
   - SKU: Standard
   - Admin access: Disabled (uses managed identity)

2. **Azure Kubernetes Service (AKS)**: `ansible-template-aks`
   - Kubernetes version: 1.28.3
   - Node pools:
     - System pool: 2 nodes (Standard_D2s_v3)
     - Application pool: 2-5 nodes (autoscaling)
   - Networking: Azure CNI
   - Istio service mesh enabled

3. **Azure Virtual Network**
   - Address space: 10.0.0.0/16
   - AKS subnet: 10.0.1.0/24

4. **Log Analytics Workspace**
   - Container insights enabled
   - 30-day retention

### Application Components
- **Frontend**: React application (nginx-served)
- **Backend**: Node.js Express API
- **Database**: SQLite (persistent volume)
- **Service Mesh**: Istio for traffic management

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/gunampallir-cpu/ansible-template-sqlite.git
cd ansible-template-sqlite
```

### 2. Azure Authentication

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription 6a205d28-34bf-4d6c-931a-dd4709183421

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-ansible-template" \
  --role contributor \
  --scopes /subscriptions/6a205d28-34bf-4d6c-931a-dd4709183421 \
  --sdk-auth

# Save the output JSON - you'll need it for GitHub secrets
```

### 3. Configure GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Value |
|------------|-------------|-------|
| `AZURE_CREDENTIALS` | Service principal JSON | Output from `az ad sp create-for-rbac` |
| `ARM_CLIENT_ID` | Service principal client ID | From JSON output |
| `ARM_CLIENT_SECRET` | Service principal secret | From JSON output |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `6a205d28-34bf-4d6c-931a-dd4709183421` |
| `AZURE_TENANT_ID` | Azure tenant ID | `7dfe41e1-4343-4613-8d2a-3624ea7b067e` |
| `SONAR_TOKEN` | SonarCloud token (optional) | Get from sonarcloud.io |

### 4. Create Terraform Backend Storage

The Terraform state needs to be stored in Azure Storage:

```bash
# Create resource group for Terraform state
az group create \
  --name terraform-state-rg \
  --location eastus

# Create storage account
az storage account create \
  --name tfstateansible001 \
  --resource-group terraform-state-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name tfstateansible001
```

### 5. Initialize Terraform Locally (Optional)

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply infrastructure (if not using GitHub Actions)
terraform apply -auto-approve
```

### 6. Deploy via GitHub Actions

#### Automatic Deployment
Push to the `main` branch triggers the full CI/CD pipeline:

```bash
git add .
git commit -m "feat: deploy to Azure"
git push origin main
```

#### Manual Deployment
1. Go to GitHub repository → Actions
2. Select "CI/CD Pipeline" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### 7. Monitor Deployment

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group ansible-template-rg \
  --name ansible-template-aks

# Check pods
kubectl get pods -n ansible-template

# Check services
kubectl get svc -n ansible-template

# Check ingress
kubectl get virtualservice -n ansible-template

# View logs
kubectl logs -f deployment/ansible-template-backend -n ansible-template
kubectl logs -f deployment/ansible-template-frontend -n ansible-template
```

## CI/CD Pipeline Stages

### 1. Code Quality & Testing
- **Backend**: ESLint, Jest tests, SonarCloud analysis
- **Frontend**: ESLint, React tests, build verification
- **Security**: Trivy vulnerability scanning

### 2. Docker Image Build
- Multi-stage builds for optimization
- Push to Azure Container Registry
- Image vulnerability scanning with Trivy
- Tag with commit SHA and `latest`

### 3. Infrastructure as Code
- Terraform format check
- Terraform validation
- Terraform plan generation
- Manual approval (production environment)
- Terraform apply
- Resource provisioning

### 4. Kubernetes Deployment
- Helm chart deployment
- Backend deployment with persistent volume
- Frontend deployment
- Istio configuration
- Health checks and rollout verification

### 5. Manual Destroy (Optional)
- Triggered via workflow dispatch
- Input parameter: `destroy_resources: yes`
- Terraform destroy execution
- Complete resource cleanup

## Accessing the Application

### Get External IP

```bash
# For Istio ingress gateway
kubectl get svc istio-ingressgateway \
  -n istio-system \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Access URLs
- **Frontend**: `http://<EXTERNAL-IP>/`
- **Backend API**: `http://<EXTERNAL-IP>/api/health`

### Configure DNS (Optional)
Update your DNS records to point to the external IP:
```
ansible-template.yourdomain.com → <EXTERNAL-IP>
```

## Helm Chart Configuration

### Backend Values
```bash
# Override default values
helm upgrade --install ansible-template-backend ./helm/backend \
  --namespace ansible-template \
  --set image.tag=latest \
  --set replicaCount=3 \
  --set resources.requests.memory=512Mi
```

### Frontend Values
```bash
# Override default values
helm upgrade --install ansible-template-frontend ./helm/frontend \
  --namespace ansible-template \
  --set image.tag=latest \
  --set env[0].value=http://your-backend-url/api
```

## Monitoring and Logging

### View Container Logs
```bash
# Backend logs
kubectl logs -l app.kubernetes.io/name=ansible-template-backend \
  -n ansible-template \
  --tail=100 -f

# Frontend logs
kubectl logs -l app.kubernetes.io/name=ansible-template-frontend \
  -n ansible-template \
  --tail=100 -f
```

### Azure Monitor
1. Navigate to Azure Portal
2. Go to AKS cluster → Monitoring → Insights
3. View:
   - Cluster health
   - Node performance
   - Container metrics
   - Logs via Log Analytics

### Istio Observability
```bash
# Install Kiali dashboard (optional)
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# Port forward
kubectl port-forward svc/kiali -n istio-system 20001:20001

# Access at http://localhost:20001
```

## Scaling

### Manual Scaling
```bash
# Scale backend
kubectl scale deployment ansible-template-backend \
  -n ansible-template \
  --replicas=5

# Scale frontend
kubectl scale deployment ansible-template-frontend \
  -n ansible-template \
  --replicas=3
```

### Auto-scaling
HPA is configured by default:
- Backend: 2-5 replicas (CPU: 70%, Memory: 80%)
- Frontend: 2-5 replicas (CPU: 70%, Memory: 80%)

## Troubleshooting

### Pods Not Starting
```bash
# Describe pod
kubectl describe pod <pod-name> -n ansible-template

# Check events
kubectl get events -n ansible-template --sort-by='.lastTimestamp'

# Check image pull
kubectl get pods -n ansible-template -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].state}{"\n"}{end}'
```

### Database Issues
```bash
# Check PVC
kubectl get pvc -n ansible-template

# Check PV
kubectl get pv

# Access backend pod
kubectl exec -it deployment/ansible-template-backend \
  -n ansible-template \
  -- /bin/sh

# Check database file
ls -la /app/database/
```

### Network Issues
```bash
# Test backend from frontend
kubectl exec -it deployment/ansible-template-frontend \
  -n ansible-template \
  -- curl http://ansible-template-backend:5000/health

# Check Istio configuration
kubectl get virtualservice -n ansible-template
kubectl get destinationrule -n ansible-template
kubectl get gateway -n ansible-template
```

### ACR Authentication Issues
```bash
# Verify ACR access
az acr login --name ansibletemplateacr001

# Check AKS-ACR integration
az aks check-acr \
  --name ansible-template-aks \
  --resource-group ansible-template-rg \
  --acr ansibletemplateacr001.azurecr.io
```

## Destroying Resources

### Via GitHub Actions
1. Go to Actions → CI/CD Pipeline
2. Click "Run workflow"
3. Set `destroy_resources` to `yes`
4. Click "Run workflow"
5. Approve in the "destroy" environment

### Via Terraform CLI
```bash
cd terraform
terraform destroy -auto-approve
```

### Manual Cleanup
```bash
# Delete resource group (removes everything)
az group delete \
  --name ansible-template-rg \
  --yes \
  --no-wait

# Verify deletion
az group list --output table | grep ansible-template
```

## Cost Optimization

### Estimated Monthly Costs
- AKS cluster: ~$150-200
- ACR: ~$5-10
- Log Analytics: ~$10-20
- Virtual Network: ~$5
- **Total**: ~$170-235/month

### Cost Reduction Tips
1. Use **Basic** ACR SKU instead of Standard
2. Reduce node pool to 1 node for dev/test
3. Use **B-series** VMs for lower environments
4. Enable autoscaling to scale down during off-hours
5. Delete resources when not in use

## Security Best Practices

### Implemented
✅ Non-root containers  
✅ Read-only root filesystem (where possible)  
✅ Security contexts with capability dropping  
✅ Network policies  
✅ Pod security contexts  
✅ Image vulnerability scanning  
✅ Secrets management via Azure Key Vault  
✅ RBAC enabled  
✅ Private cluster networking  

### Additional Recommendations
- Enable Azure Policy for AKS
- Configure Azure Firewall
- Implement Azure Private Link
- Enable Azure Defender for Containers
- Regular security patching
- Rotate service principal credentials
- Enable audit logging

## Backup and Disaster Recovery

### Database Backup
```bash
# Create backup job (CronJob example in k8s)
kubectl create -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup
  namespace: ansible-template
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: ansibletemplateacr001.azurecr.io/ansible-template-backend:latest
            command: ["/bin/sh"]
            args:
              - -c
              - "cp /app/database/ansible_download_template.db /backups/db-\$(date +%Y%m%d-%H%M%S).db"
            volumeMounts:
            - name: data
              mountPath: /app/database
            - name: backups
              mountPath: /backups
          restartPolicy: OnFailure
          volumes:
          - name: data
            persistentVolumeClaim:
              claimName: ansible-template-backend-pvc
          - name: backups
            azureFile:
              secretName: azure-file-secret
              shareName: backups
EOF
```

### AKS Cluster Backup
- Use Azure Backup for AKS
- Backup Terraform state regularly
- Document manual configurations

## Support and Maintenance

### Regular Maintenance Tasks
- Weekly: Review logs and metrics
- Monthly: Update dependencies and images
- Quarterly: Kubernetes version upgrade
- Yearly: Review and optimize costs

### Getting Help
- Azure Support: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- AKS Documentation: https://docs.microsoft.com/azure/aks/
- Istio Documentation: https://istio.io/latest/docs/

## Appendix

### Useful Commands
```bash
# Get kubeconfig
az aks get-credentials -g ansible-template-rg -n ansible-template-aks

# List all resources
kubectl get all -n ansible-template

# Get resource usage
kubectl top nodes
kubectl top pods -n ansible-template

# View Helm releases
helm list -n ansible-template

# Restart deployment
kubectl rollout restart deployment/ansible-template-backend -n ansible-template

# View certificate details (if using TLS)
kubectl get certificate -n ansible-template
```

### Azure Portal Links
- **Resource Group**: https://portal.azure.com/#@7dfe41e1-4343-4613-8d2a-3624ea7b067e/resource/subscriptions/6a205d28-34bf-4d6c-931a-dd4709183421/resourceGroups/ansible-template-rg
- **AKS Cluster**: Navigate to Resource Group → ansible-template-aks
- **ACR**: Navigate to Resource Group → ansibletemplateacr001
- **Cost Analysis**: Resource Group → Cost Management → Cost analysis

---

**Document Version**: 1.0.0  
**Last Updated**: November 25, 2025  
**Maintained By**: gunampalli
