# GitHub Repository Setup Guide

## ⚠️ Important: GitHub Secrets Configuration Required

The CI/CD pipeline is currently failing because **AWS credentials have not been configured** in the GitHub repository secrets.

## Quick Fix

### Step 1: Get AWS Credentials

You need AWS access credentials with the following permissions:
- Amazon ECR (Elastic Container Registry) access
- Amazon EKS (Elastic Kubernetes Service) access
- Terraform state management (S3, DynamoDB)

**Option A: Use Existing AWS User**
```bash
aws configure list
# This will show your current AWS credentials
```

**Option B: Create New IAM User for GitHub Actions**
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

# Create access key
aws iam create-access-key --user-name github-actions-ansible-template
```

Save the `AccessKeyId` and `SecretAccessKey` from the output.

### Step 2: Add Secrets to GitHub Repository

#### Method 1: Using GitHub Web UI (Recommended)

1. Go to: https://github.com/gunampallir-cpu/ansible-template-aws-sqlite
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add the following secrets one by one:

| Secret Name | Value | Required |
|-------------|-------|----------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key ID (e.g., `AKIAIOSFODNN7EXAMPLE`) | ✅ Yes |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key | ✅ Yes |

**Optional but recommended:**
| Secret Name | Value | Required |
|-------------|-------|----------|
| `AWS_REGION` | `us-east-1` | ⚪ Optional (already in env) |
| `AWS_ACCOUNT_ID` | `995995866018` | ⚪ Optional |

#### Method 2: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# Set secrets
gh secret set AWS_ACCESS_KEY_ID -b "YOUR_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY -b "YOUR_SECRET_ACCESS_KEY"
gh secret set AWS_REGION -b "us-east-1"
gh secret set AWS_ACCOUNT_ID -b "995995866018"
```

#### Method 3: Using the Automated Script

```bash
# Make the script executable
chmod +x scripts/setup-aws-github-secrets.sh

# Run the script
./scripts/setup-aws-github-secrets.sh
```

The script will prompt for:
- GitHub personal access token (create at: https://github.com/settings/tokens)
- AWS access key ID
- AWS secret access key

### Step 3: Verify Secrets Are Set

1. Go to: https://github.com/gunampallir-cpu/ansible-template-aws-sqlite/settings/secrets/actions
2. You should see:
   - ✅ AWS_ACCESS_KEY_ID
   - ✅ AWS_SECRET_ACCESS_KEY

### Step 4: Trigger Workflow

After adding secrets, the workflow will automatically run on the next push or you can manually trigger it:

1. Go to: https://github.com/gunampallir-cpu/ansible-template-aws-sqlite/actions
2. Click on "AWS CI/CD Pipeline"
3. Click "Run workflow"
4. Select "deploy" action
5. Click "Run workflow"

## Current Workflow Status

The workflow is currently failing at the "Configure AWS credentials" step with:

```
Error: Credentials could not be loaded, please check your action inputs: 
Could not load credentials from any providers
```

This is because `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets are not configured in the repository.

## Security Best Practices

### ✅ DO:
- Use a dedicated IAM user for GitHub Actions
- Apply the principle of least privilege
- Rotate access keys regularly (every 90 days)
- Enable MFA for your AWS account
- Monitor AWS CloudTrail for unexpected activity

### ❌ DON'T:
- Never commit AWS credentials to the repository
- Never share AWS credentials in public channels
- Never use root AWS account credentials
- Never store credentials in code or configuration files

## Additional Resources

- **Full AWS Deployment Guide**: See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for complete deployment instructions
- **GitHub Secrets Documentation**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **AWS IAM Best Practices**: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- **Setup Script**: [scripts/setup-aws-github-secrets.sh](./scripts/setup-aws-github-secrets.sh)

## Troubleshooting

### Error: "Credentials could not be loaded"
**Solution**: Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to GitHub repository secrets (see Step 2 above)

### Error: "Access Denied" or "UnauthorizedOperation"
**Solution**: Ensure the IAM user has the required policies attached:
- `AmazonEC2ContainerRegistryPowerUser`
- `AmazonEKSClusterPolicy`

### Error: "Repository not found" when using gh CLI
**Solution**: Authenticate with GitHub CLI:
```bash
gh auth login
```

### Secret not visible after adding
**Solution**: Refresh the page. Secrets are encrypted and only show their names, not values.

## Need Help?

If you're still having issues:
1. Check the [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed setup instructions
2. Review the workflow file: [.github/workflows/aws-ci-cd.yml](.github/workflows/aws-ci-cd.yml)
3. Check GitHub Actions logs for detailed error messages
4. Verify IAM user permissions in AWS Console

---

**Next Steps**: After configuring secrets, see [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for the complete deployment process.
