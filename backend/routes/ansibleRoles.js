const express = require('express');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { ansibleRoleValidation } = require('../middleware/validation');

const router = express.Router();

// Get all ansible roles
router.get('/', (req, res) => {
  const { os_platform, search } = req.query;
  
  let query = 'SELECT * FROM ansible_roles WHERE 1=1';
  const params = [];

  if (os_platform) {
    query += ' AND os_platform = ?';
    params.push(os_platform);
  }

  if (search) {
    query += ' AND role_name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY os_platform, role_name';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get ansible role by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM ansible_roles WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(row);
  });
});

// Create ansible role
router.post('/', authMiddleware, adminMiddleware, ansibleRoleValidation, (req, res) => {
  const { role_name, os_platform, requires_ldap } = req.body;

  db.run(
    'INSERT INTO ansible_roles (role_name, os_platform, requires_ldap) VALUES (?, ?, ?)',
    [role_name, os_platform, requires_ldap || 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Role already exists for this OS platform' });
        }
        return res.status(500).json({ error: 'Failed to create role' });
      }
      res.status(201).json({ id: this.lastID, message: 'Role created successfully' });
    }
  );
});

// Update ansible role
router.put('/:id', authMiddleware, adminMiddleware, ansibleRoleValidation, (req, res) => {
  const { id } = req.params;
  const { role_name, os_platform, requires_ldap } = req.body;

  db.run(
    'UPDATE ansible_roles SET role_name = ?, os_platform = ?, requires_ldap = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [role_name, os_platform, requires_ldap || 0, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Role already exists for this OS platform' });
        }
        return res.status(500).json({ error: 'Failed to update role' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json({ message: 'Role updated successfully' });
    }
  );
});

// Delete ansible role
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM ansible_roles WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete role' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  });
});

module.exports = router;
