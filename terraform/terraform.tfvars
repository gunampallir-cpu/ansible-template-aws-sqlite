# Azure Configuration
subscription_id     = "6a205d28-34bf-4d6c-931a-dd4709183421"
tenant_id           = "7dfe41e1-4343-4613-8d2a-3624ea7b067e"
resource_group_name = "ansible-template-rg"
location            = "eastus"

# ACR Configuration
acr_name = "ansibletemplateacr001"
acr_sku  = "Standard"

# AKS Configuration
aks_cluster_name            = "ansible-template-aks"
aks_dns_prefix              = "ansibletemplate"
kubernetes_version          = "1.28.3"
default_node_pool_name      = "systempool"
default_node_pool_vm_size   = "Standard_D2s_v3"
default_node_pool_count     = 2
default_node_pool_min_count = 1
default_node_pool_max_count = 3
enable_auto_scaling         = true

# Network Configuration
network_plugin = "azure"
network_policy = "azure"

# Monitoring
log_analytics_workspace_name = "ansible-template-logs"

# Service Mesh
enable_istio = true

# Tags
tags = {
  Environment = "Development"
  Project     = "AnsibleTemplateDownloader"
  ManagedBy   = "Terraform"
  Owner       = "gunampalli"
  CostCenter  = "Engineering"
}
