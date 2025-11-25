import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OSConfiguration from './admin/OSConfiguration';
import AnsibleRoleNames from './admin/AnsibleRoleNames';
import AnsibleRoleVariables from './admin/AnsibleRoleVariables';
import TmplFile from './admin/TmplFile';
import GitLabCIYaml from './admin/GitLabCIYaml';
import ChangePassword from './admin/ChangePassword';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('os-config');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'os-config':
        return <OSConfiguration />;
      case 'ansible-roles':
        return <AnsibleRoleNames />;
      case 'role-variables':
        return <AnsibleRoleVariables />;
      case 'tmpl-file':
        return <TmplFile />;
      case 'gitlab-ci':
        return <GitLabCIYaml />;
      case 'change-password':
        return <ChangePassword />;
      default:
        return <OSConfiguration />;
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.username}</span>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/template-generator')}>
            Template Generator
          </button>
        </div>
      </div>

      <div className="admin-container">
        <nav className="admin-sidebar">
          <button
            className={`nav-item ${activeTab === 'os-config' ? 'active' : ''}`}
            onClick={() => setActiveTab('os-config')}
          >
            OS Configuration
          </button>
          <button
            className={`nav-item ${activeTab === 'ansible-roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('ansible-roles')}
          >
            Ansible Role Names
          </button>
          <button
            className={`nav-item ${activeTab === 'role-variables' ? 'active' : ''}`}
            onClick={() => setActiveTab('role-variables')}
          >
            Ansible Role Variables
          </button>
          <button
            className={`nav-item ${activeTab === 'tmpl-file' ? 'active' : ''}`}
            onClick={() => setActiveTab('tmpl-file')}
          >
            TMPL File
          </button>
          <button
            className={`nav-item ${activeTab === 'gitlab-ci' ? 'active' : ''}`}
            onClick={() => setActiveTab('gitlab-ci')}
          >
            GitLab CI YAML
          </button>
          <button
            className={`nav-item ${activeTab === 'change-password' ? 'active' : ''}`}
            onClick={() => setActiveTab('change-password')}
          >
            Change Password
          </button>
        </nav>

        <main className="admin-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
