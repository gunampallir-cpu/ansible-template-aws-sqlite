const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'ansible_download_template.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // OS Configurations table
    db.run(`
      CREATE TABLE IF NOT EXISTS os_configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        os_platform TEXT NOT NULL CHECK(os_platform IN ('Linux', 'Windows')),
        config_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(os_platform)
      )
    `);

    // Ansible Roles table
    db.run(`
      CREATE TABLE IF NOT EXISTS ansible_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT NOT NULL,
        os_platform TEXT NOT NULL CHECK(os_platform IN ('Linux', 'Windows')),
        requires_ldap BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, os_platform)
      )
    `);

    // Ansible Role Variables table
    db.run(`
      CREATE TABLE IF NOT EXISTS ansible_role_variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        os_platform TEXT NOT NULL CHECK(os_platform IN ('Linux', 'Windows')),
        variable_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES ansible_roles(id) ON DELETE CASCADE,
        UNIQUE(role_id, os_platform)
      )
    `);

    // TMPL Files table
    db.run(`
      CREATE TABLE IF NOT EXISTS tmpl_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        environment TEXT NOT NULL CHECK(environment IN ('dev', 'it', 'uat', 'prod', 'all')),
        file_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(environment)
      )
    `);

    // GitLab CI YAML configurations table
    db.run(`
      CREATE TABLE IF NOT EXISTS gitlab_ci_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_type TEXT NOT NULL CHECK(config_type IN ('common', 'environment', 'role')),
        environment TEXT CHECK(environment IN ('dev', 'it', 'uat', 'prod', 'all')),
        os_platform TEXT CHECK(os_platform IN ('Linux', 'Windows')),
        role_id INTEGER,
        config_content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES ansible_roles(id) ON DELETE CASCADE
      )
    `);

    // Insert default admin users
    const bcrypt = require('bcryptjs');
    const defaultUsers = [
      { username: 'gunampalli', password: 'Raja@1358' },
      { username: 'rajasekhar', password: 'Sunnu@1358' },
      { username: 'Reddy', password: 'Sai@1358' }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, is_admin) VALUES (?, ?, 1)');
    defaultUsers.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      stmt.run(user.username, hashedPassword);
    });
    stmt.finalize();

    // Insert default OS configurations
    insertDefaultOSConfigs();
    insertDefaultTmplFiles();
    insertDefaultGitLabCIConfigs();
  });
}

function insertDefaultOSConfigs() {
  const linuxConfig = `ansible_become_user: root
ansible_become_method: sudo
"ansible_ssh_user": "{{ lookup('ansible.builtin.env', 'SERVICE_ID') }}"
"ansible_ssh_pass": "{{ lookup('ansible.builtin.env', 'SERVICE_PW') }}"
"ansible_sudo_pass": "{{ lookup('ansible.builtin.env', 'SERVICE_PW') }}"
"ansible_ssh_common_args": "-o StrictHostKeyChecking=no"`;

  const windowsConfig = `"ansible_user": "{{ lookup('ansible.builtin.env', 'SERVICE_ID') }}"
"ansible_password": "{{ lookup('ansible.builtin.env', 'SERVICE_PW') }}"
"ansible_connection": "winrm"
"ansible_port": "5985"
"ansible_winrm_cert_validation": "ignore"
"ansible_winrm_transport": "ntlm"
"ansible_python_interpreter": /usr/bin/python
#"install_azure_requirements": "true"`;

  db.run('INSERT OR IGNORE INTO os_configurations (os_platform, config_content) VALUES (?, ?)', ['Linux', linuxConfig]);
  db.run('INSERT OR IGNORE INTO os_configurations (os_platform, config_content) VALUES (?, ?)', ['Windows', windowsConfig]);
}

function insertDefaultTmplFiles() {
  const tmplContent = `---
# Requirements file for Ansible roles
- name: shared_roles
  src: https://gitlab-ci-token:\${CI_JOB_TOKEN}@gitlab.rajagunampalli.com/ansible-roles.git
  scm: git
  version: main`;

  ['dev', 'it', 'uat', 'prod', 'all'].forEach(env => {
    db.run('INSERT OR IGNORE INTO tmpl_files (environment, file_content) VALUES (?, ?)', [env, tmplContent]);
  });
}

function insertDefaultGitLabCIConfigs() {
  const commonConfig = `variables:
  JOBAUTO: "false"
  CJOBAUTO: "false"
  C2JOBAUTO: "true"

include:
  - project: 'USBCLOLDPLATFORM/CICD/usbcloud-pipeline'
    ref: main
    file: 'ci-templates/usbcloud.yml'
  - project: engineering/pipelinecli
    ref: latest
    file: '/templates/plugins/plugin-steps.yml'
  - project: 'AZURECLOUDMIGRATION/ansible-plugin.yml'
    ref: main
    file: 'ansible-plugin.yml'`;

  db.run('INSERT OR IGNORE INTO gitlab_ci_configs (config_type, config_content) VALUES (?, ?)', ['common', commonConfig]);
}

module.exports = db;
