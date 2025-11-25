const express = require('express');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { roleVariableValidation } = require('../middleware/validation');

const router = express.Router();

// Get all role variables
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  const { role_id, os_platform } = req.query;
  
  let query = `
    SELECT rv.*, ar.role_name 
    FROM ansible_role_variables rv
    JOIN ansible_roles ar ON rv.role_id = ar.id
    WHERE 1=1
  `;
  const params = [];

  if (role_id) {
    query += ' AND rv.role_id = ?';
    params.push(role_id);
  }

  if (os_platform) {
    query += ' AND rv.os_platform = ?';
    params.push(os_platform);
  }

  query += ' ORDER BY ar.role_name, rv.os_platform';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get role variable by ID
router.get('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT rv.*, ar.role_name 
    FROM ansible_role_variables rv
    JOIN ansible_roles ar ON rv.role_id = ar.id
    WHERE rv.id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Role variable not found' });
    }
    res.json(row);
  });
});

// Create role variable
router.post('/', authMiddleware, adminMiddleware, roleVariableValidation, (req, res) => {
  const { role_id, os_platform, variable_content } = req.body;

  // Check if role exists
  db.get('SELECT id FROM ansible_roles WHERE id = ?', [role_id], (err, role) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    db.run(
      'INSERT INTO ansible_role_variables (role_id, os_platform, variable_content) VALUES (?, ?, ?)',
      [role_id, os_platform, variable_content],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Variable already exists for this role and OS platform' });
          }
          return res.status(500).json({ error: 'Failed to create role variable' });
        }
        res.status(201).json({ id: this.lastID, message: 'Role variable created successfully' });
      }
    );
  });
});

// Update role variable
router.put('/:id', authMiddleware, adminMiddleware, roleVariableValidation, (req, res) => {
  const { id } = req.params;
  const { role_id, os_platform, variable_content } = req.body;

  db.run(
    'UPDATE ansible_role_variables SET role_id = ?, os_platform = ?, variable_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [role_id, os_platform, variable_content, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Variable already exists for this role and OS platform' });
        }
        return res.status(500).json({ error: 'Failed to update role variable' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Role variable not found' });
      }
      res.json({ message: 'Role variable updated successfully' });
    }
  );
});

// Delete role variable
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM ansible_role_variables WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete role variable' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Role variable not found' });
    }
    res.json({ message: 'Role variable deleted successfully' });
  });
});

module.exports = router;
