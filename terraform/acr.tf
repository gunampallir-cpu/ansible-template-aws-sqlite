resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = false

  identity {
    type = "SystemAssigned"
  }

  public_network_access_enabled = true
  
  network_rule_bypass_option = "AzureServices"

  retention_policy {
    days    = 7
    enabled = true
  }

  trust_policy {
    enabled = false
  }

  tags = var.tags
}

# Role assignment for AKS to pull images from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}
