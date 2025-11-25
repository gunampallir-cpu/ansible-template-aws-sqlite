variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  default     = "6a205d28-34bf-4d6c-931a-dd4709183421"
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  default     = "7dfe41e1-4343-4613-8d2a-3624ea7b067e"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "ansible-template-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "ansibletemplateacr001"
}

variable "acr_sku" {
  description = "SKU tier for ACR"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

variable "aks_cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "ansible-template-aks"
}

variable "aks_dns_prefix" {
  description = "DNS prefix for AKS cluster"
  type        = string
  default     = "ansibletemplate"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28.3"
}

variable "default_node_pool_name" {
  description = "Name of the default node pool"
  type        = string
  default     = "systempool"
}

variable "default_node_pool_vm_size" {
  description = "VM size for default node pool"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "default_node_pool_count" {
  description = "Number of nodes in default pool"
  type        = number
  default     = 2
}

variable "default_node_pool_min_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 1
}

variable "default_node_pool_max_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 3
}

variable "enable_auto_scaling" {
  description = "Enable autoscaling for node pool"
  type        = bool
  default     = true
}

variable "network_plugin" {
  description = "Network plugin for AKS"
  type        = string
  default     = "azure"
}

variable "network_policy" {
  description = "Network policy for AKS"
  type        = string
  default     = "azure"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "Development"
    Project     = "AnsibleTemplateDownloader"
    ManagedBy   = "Terraform"
    Owner       = "gunampalli"
  }
}

variable "enable_istio" {
  description = "Enable Istio service mesh"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_name" {
  description = "Name of Log Analytics Workspace"
  type        = string
  default     = "ansible-template-logs"
}

variable "admin_group_object_ids" {
  description = "Azure AD group object IDs for AKS admins"
  type        = list(string)
  default     = []
}
