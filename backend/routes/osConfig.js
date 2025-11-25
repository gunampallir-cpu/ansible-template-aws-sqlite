const express = require('express');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { osConfigValidation } = require('../middleware/validation');

const router = express.Router();

// Get all OS configurations
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  db.all('SELECT * FROM os_configurations ORDER BY os_platform', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get OS configuration by platform
router.get('/:platform', (req, res) => {
  const { platform } = req.params;
  
  if (!['Linux', 'Windows'].includes(platform)) {
    return res.status(400).json({ error: 'Invalid OS platform' });
  }

  db.get('SELECT * FROM os_configurations WHERE os_platform = ?', [platform], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(row);
  });
});

// Update OS configuration
router.put('/:platform', authMiddleware, adminMiddleware, osConfigValidation, (req, res) => {
  const { platform } = req.params;
  const { config_content } = req.body;

  db.run(
    'UPDATE os_configurations SET config_content = ?, updated_at = CURRENT_TIMESTAMP WHERE os_platform = ?',
    [config_content, platform],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update configuration' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      res.json({ message: 'Configuration updated successfully' });
    }
  );
});

module.exports = router;
