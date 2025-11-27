# Ansible Template Downloader

A comprehensive full-stack web application for generating and downloading Ansible templates with automated directory structure, playbooks, and GitLab CI configuration. Includes production-ready AWS deployment with Kubernetes, Docker, Terraform, and CI/CD pipelines.

## ⚠️ IMPORTANT: First-Time Setup

**If you're setting up this repository for the first time**, you need to configure AWS credentials in GitHub Secrets:

📖 **[→ Follow the GitHub Setup Guide](./GITHUB_SETUP.md)** to configure AWS credentials and enable the CI/CD pipeline.

**Current Status**: The GitHub Actions workflow is failing because AWS credentials are not configured. This is expected for a new repository clone.

---

## 🚀 Features

### Core Application

- **Template Generator**: Generate Ansible templates by selecting environment, OS platform, hostnames, and ansible roles
- **Admin Panel**: Manage OS configurations, ansible roles, role variables, TMPL files, and GitLab CI YAML
- **Multi-Region Support**: UAT and Production environments support Central and East regions
- **Dynamic VM Groups**: Add multiple VM groups with different ansible roles
- **LDAP Integration**: Automatic LDAP replication jobs for roles that require it
- **Role-Based Access**: Admin authentication with change password functionality
- **Search Functionality**: Search ansible roles for easy selection
- **Secure**: JWT authentication, password hashing, input validation, SQL injection prevention
- **Testing**: Comprehensive test coverage for backend and frontend

### Azure Cloud Deployment
- **Infrastructure as Code**: Terraform for ACR and AKS provisioning
- **Containerization**: Multi-stage Docker builds for optimized images
- **Orchestration**: Kubernetes (AKS) with Helm charts
- **Service Mesh**: Istio for traffic management and observability
- **CI/CD**: GitHub Actions with automated testing, scanning, and deployment
- **Security**: Image scanning, code analysis, vulnerability detection
- **Monitoring**: Azure Monitor and Log Analytics integration

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js**
- **SQLite** database (ansible_download_template.db)
- **JWT** for authentication
- **bcrypt** for password hashing
- **express-validator** for input validation
- **helmet** for security headers
- **rate-limiting** for API protection

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Axios** for API communication
- **Context API** for state management
- **CSS3** with responsive design

### Testing
- **Jest** and **Supertest** for backend testing
- **React Testing Library** for frontend testing

### DevOps & Cloud
- **Azure Container Registry (ACR)** for Docker images
- **Azure Kubernetes Service (AKS)** for container orchestration
- **Terraform** for infrastructure automation
- **Helm** for Kubernetes package management
- **Istio** for service mesh capabilities
- **GitHub Actions** for CI/CD pipelines

## 📋 Prerequisites

### Local Development

- Node.js (v14 or higher)
- npm or yarn
- Git (optional)

## 🔧 Installation

### 1. Clone or Extract the Project

```powershell
cd c:\Users\Sunayana\Desktop\PromptClaudeReactJSNodeJSSqlite
```

### 2. Install Dependencies

```powershell
# Install root dependencies (optional, for running both)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install

cd ..
```

### 3. Configure Backend Environment

```powershell
# Copy environment example file
Copy-Item backend\.env.example backend\.env

# Edit backend\.env and update the JWT_SECRET
# Use a strong secret key (minimum 32 characters)
```

