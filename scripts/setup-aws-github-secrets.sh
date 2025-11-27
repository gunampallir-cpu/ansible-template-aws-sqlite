#!/bin/bash

# GitHub Secrets Setup Script for AWS
# This script automates the creation of GitHub secrets for the Ansible Template AWS deployment

set -e

echo "========================================="
echo "GitHub Secrets Setup for AWS Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI is installed and authenticated${NC}"
echo ""

# Get repository information
echo "Enter your GitHub repository (e.g., gunampallir-cpu/ansible-template-aws-sqlite):"
read -r REPO

if [ -z "$REPO" ]; then
    echo -e "${RED}Error: Repository name cannot be empty${NC}"
    exit 1
fi

echo ""
echo "Setting up secrets for repository: $REPO"
echo ""

# Prompt for AWS credentials
echo "Enter your AWS Access Key ID:"
read -r AWS_ACCESS_KEY_ID

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo -e "${RED}Error: AWS Access Key ID cannot be empty${NC}"
    exit 1
fi

echo ""
echo "Enter your AWS Secret Access Key:"
read -rs AWS_SECRET_ACCESS_KEY

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}Error: AWS Secret Access Key cannot be empty${NC}"
    exit 1
fi

echo ""
echo "Enter your AWS Region (default: us-east-1):"
read -r AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "Enter your AWS Account ID (e.g., 995995866018):"
read -r AWS_ACCOUNT_ID

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: AWS Account ID cannot be empty${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo "Creating GitHub Secrets..."
echo "========================================="
echo ""

# Create secrets
echo "Creating AWS_ACCESS_KEY_ID..."
echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID -R "$REPO"
echo -e "${GREEN}✓ AWS_ACCESS_KEY_ID created${NC}"

echo "Creating AWS_SECRET_ACCESS_KEY..."
echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY -R "$REPO"
echo -e "${GREEN}✓ AWS_SECRET_ACCESS_KEY created${NC}"

echo "Creating AWS_REGION..."
echo "$AWS_REGION" | gh secret set AWS_REGION -R "$REPO"
echo -e "${GREEN}✓ AWS_REGION created${NC}"

echo "Creating AWS_ACCOUNT_ID..."
echo "$AWS_ACCOUNT_ID" | gh secret set AWS_ACCOUNT_ID -R "$REPO"
echo -e "${GREEN}✓ AWS_ACCOUNT_ID created${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}✓ All secrets created successfully!${NC}"
echo "========================================="
echo ""

# Verify secrets
echo "Verifying secrets..."
gh secret list -R "$REPO"

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Push your code to the repository"
echo "2. The GitHub Actions workflow will automatically run"
echo "3. Monitor the workflow in the Actions tab"
echo ""
echo "To manually trigger the workflow:"
echo "  gh workflow run aws-ci-cd.yml -R $REPO"
echo ""
