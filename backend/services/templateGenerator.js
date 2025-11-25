const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class TemplateGeneratorService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async generateTemplate(templateData) {
    await this.ensureTempDir();
    
    const {
      environment,
      os_platform,
      vmGroups,
      mettaApplication,
      mettaComponent,
      shieldTeam,
      appContextSubscriptionName,
      appContextName,
      armSubscriptionId,
      sourcePath,
      targetIdentifier,
      assignmentGroup
    } = templateData;

    const sessionId = uuidv4();
    const templateDir = path.join(this.tempDir, sessionId, 'Ansible-Template');
    const ansibleDir = path.join(templateDir, 'ansible');

    // Create directory structure
    await fs.mkdir(ansibleDir, { recursive: true });
    await fs.mkdir(path.join(ansibleDir, 'group_vars'), { recursive: true });
    await fs.mkdir(path.join(ansibleDir, 'roles'), { recursive: true });

    // Generate all.yml
    await this.generateAllYml(ansibleDir, os_platform);

    // Generate requirements.tmpl
    await this.generateRequirementsTmpl(ansibleDir, environment);

    // Process VM groups and generate files
    const hostsContent = await this.generateHostsFiles(ansibleDir, environment, vmGroups);
    await this.generatePlaybooks(ansibleDir, environment, os_platform, vmGroups);
    await this.generateGroupVars(ansibleDir, environment, vmGroups);

    // Generate .gitlab-ci.yml
    await this.generateGitlabCIYml(templateDir, {
      environment,
      os_platform,
      vmGroups,
      mettaApplication,
      mettaComponent,
      shieldTeam,
      appContextSubscriptionName,
      appContextName,
      armSubscriptionId,
      sourcePath,
      targetIdentifier,
      assignmentGroup
    });

    // Create ZIP file
    const zipPath = path.join(this.tempDir, `${sessionId}.zip`);
    await this.createZip(templateDir, zipPath);

    return { sessionId, zipPath };
  }

  async generateAllYml(ansibleDir, os_platform) {
    return new Promise((resolve, reject) => {
      db.get('SELECT config_content FROM os_configurations WHERE os_platform = ?', [os_platform], async (err, row) => {
        if (err) return reject(err);
        
        const content = row ? row.config_content : this.getDefaultOSConfig(os_platform);
        const filePath = path.join(ansibleDir, 'group_vars', 'all.yml');
        
        try {
          await fs.writeFile(filePath, content, 'utf8');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async generateRequirementsTmpl(ansibleDir, environment) {
    return new Promise((resolve, reject) => {
      db.get('SELECT file_content FROM tmpl_files WHERE environment = ?', [environment], async (err, row) => {
        if (err) return reject(err);
        
        const content = row ? row.file_content : this.getDefaultRequirementsTmpl();
        const filePath = path.join(ansibleDir, 'roles', 'requirements.tmpl');
        
        try {
          await fs.writeFile(filePath, content, 'utf8');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async generateHostsFiles(ansibleDir, environment, vmGroups) {
    const inventoriesDir = path.join(ansibleDir, 'inventories');
    
    for (const vmGroup of vmGroups) {
      const region = vmGroup.region || '';
      const envName = region ? `${environment}_${region}` : environment;
      const envDir = path.join(inventoriesDir, envName);
      const groupVarsDir = path.join(envDir, 'group_vars');
      
      await fs.mkdir(groupVarsDir, { recursive: true });

      // Generate hosts file
      const hostsPath = path.join(envDir, 'hosts');
      let hostsContent = '';

      // Check if hosts file already exists
      try {
        hostsContent = await fs.readFile(hostsPath, 'utf8');
      } catch (error) {
        // File doesn't exist, start fresh
      }

      const groupName = `${envName}_group${vmGroup.groupNumber}`;
      const groupContent = `\n[${groupName}]\n${vmGroup.hostnames.join('\n')}\n`;
      
      hostsContent += groupContent;
      await fs.writeFile(hostsPath, hostsContent, 'utf8');
    }
  }

  async generatePlaybooks(ansibleDir, environment, os_platform, vmGroups) {
    const groupedByRegion = this.groupVMsByRegion(vmGroups);

    for (const [region, groups] of Object.entries(groupedByRegion)) {
      const envName = region ? `${environment}_${region}` : environment;
      
      // Generate individual group playbooks
      for (const group of groups) {
        const groupName = `${envName}_group${group.groupNumber}`;
        const playbookName = `${groupName}_ansible_playbook.yml`;
        const playbookPath = path.join(ansibleDir, playbookName);
        
        const playbookContent = this.generatePlaybookContent(groupName, envName, os_platform, group.roles);
        await fs.writeFile(playbookPath, playbookContent, 'utf8');
      }

      // Generate "all" playbook if multiple groups
      if (groups.length > 1) {
        const allPlaybookName = `${envName}_all_ansible_playbook.yml`;
        const allPlaybookPath = path.join(ansibleDir, allPlaybookName);
        
        let allPlaybookContent = '---\n# Main playbook that includes all VM group playbooks\n';
        for (const group of groups) {
          const groupName = `${envName}_group${group.groupNumber}`;
          allPlaybookContent += `- import_playbook: ${groupName}_ansible_playbook.yml\n`;
        }
        
        await fs.writeFile(allPlaybookPath, allPlaybookContent, 'utf8');
      }
    }
  }

  generatePlaybookContent(groupName, envName, os_platform, roles) {
    const becomeMethod = os_platform === 'Windows' ? 'runas' : 'sudo';
    const becomeConfig = os_platform === 'Windows' 
      ? '  become_method: runas' 
      : '  become: yes';

    let content = `- hosts: ${groupName}\n`;
    content += `  gather_facts: true\n`;
    content += `${becomeConfig}\n`;
    content += `  strategy: free\n`;
    content += `  vars_files:\n`;
    content += `    - inventories/${envName}/group_vars/${groupName}.yml\n`;
    content += `   \n`;
    content += `  roles:\n`;
    
    for (const role of roles) {
      content += `    - shared_roles/${os_platform}/${role}\n`;
    }

    return content;
  }

  async generateGroupVars(ansibleDir, environment, vmGroups) {
    const inventoriesDir = path.join(ansibleDir, 'inventories');

    for (const vmGroup of vmGroups) {
      const region = vmGroup.region || '';
      const envName = region ? `${environment}_${region}` : environment;
      const groupName = `${envName}_group${vmGroup.groupNumber}`;
      
      const groupVarsDir = path.join(inventoriesDir, envName, 'group_vars');
      const groupVarFile = path.join(groupVarsDir, `${groupName}.yml`);

      // Get role variables for each role
      let variableContent = '---\n# Ansible role variables\n\n';
      
      for (const roleId of vmGroup.roles) {
        const roleVar = await this.getRoleVariable(roleId, vmGroup.os_platform || 'Linux');
        if (roleVar) {
          variableContent += `# Variables for role: ${roleVar.role_name}\n`;
          variableContent += `${roleVar.variable_content}\n\n`;
        }
      }

      await fs.writeFile(groupVarFile, variableContent, 'utf8');
    }
  }

  getRoleVariable(roleId, os_platform) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT rv.*, ar.role_name 
        FROM ansible_role_variables rv
        JOIN ansible_roles ar ON rv.role_id = ar.id
        WHERE rv.role_id = ? AND rv.os_platform = ?
      `;
      
      db.get(query, [roleId, os_platform], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async generateGitlabCIYml(templateDir, data) {
    const {
      environment,
      os_platform,
      vmGroups,
      mettaApplication,
      mettaComponent,
      shieldTeam,
      appContextSubscriptionName,
      appContextName,
      armSubscriptionId,
      sourcePath,
      targetIdentifier,
      assignmentGroup
    } = data;

    let content = '';

    // Add common config
    const commonConfig = await this.getGitLabConfig('common');
    content += commonConfig + '\n\n';

    // Check if any role requires LDAP
    const requiresLdap = await this.checkLdapRequirement(vmGroups);

    // Group VMs by region
    const groupedByRegion = this.groupVMsByRegion(vmGroups);

    for (const [region, groups] of Object.entries(groupedByRegion)) {
      const envName = region ? `${environment}_${region}` : environment;

      // Add LDAP replication if required (only once per region)
      if (requiresLdap && sourcePath && targetIdentifier) {
        content += this.generateLdapReplicationJob(environment, region, {
          mettaApplication,
          mettaComponent,
          shieldTeam,
          appContextSubscriptionName,
          appContextName,
          sourcePath,
          targetIdentifier,
          assignmentGroup
        });
        content += '\n';
      }

      // Add setup jobs for each VM group
      for (const group of groups) {
        content += this.generateSetupJob(envName, os_platform, group.groupNumber, {
          mettaApplication,
          mettaComponent,
          shieldTeam,
          appContextSubscriptionName,
          appContextName,
          armSubscriptionId,
          assignmentGroup
        });
        content += '\n';
      }

      // Add "all" setup job if multiple groups
      if (groups.length > 1) {
        content += this.generateAllSetupJob(envName, os_platform, {
          mettaApplication,
          mettaComponent,
          shieldTeam,
          appContextSubscriptionName,
          appContextName,
          armSubscriptionId,
          assignmentGroup
        });
        content += '\n';
      }
    }

    const filePath = path.join(templateDir, '.gitlab-ci.yml');
    await fs.writeFile(filePath, content, 'utf8');
  }

  async getGitLabConfig(configType, environment = null, os_platform = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT config_content FROM gitlab_ci_configs WHERE config_type = ?';
      const params = [configType];

      if (environment) {
        query += ' AND environment = ?';
        params.push(environment);
      }

      if (os_platform) {
        query += ' AND os_platform = ?';
        params.push(os_platform);
      }

      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.config_content : '');
      });
    });
  }

  async checkLdapRequirement(vmGroups) {
    for (const group of vmGroups) {
      for (const roleId of group.roles) {
        const requiresLdap = await new Promise((resolve, reject) => {
          db.get('SELECT requires_ldap FROM ansible_roles WHERE id = ?', [roleId], (err, row) => {
            if (err) return reject(err);
            resolve(row && row.requires_ldap);
          });
        });
        
        if (requiresLdap) return true;
      }
    }
    return false;
  }

  generateLdapReplicationJob(environment, region, config) {
    const envName = region ? `${environment}_${region}` : environment;
    const sourceMount = `ldap/${environment}/us`;
    const appContextRegion = region === 'cus' ? 'centralus' : region === 'eus' ? 'eastus2' : '';

    let job = `${envName}-replicate-runtime-ldap-secret:\n`;
    job += `  stage: .pre\n`;
    job += `  extends: .secret-replicate-ad-template\n`;
    job += `  when: manual\n`;
    job += `  image:\n`;
    job += `  variables:\n`;
    job += `    METTA_APPLICATION: ${config.mettaApplication}\n`;
    job += `    METTA_COMPONENT: ${config.mettaComponent}\n`;
    job += `    SHIELD_TEAM: ${config.shieldTeam}\n`;
    job += `    SHIELD_ENV: ${environment}\n`;
    job += `    APP_CONTEXT_SUBSCRIPTION_NAME: ${config.appContextSubscriptionName}\n`;
    job += `    APP_CONTEXT_NAME: ${config.appContextName}\n`;
    job += `    SOURCE_MOUNT: ${sourceMount}\n`;
    job += `    ROTATE_PASSWORD: true\n`;
    job += `    HCVAULT_PLUGIN_ENABLE_CAR_NAMESPACE:\n`;
    job += `    SOURCE_PATH: ${config.sourcePath}\n`;
    job += `    TARGET_IDENTIFIER: ${config.targetIdentifier}\n`;
    
    if (appContextRegion) {
      job += `    APP_CONTEXT_REGION: ${appContextRegion}\n`;
    }
    
    if (config.assignmentGroup && ['uat', 'prod'].includes(environment)) {
      job += `    ASSIGNMENT_GROUP: ${config.assignmentGroup}\n`;
    }

    return job;
  }

  generateSetupJob(envName, os_platform, groupNumber, config) {
    const jobName = `Ansible_${this.capitalize(envName)}_group${groupNumber}_Setup_${os_platform}`;
    const playbookName = `${envName}_group${groupNumber}_ansible_playbook`;
    const shieldEnv = envName.split('_')[0];

    let job = `${jobName}:\n`;
    job += `  stage: .pre\n`;
    job += `  extends: .run-ansible\n`;
    job += `  when: manual\n`;
    job += `  variables:\n`;
    job += `    METTA_APPLICATION: ${config.mettaApplication}\n`;
    job += `    METTA_COMPONENT: ${config.mettaComponent}\n`;
    job += `    SHIELD_TEAM: ${config.shieldTeam}\n`;
    job += `    SHIELD_ENV: ${shieldEnv}\n`;
    job += `    APP_CONTEXT_SUBSCRIPTION_NAME: ${config.appContextSubscriptionName}\n`;
    job += `    APP_CONTEXT_NAME: ${config.appContextName}\n`;
    job += `    PLAYBOOK_NAME: ${playbookName}\n`;
    job += `    ARM_SUBSCRIPTION_ID: ${config.armSubscriptionId}\n`;
    
    if (config.assignmentGroup && ['uat', 'prod'].includes(shieldEnv)) {
      job += `    ASSIGNMENT_GROUP: ${config.assignmentGroup}\n`;
    }

    return job;
  }

  generateAllSetupJob(envName, os_platform, config) {
    const jobName = `Ansible_${this.capitalize(envName)}_all_Setup_${os_platform}`;
    const playbookName = `${envName}_all_ansible_playbook`;
    const shieldEnv = envName.split('_')[0];

    let job = `${jobName}:\n`;
    job += `  stage: .pre\n`;
    job += `  extends: .run-ansible\n`;
    job += `  when: manual\n`;
    job += `  variables:\n`;
    job += `    METTA_APPLICATION: ${config.mettaApplication}\n`;
    job += `    METTA_COMPONENT: ${config.mettaComponent}\n`;
    job += `    SHIELD_TEAM: ${config.shieldTeam}\n`;
    job += `    SHIELD_ENV: ${shieldEnv}\n`;
    job += `    APP_CONTEXT_SUBSCRIPTION_NAME: ${config.appContextSubscriptionName}\n`;
    job += `    APP_CONTEXT_NAME: ${config.appContextName}\n`;
    job += `    PLAYBOOK_NAME: ${playbookName}\n`;
    job += `    ARM_SUBSCRIPTION_ID: ${config.armSubscriptionId}\n`;
    
    if (config.assignmentGroup && ['uat', 'prod'].includes(shieldEnv)) {
      job += `    ASSIGNMENT_GROUP: ${config.assignmentGroup}\n`;
    }

    return job;
  }

  groupVMsByRegion(vmGroups) {
    const grouped = {};
    
    for (const group of vmGroups) {
      const region = group.region || '';
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(group);
    }

    return grouped;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async createZip(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourceDir, 'Ansible-Template');
      archive.finalize();
    });
  }

  async cleanup(sessionId) {
    try {
      const sessionDir = path.join(this.tempDir, sessionId);
      const zipPath = path.join(this.tempDir, `${sessionId}.zip`);
      
      await fs.rm(sessionDir, { recursive: true, force: true });
      await fs.unlink(zipPath);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  getDefaultOSConfig(os_platform) {
    if (os_platform === 'Linux') {
      return `ansible_become_user: root
ansible_become_method: sudo
"ansible_ssh_user": "{{ lookup('ansible.builtin.env', 'SERVICE_ID') }}"
"ansible_ssh_pass": "{{ lookup('ansible.builtin.env', 'SERVICE_PW') }}"
"ansible_sudo_pass": "{{ lookup('ansible.builtin.env', 'SERVICE_PW') }}"
"ansible_ssh_common_args": "-o StrictHostKeyChecking=no"`;
    } else {
      return `"ansible_user": "{{ lookup('ansible.builtin.env', 'SERVICE_ID') }}"
"ansible_password": "{{ lookup('ansible.builtin.env', 'SERVICE_PW') }}"
"ansible_connection": "winrm"
"ansible_port": "5985"
"ansible_winrm_cert_validation": "ignore"
"ansible_winrm_transport": "ntlm"
"ansible_python_interpreter": /usr/bin/python
#"install_azure_requirements": "true"`;
    }
  }

  getDefaultRequirementsTmpl() {
    return `---
# Requirements file for Ansible roles
- name: shared_roles
  src: https://gitlab-ci-token:\${CI_JOB_TOKEN}@gitlab.rajagunampalli.com/ansible-roles.git
  scm: git
  version: main`;
  }
}

module.exports = new TemplateGeneratorService();
