# Terraform Configuration for Azure Infrastructure

This directory contains Terraform configuration files for provisioning Azure infrastructure for the Ansible Template Downloader application.

## Files

- `main.tf` - Provider configuration and backend settings
- `variables.tf` - Input variable definitions
- `terraform.tfvars` - Variable values (customize as needed)
- `resource-group.tf` - Azure Resource Group
- `acr.tf` - Azure Container Registry
- `aks.tf` - Azure Kubernetes Service cluster
- `network.tf` - Virtual Network and security groups
- `log-analytics.tf` - Log Analytics workspace
- `outputs.tf` - Output values after deployment

## Prerequisites

1. **Terraform**: Install from https://www.terraform.io/downloads
2. **Azure CLI**: Install from https://docs.microsoft.com/cli/azure/install-azure-cli
3. **Azure Subscription**: Active subscription with appropriate permissions

## Quick Start

### 1. Login to Azure
```bash
az login
az account set --subscription 6a205d28-34bf-4d6c-931a-dd4709183421
```

### 2. Initialize Terraform
```bash
terraform init
```

### 3. Review Configuration
Edit `terraform.tfvars` to customize values:
- Resource names
- Location
- Node sizes
- Tags

### 4. Plan Deployment
```bash
terraform plan -out=tfplan
```

### 5. Apply Configuration
```bash
terraform apply tfplan
```

## Infrastructure Components

### Azure Container Registry (ACR)
- **Name**: ansibletemplateacr001
- **SKU**: Standard
- **Features**:
  - Admin access disabled (uses managed identity)
  - Image retention policy (7 days)
  - Public network access enabled
  - System-assigned managed identity

### Azure Kubernetes Service (AKS)
- **Name**: ansible-template-aks
- **Kubernetes Version**: 1.28.3
- **Node Pools**:
  - **System Pool**: 2 nodes (Standard_D2s_v3)
  - **Application Pool**: 2-5 nodes with autoscaling
- **Features**:
  - Istio service mesh enabled
  - Azure CNI networking
  - Azure AD RBAC integration
  - Log Analytics integration
  - Workload identity enabled
  - Key Vault secrets provider

### Networking
- **VNet**: 10.0.0.0/16
- **Subnet**: 10.0.1.0/24
- **Network Security Group**: Allows HTTP/HTTPS traffic
- **Load Balancer**: Standard SKU

### Monitoring
- **Log Analytics Workspace**: 30-day retention
- **Container Insights**: Enabled
- **Metrics**: Collected automatically

## Configuration Variables

### Required Variables
- `subscription_id`: Azure subscription ID
- `tenant_id`: Azure AD tenant ID
- `resource_group_name`: Name for resource group
- `location`: Azure region

### Optional Variables
- `acr_sku`: ACR tier (Basic/Standard/Premium)
- `kubernetes_version`: K8s version
- `default_node_pool_vm_size`: VM size for nodes
- `enable_auto_scaling`: Enable/disable autoscaling
- `enable_istio`: Enable/disable Istio

## Outputs

After successful deployment, Terraform provides:
- ACR login server URL
- AKS cluster name and ID
- Kubeconfig (sensitive)
- Log Analytics workspace ID
- Resource group details

## Backend Configuration

State is stored in Azure Storage:
- **Resource Group**: terraform-state-rg
- **Storage Account**: tfstateansible001
- **Container**: tfstate
- **Key**: ansible-template.terraform.tfstate

## Commands Reference

### Initialize
```bash
terraform init
```

### Format Code
```bash
terraform fmt -recursive
```

### Validate Configuration
```bash
terraform validate
```

### Plan Changes
```bash
terraform plan
```

### Apply Changes
```bash
terraform apply -auto-approve
```

### Show Current State
```bash
terraform show
```

### List Resources
```bash
terraform state list
```

### Get Output Values
```bash
terraform output
terraform output -json
```

### Destroy Infrastructure
```bash
terraform destroy -auto-approve
```

## Security Best Practices

1. **Service Principal**: Use dedicated SP for Terraform
2. **State Security**: Backend storage has encryption enabled
3. **Secrets**: Never commit sensitive values
4. **RBAC**: Enable Azure AD integration
5. **Network Policies**: Configured in AKS
6. **Private Endpoints**: Consider for production

## Troubleshooting

### Issue: Terraform Init Fails
**Solution**: Ensure backend storage account exists
```bash
az storage account show --name tfstateansible001 --resource-group terraform-state-rg
```

### Issue: Authentication Errors
**Solution**: Check Azure CLI login and permissions
```bash
az account show
az account list-locations -o table
```

### Issue: Resource Already Exists
**Solution**: Import existing resource or change names
```bash
terraform import azurerm_resource_group.main /subscriptions/{id}/resourceGroups/{name}
```

### Issue: Provider Version Conflicts
**Solution**: Update provider versions
```bash
terraform init -upgrade
```

## Cost Estimation

Estimated monthly costs (EastUS region):
- AKS (2 D2s_v3 nodes): ~$150
- ACR Standard: ~$5
- Log Analytics: ~$10-20
- VNet/NSG: ~$5
- **Total**: ~$170-180/month

Use Azure Pricing Calculator for accurate estimates:
https://azure.microsoft.com/pricing/calculator/

## Cleanup

### Delete All Resources
```bash
terraform destroy
```

### Delete Specific Resource
```bash
terraform destroy -target=azurerm_kubernetes_cluster.aks
```

### Remove State Lock
```bash
terraform force-unlock <LOCK_ID>
```

## Additional Resources

- [Terraform AzureRM Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/)

## Support

For issues with:
- **Terraform**: Check logs in `.terraform/` directory
- **Azure Resources**: Use Azure Portal or `az` CLI
- **GitHub Actions**: Review workflow logs

---

**Last Updated**: November 25, 2025
