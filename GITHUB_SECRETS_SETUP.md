# GitHub Secrets Setup Guide

The CI/CD pipeline requires Azure credentials to be configured as GitHub secrets. Follow these steps:

## Required Secrets

You need to configure these secrets in your GitHub repository:

1. **AZURE_CREDENTIALS** - Service principal credentials for Azure login
2. **AZURE_SUBSCRIPTION_ID** - Your Azure subscription ID
3. **AZURE_TENANT_ID** - Your Azure tenant ID
4. **ARM_CLIENT_ID** - Service principal client ID
5. **ARM_CLIENT_SECRET** - Service principal client secret
6. **SONAR_TOKEN** - (Optional) SonarCloud token for code analysis

## Quick Setup (Automated)

Run the PowerShell script we created:

```powershell
.\scripts\setup-github-secrets.ps1
```

This script will:
- Authenticate with Azure
- Create a service principal
- Display all the secrets you need to add to GitHub
- Save the secrets to a file (delete after use!)

## Manual Setup

### Step 1: Login to Azure

```powershell
az login
az account set --subscription "6a205d28-34bf-4d6c-931a-dd4709183421"
```

### Step 2: Create Service Principal

```powershell
$sp = az ad sp create-for-rbac --name "github-actions-ansible-template" `
  --role contributor `
  --scopes /subscriptions/6a205d28-34bf-4d6c-931a-dd4709183421 `
  --sdk-auth | ConvertFrom-Json
```

### Step 3: Get the Values

The service principal creation will output JSON. Extract these values:

- **clientId** → ARM_CLIENT_ID
- **clientSecret** → ARM_CLIENT_SECRET
- **subscriptionId** → AZURE_SUBSCRIPTION_ID
- **tenantId** → AZURE_TENANT_ID
- **Entire JSON** → AZURE_CREDENTIALS

### Step 4: Add Secrets to GitHub

1. Go to: https://github.com/gunampallir-cpu/ansible-template-sqlite/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:

#### AZURE_CREDENTIALS
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "6a205d28-34bf-4d6c-931a-dd4709183421",
  "tenantId": "7dfe41e1-4343-4613-8d2a-3624ea7b067e"
}
```

#### AZURE_SUBSCRIPTION_ID
```
6a205d28-34bf-4d6c-931a-dd4709183421
```

#### AZURE_TENANT_ID
```
7dfe41e1-4343-4613-8d2a-3624ea7b067e
```

#### ARM_CLIENT_ID
```
(client ID from service principal)
```

#### ARM_CLIENT_SECRET
```
(client secret from service principal)
```

#### SONAR_TOKEN (Optional)
Get this from: https://sonarcloud.io/account/security/

## Verify Setup

After adding all secrets:

1. Go to: https://github.com/gunampallir-cpu/ansible-template-sqlite/actions
2. Trigger the workflow manually or push a new commit
3. The pipeline should now run successfully!

## Troubleshooting

### "Resource not accessible by integration"
- Ensure the workflow has `security-events: write` permission (already added)
- The secrets might not be set correctly

### "Login failed with Error"
- Double-check all secrets are added correctly
- Verify the service principal has Contributor role on the subscription
- Make sure clientId and tenantId are correct

### "terraform init failed"
- Ensure ARM_CLIENT_ID and ARM_CLIENT_SECRET are set
- Verify the service principal has permissions to create storage accounts

## Security Notes

⚠️ **Important:**
- Never commit secrets to Git
- Rotate service principal credentials regularly
- Use least-privilege access (Contributor role only for necessary resources)
- Delete the github-secrets.txt file after copying secrets to GitHub

## Next Steps

Once secrets are configured:

1. Push changes to trigger the pipeline
2. Monitor the workflow in GitHub Actions
3. The pipeline will:
   - Run code quality checks ✅
   - Run security scans ✅
   - Build Docker images ✅
   - Provision Azure infrastructure ✅
   - Deploy to Kubernetes ✅

## Resources

- [Azure Service Principal Docs](https://learn.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Azure Login Action](https://github.com/Azure/login)
