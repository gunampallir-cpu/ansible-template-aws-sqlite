import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ChangePassword = () => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { changePassword } = useAuth();

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      
      setSuccess('Password changed successfully!');
      setPasswords({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h2>Change Password</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div className="form-group">
          <label htmlFor="oldPassword">Current Password *</label>
          <input
            type="password"
            id="oldPassword"
            name="oldPassword"
            value={passwords.oldPassword}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password *</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="new-password"
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Password must be at least 6 characters and contain uppercase, lowercase, number, and special character
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
