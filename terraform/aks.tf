resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_cluster_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.aks_dns_prefix
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = var.default_node_pool_name
    node_count          = var.default_node_pool_count
    vm_size             = var.default_node_pool_vm_size
    vnet_subnet_id      = azurerm_subnet.aks_subnet.id
    enable_auto_scaling = var.enable_auto_scaling
    min_count           = var.enable_auto_scaling ? var.default_node_pool_min_count : null
    max_count           = var.enable_auto_scaling ? var.default_node_pool_max_count : null
    os_disk_size_gb     = 30
    os_disk_type        = "Managed"
    type                = "VirtualMachineScaleSets"
    zones               = ["1", "2"]

    upgrade_settings {
      max_surge = "10%"
    }

    tags = var.tags
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = var.network_plugin
    network_policy     = var.network_policy
    dns_service_ip     = "10.2.0.10"
    service_cidr       = "10.2.0.0/16"
    load_balancer_sku  = "standard"
    outbound_type      = "loadBalancer"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = var.admin_group_object_ids
  }

  service_mesh_profile {
    mode                             = var.enable_istio ? "Istio" : "Disabled"
    internal_ingress_gateway_enabled = var.enable_istio ? true : false
    external_ingress_gateway_enabled = var.enable_istio ? true : false
  }

  workload_identity_enabled = true
  oidc_issuer_enabled       = true

  http_application_routing_enabled = false

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count
    ]
  }
}

# Application node pool for workloads
resource "azurerm_kubernetes_cluster_node_pool" "app_pool" {
  name                  = "apppool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks.id
  vm_size               = "Standard_D2s_v3"
  node_count            = 2
  enable_auto_scaling   = true
  min_count             = 1
  max_count             = 5
  vnet_subnet_id        = azurerm_subnet.aks_subnet.id
  os_disk_size_gb       = 30
  os_type               = "Linux"
  zones                 = ["1", "2"]
  mode                  = "User"

  node_labels = {
    "workload" = "application"
  }

  upgrade_settings {
    max_surge = "10%"
  }

  tags = var.tags
}