Example `.env` file:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-very-secure-secret-key-min-32-chars-change-in-production
JWT_EXPIRE=24h
DB_PATH=./database/ansible_download_template.db
ADMIN_USERS=gunampalli,rajasekhar,Reddy
```

## 🚀 Running the Application

### Local Development

#### Option 1: Run Everything Together (Recommended)

```powershell
# From root directory
npm run install-all
npm run dev
```

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Default Admin Users

| Username     | Password     | Access Level |
|--------------|--------------|--------------|
| gunampalli   | Raja@1358    | Admin        |
| rajasekhar   | Sunnu@1358   | Admin        |
| Reddy        | Sai@1358     | Admin        |

⚠️ **Important**: Change these passwords immediately after first login!

## 📚 Application Usage

### For All Users (Template Generator)

1. **Access Template Generator**
   - Open http://localhost:3000
   - Click "Continue as Guest" or login as admin

2. **Select Environment & OS**
   - Choose environment: dev, it, uat, or prod
   - Choose OS platform: Linux or Windows

3. **Configure VM Groups**
   - **dev/it**: Single region, add VM groups as needed
   - **uat/prod**: Two regions (Central and East), add paired VM groups

4. **Add Hostnames**
   - Enter server hostnames (e.g., server1.example.com)
   - Add multiple hostnames per VM group

5. **Select Ansible Roles**
   - Search and select required ansible roles
   - Roles marked with "LDAP" badge require additional configuration

6. **Fill Application Details**
   - METTA_APPLICATION
   - METTA_COMPONENT
   - SHIELD_TEAM
   - APP_CONTEXT_SUBSCRIPTION_NAME
   - APP_CONTEXT_NAME
   - ARM_SUBSCRIPTION_ID

7. **LDAP Configuration (if required)**
   - SOURCE_PATH
   - TARGET_IDENTIFIER
   - ASSIGNMENT_GROUP (for uat/prod only)

8. **Generate Template**
   - Click "Generate and Download Template"
   - A ZIP file will be downloaded with complete directory structure

### For Admin Users Only

1. **Login**
   - Go to http://localhost:3000/login
   - Enter admin credentials

2. **OS Configuration**
   - Select OS platform (Linux/Windows)
   - Edit all.yml configuration
   - Save changes

3. **Ansible Role Names**
   - Add new ansible roles
   - Specify OS platform
   - Mark if role requires LDAP
   - Edit or delete existing roles

4. **Ansible Role Variables**
   - Select OS platform and ansible role
   - Add/edit role-specific variables
   - Variables are added to environment_groupX.yml files

5. **TMPL File**
   - Select environment
   - Edit requirements.tmpl content
   - Save changes

6. **GitLab CI YAML**
   - **Common Config**: Base configuration for all templates
   - **Environment Config**: Per-environment and OS-specific jobs
   - **Role Config**: Role-specific LDAP replication jobs

7. **Change Password**
   - Enter current password
   - Enter new password (must meet complexity requirements)
   - Confirm new password

## 📁 Generated Template Structure

```
Ansible-Template/
├── .gitlab-ci.yml
└── ansible/
    ├── group_vars/
    │   └── all.yml
    ├── inventories/
    │   └── {environment}/
    │       ├── group_vars/
    │       │   ├── {env}_group1.yml
    │       │   ├── {env}_group2.yml
    │       │   └── ...
    │       └── hosts
    ├── roles/
    │   └── requirements.tmpl
    ├── {env}_group1_ansible_playbook.yml
    ├── {env}_group2_ansible_playbook.yml
    ├── ...
    └── {env}_all_ansible_playbook.yml
```

## 🧪 Running Tests

### Backend Tests

```powershell
cd backend
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Frontend Tests

```powershell
cd frontend
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage --watchAll=false
```

### Run All Tests

```powershell
# From root directory
npm test
```

## 🔒 Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Admin-only routes protection
   - Token expiration (24 hours default)

2. **Password Security**
   - bcrypt hashing (10 rounds)
   - Password complexity requirements
   - Secure password change functionality

3. **Input Validation**
   - express-validator for all inputs
   - SQL injection prevention
   - XSS protection via sanitization

4. **HTTP Security**
   - Helmet.js security headers
   - CORS configuration
   - Rate limiting (100 requests per 15 minutes)

5. **Database Security**
   - Parameterized queries
   - Foreign key constraints
   - Data type validation

## 🗃️ Database Schema

### Tables

1. **users**
   - id, username, password, is_admin, created_at, updated_at

2. **os_configurations**
   - id, os_platform, config_content, created_at, updated_at

3. **ansible_roles**
   - id, role_name, os_platform, requires_ldap, created_at, updated_at

4. **ansible_role_variables**
   - id, role_id, os_platform, variable_content, created_at, updated_at

5. **tmpl_files**
   - id, environment, file_content, created_at, updated_at

6. **gitlab_ci_configs**
   - id, config_type, environment, os_platform, role_id, config_content, created_at, updated_at

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify token

### OS Configuration
- `GET /api/os-config` - Get all configurations
- `GET /api/os-config/:platform` - Get by platform
- `PUT /api/os-config/:platform` - Update configuration

### Ansible Roles
- `GET /api/ansible-roles` - Get all roles (with search)
- `GET /api/ansible-roles/:id` - Get role by ID
- `POST /api/ansible-roles` - Create role
- `PUT /api/ansible-roles/:id` - Update role
- `DELETE /api/ansible-roles/:id` - Delete role

### Role Variables
- `GET /api/role-variables` - Get all variables
- `GET /api/role-variables/:id` - Get variable by ID
- `POST /api/role-variables` - Create variable
- `PUT /api/role-variables/:id` - Update variable
- `DELETE /api/role-variables/:id` - Delete variable

### TMPL Files
- `GET /api/tmpl-files` - Get all TMPL files
- `GET /api/tmpl-files/:environment` - Get by environment
- `PUT /api/tmpl-files/:environment` - Update TMPL file

### GitLab CI
- `GET /api/gitlab-ci` - Get all configs
- `GET /api/gitlab-ci/:id` - Get config by ID
- `POST /api/gitlab-ci` - Create config
- `PUT /api/gitlab-ci/:id` - Update config
- `DELETE /api/gitlab-ci/:id` - Delete config

