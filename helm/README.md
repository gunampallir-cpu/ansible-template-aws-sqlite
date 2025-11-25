# Helm Charts - Ansible Template Downloader

This directory contains Helm charts for deploying the Ansible Template Downloader application to Kubernetes with Istio service mesh integration.

## Structure

```
helm/
├── backend/          # Backend API Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
└── frontend/         # Frontend React app Helm chart
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
```

## Prerequisites

- Kubernetes cluster (v1.28+)
- Helm 3.13+
- Istio installed on cluster (if using service mesh features)
- kubectl configured

## Quick Start

### Install Backend
```bash
helm install ansible-template-backend ./backend \
  --namespace ansible-template \
  --create-namespace
```

### Install Frontend
```bash
helm install ansible-template-frontend ./frontend \
  --namespace ansible-template
```

## Configuration

### Backend Values

Key configuration options in `backend/values.yaml`:

```yaml
# Image configuration
image:
  repository: ansibletemplateacr001.azurecr.io/ansible-template-backend
  tag: latest

# Scaling
replicaCount: 2
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5

# Resources
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

# Persistence
persistence:
  enabled: true
  size: 1Gi
  storageClassName: managed-premium

# Istio
istio:
  enabled: true
```

### Frontend Values

Key configuration options in `frontend/values.yaml`:

```yaml
# Image configuration
image:
  repository: ansibletemplateacr001.azurecr.io/ansible-template-frontend
  tag: latest

# Environment
env:
  - name: REACT_APP_API_URL
    value: "http://ansible-template-backend:5000/api"

# Resources
resources:
  limits:
    cpu: 200m
    memory: 256Mi
```

## Installation Examples

### Development Environment
```bash
# Backend with minimal resources
helm install backend ./backend \
  --set replicaCount=1 \
  --set autoscaling.enabled=false \
  --set resources.limits.memory=256Mi

# Frontend with dev settings
helm install frontend ./frontend \
  --set replicaCount=1 \
  --set env[0].value=http://localhost:5000/api
```

### Production Environment
```bash
# Backend with high availability
helm install backend ./backend \
  --set replicaCount=3 \
  --set autoscaling.maxReplicas=10 \
  --set persistence.size=5Gi \
  --set resources.limits.memory=1Gi

# Frontend with production image
helm install frontend ./frontend \
  --set image.tag=v1.0.0 \
  --set replicaCount=3
```

### With Custom Values File
```bash
# Create custom values
cat > custom-values.yaml <<EOF
image:
  tag: v2.0.0
replicaCount: 5
resources:
  limits:
    memory: 1Gi
EOF

# Install with custom values
helm install backend ./backend -f custom-values.yaml
```

## Upgrading

### Upgrade to New Version
```bash
# Backend
helm upgrade ansible-template-backend ./backend \
  --set image.tag=v1.1.0

# Frontend
helm upgrade ansible-template-frontend ./frontend \
  --set image.tag=v1.1.0
```

### Upgrade with Rollback on Failure
```bash
helm upgrade ansible-template-backend ./backend \
  --atomic \
  --timeout 10m
```

## Uninstallation

```bash
# Uninstall backend
helm uninstall ansible-template-backend -n ansible-template

# Uninstall frontend
helm uninstall ansible-template-frontend -n ansible-template

# Delete namespace
kubectl delete namespace ansible-template
```

## Features

### Security
- ✅ Non-root containers
- ✅ Security contexts configured
- ✅ Network policies
- ✅ Pod security contexts
- ✅ Service accounts with RBAC

### High Availability
- ✅ Multiple replicas
- ✅ Pod anti-affinity rules
- ✅ Pod disruption budgets
- ✅ Health checks (liveness & readiness)
- ✅ Horizontal Pod Autoscaling

### Observability
- ✅ Prometheus annotations
- ✅ Istio sidecar injection
- ✅ Resource limits set
- ✅ Health endpoints configured

### Istio Integration
- ✅ Gateway configuration
- ✅ VirtualService for routing
- ✅ DestinationRule for traffic policies
- ✅ mTLS support
- ✅ Circuit breakers
- ✅ Retry policies

## Troubleshooting

### Check Helm Release Status
```bash
helm list -n ansible-template
helm status ansible-template-backend -n ansible-template
```

### View Generated Manifests
```bash
helm template ansible-template-backend ./backend
```

### Debug Installation
```bash
helm install backend ./backend --dry-run --debug
```

### Get Values from Deployed Release
```bash
helm get values ansible-template-backend -n ansible-template
```

### Rollback to Previous Version
```bash
# List revisions
helm history ansible-template-backend -n ansible-template

# Rollback
helm rollback ansible-template-backend 1 -n ansible-template
```

## Customization

### Override Values via Command Line
```bash
helm install backend ./backend \
  --set image.tag=v1.2.0 \
  --set replicaCount=5 \
  --set env[0].name=CUSTOM_VAR \
  --set env[0].value=custom-value
```

### Override Values via File
```bash
helm install backend ./backend -f my-values.yaml
```

### Use Multiple Value Files
```bash
helm install backend ./backend \
  -f values-base.yaml \
  -f values-prod.yaml
```

## Testing

### Lint Charts
```bash
helm lint ./backend
helm lint ./frontend
```

### Template Validation
```bash
helm template backend ./backend | kubectl apply --dry-run=client -f -
```

### Test Release
```bash
helm test ansible-template-backend -n ansible-template
```

## Best Practices

1. **Version Pinning**: Always specify image tags
2. **Resource Limits**: Set appropriate CPU/memory limits
3. **Health Checks**: Configure liveness and readiness probes
4. **Secrets**: Use Kubernetes secrets or Azure Key Vault
5. **Namespaces**: Deploy to dedicated namespaces
6. **Values Files**: Use separate files for different environments
7. **Documentation**: Document custom values in comments

## Chart Development

### Update Dependencies
```bash
helm dependency update ./backend
```

### Package Chart
```bash
helm package ./backend
```

### Create Chart Archive
```bash
tar -czf backend-1.0.0.tgz backend/
```

## Monitoring

### View Pod Status
```bash
kubectl get pods -n ansible-template -l app.kubernetes.io/name=ansible-template-backend
```

### Check HPA Status
```bash
kubectl get hpa -n ansible-template
```

### View Events
```bash
kubectl get events -n ansible-template --sort-by='.lastTimestamp'
```

### Check Istio Configuration
```bash
kubectl get gateway -n ansible-template
kubectl get virtualservice -n ansible-template
kubectl get destinationrule -n ansible-template
```

## Common Issues

### Issue: ImagePullBackOff
**Solution**: Check ACR credentials and image path
```bash
kubectl describe pod <pod-name> -n ansible-template
```

### Issue: CrashLoopBackOff
**Solution**: Check application logs
```bash
kubectl logs <pod-name> -n ansible-template
```

### Issue: Service Not Accessible
**Solution**: Check service and endpoints
```bash
kubectl get svc -n ansible-template
kubectl get endpoints -n ansible-template
```

### Issue: Persistent Volume Issues
**Solution**: Check PVC status
```bash
kubectl get pvc -n ansible-template
kubectl describe pvc <pvc-name> -n ansible-template
```

## Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Istio Documentation](https://istio.io/latest/docs/)

---

**Chart Version**: 1.0.0  
**App Version**: 1.0.0  
**Last Updated**: November 25, 2025
