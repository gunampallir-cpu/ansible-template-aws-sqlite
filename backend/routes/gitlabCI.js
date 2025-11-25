const express = require('express');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { gitlabCIValidation } = require('../middleware/validation');

const router = express.Router();

// Get all gitlab CI configs
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  const { config_type, environment, os_platform } = req.query;
  
  let query = 'SELECT * FROM gitlab_ci_configs WHERE 1=1';
  const params = [];

  if (config_type) {
    query += ' AND config_type = ?';
    params.push(config_type);
  }

  if (environment) {
    query += ' AND environment = ?';
    params.push(environment);
  }

  if (os_platform) {
    query += ' AND os_platform = ?';
    params.push(os_platform);
  }

  query += ' ORDER BY config_type, environment, os_platform';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get gitlab CI config by ID
router.get('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM gitlab_ci_configs WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'GitLab CI config not found' });
    }
    res.json(row);
  });
});

// Create gitlab CI config
router.post('/', authMiddleware, adminMiddleware, gitlabCIValidation, (req, res) => {
  const { config_type, environment, os_platform, role_id, config_content } = req.body;

  db.run(
    'INSERT INTO gitlab_ci_configs (config_type, environment, os_platform, role_id, config_content) VALUES (?, ?, ?, ?, ?)',
    [config_type, environment || null, os_platform || null, role_id || null, config_content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create GitLab CI config' });
      }
      res.status(201).json({ id: this.lastID, message: 'GitLab CI config created successfully' });
    }
  );
});

// Update gitlab CI config
router.put('/:id', authMiddleware, adminMiddleware, gitlabCIValidation, (req, res) => {
  const { id } = req.params;
  const { config_type, environment, os_platform, role_id, config_content } = req.body;

  db.run(
    'UPDATE gitlab_ci_configs SET config_type = ?, environment = ?, os_platform = ?, role_id = ?, config_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [config_type, environment || null, os_platform || null, role_id || null, config_content, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update GitLab CI config' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'GitLab CI config not found' });
      }
      res.json({ message: 'GitLab CI config updated successfully' });
    }
  );
});

// Delete gitlab CI config
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM gitlab_ci_configs WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete GitLab CI config' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'GitLab CI config not found' });
    }
    res.json({ message: 'GitLab CI config deleted successfully' });
  });
});

module.exports = router;