### Template Generation
- `POST /api/template/generate` - Generate and download template

## 🐛 Troubleshooting

### Port Already in Use

```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

### Database Issues

```powershell
# Delete database to reset
Remove-Item backend\database\ansible_download_template.db

# Restart backend to recreate
cd backend
npm run dev
```

### CORS Issues

Ensure `frontend/package.json` has:
```json
"proxy": "http://localhost:5000"
```

### Module Not Found

```powershell
# Reinstall dependencies
cd backend
Remove-Item -Recurse node_modules
npm install

cd ..\frontend
Remove-Item -Recurse node_modules
npm install
```

## 📝 Development Notes

### Adding New Ansible Roles

1. Login as admin
2. Go to "Ansible Role Names"
3. Add role with OS platform and LDAP requirement
4. Go to "Ansible Role Variables"
5. Add role-specific variables

### Modifying GitLab CI Templates

1. Login as admin
2. Go to "GitLab CI YAML"
3. Select appropriate tab (Common/Environment/Role)
4. Add or edit configurations
5. Save changes

### Database Backup

```powershell
Copy-Item backend\database\ansible_download_template.db backend\database\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db
```

## ☁️ Cloud Deployment

This application supports deployment to both **Azure** and **AWS** cloud platforms with production-ready infrastructure.

### Azure Deployment

Deploy to Azure with AKS (Azure Kubernetes Service) and ACR (Azure Container Registry).

📖 **[Azure Deployment Guide](AZURE_DEPLOYMENT.md)**

#### Quick Start - Azure:
1. **Setup GitHub Secrets**: Run `scripts\setup-github-secrets.ps1`
2. **Push to GitHub**: Code automatically deploys via GitHub Actions
3. **Infrastructure**: Terraform provisions ACR + AKS with Istio
4. **Containers**: Docker images built and scanned automatically
5. **Deployment**: Helm charts deploy to Kubernetes
6. **Monitoring**: Azure Monitor and Log Analytics enabled

#### Azure Quick Commands:

```powershell
# Setup Azure authentication and GitHub secrets
.\scripts\setup-github-secrets.ps1

# Push to GitHub to trigger deployment
git add .
git commit -m "Deploy to Azure"
git push origin main

# Monitor deployment
# Visit: https://github.com/gunampallir-cpu/ansible-template-sqlite/actions
```

### AWS Deployment

Deploy to AWS with EKS (Elastic Kubernetes Service) and ECR (Elastic Container Registry).

📖 **[AWS Deployment Guide](AWS_DEPLOYMENT.md)**

#### Quick Start - AWS:
1. **Configure AWS CLI**: Run `aws configure` with your credentials
2. **Setup GitHub Secrets**: Run `scripts/setup-aws-github-secrets.sh`
3. **Create S3 Backend**: For Terraform state storage
4. **Push to GitHub**: Automated deployment via GitHub Actions
5. **Infrastructure**: Terraform provisions ECR + EKS with Istio
6. **Monitoring**: CloudWatch logs and metrics enabled

#### AWS Quick Commands:

```bash
# Configure AWS credentials
aws configure

# Setup GitHub secrets
chmod +x scripts/setup-aws-github-secrets.sh
./scripts/setup-aws-github-secrets.sh

# Push to GitHub to trigger deployment
git add .
git commit -m "Deploy to AWS"
git push origin main

# Monitor deployment
# Visit: https://github.com/gunampallir-cpu/ansible-template-aws-sqlite/actions
```

### Quick Start with Docker

For local testing with containers:

```powershell
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Manual Terraform Deployment

```powershell
cd terraform

# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply -auto-approve

# Get AKS credentials
az aks get-credentials `
  --resource-group ansible-template-rg `
  --name ansible-template-aks

# Deploy with Helm
helm install ansible-template-backend ./helm/backend --namespace ansible-template --create-namespace
helm install ansible-template-frontend ./helm/frontend --namespace ansible-template

# Verify
kubectl get pods -n ansible-template
```

### Documentation

- **[Azure Deployment Guide](AZURE_DEPLOYMENT.md)** - Complete Azure setup with AKS
- **[AWS Deployment Guide](AWS_DEPLOYMENT.md)** - Complete AWS setup with EKS
- **[Terraform Azure README](terraform/README.md)** - Azure infrastructure details
- **[Terraform AWS README](terraform-aws/README.md)** - AWS infrastructure details
- **[Helm Charts README](helm/README.md)** - Kubernetes deployment
- **[API Documentation](API_DOCUMENTATION.md)** - REST API reference

## 🤝 Contributing

This is a company internal project. For modifications:

1. Create a feature branch
2. Make changes with tests
3. Run all tests
4. Submit for review

## 📄 License

Internal company use only. All rights reserved.

## 👨‍💻 Support

For issues or questions, contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Built with ❤️ for DevOps automation**
