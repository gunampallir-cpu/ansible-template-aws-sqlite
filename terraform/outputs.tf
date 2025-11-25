output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "acr_name" {
  description = "Name of the Azure Container Registry"
  value       = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "Login server for ACR"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_id" {
  description = "ID of the ACR"
  value       = azurerm_container_registry.acr.id
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.name
}

output "aks_cluster_id" {
  description = "ID of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.id
}

output "aks_kubeconfig" {
  description = "Kubeconfig for AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}

output "aks_fqdn" {
  description = "FQDN of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.fqdn
}

output "aks_node_resource_group" {
  description = "Resource group containing AKS nodes"
  value       = azurerm_kubernetes_cluster.aks.node_resource_group
}

output "log_analytics_workspace_id" {
  description = "ID of Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "istio_enabled" {
  description = "Whether Istio is enabled"
  value       = var.enable_istio
}

output "kubelet_identity_object_id" {
  description = "Object ID of kubelet managed identity"
  value       = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
}
