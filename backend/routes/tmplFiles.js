const express = require('express');
const db = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { tmplFileValidation } = require('../middleware/validation');

const router = express.Router();

// Get all tmpl files
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  db.all('SELECT * FROM tmpl_files ORDER BY environment', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get tmpl file by environment
router.get('/:environment', (req, res) => {
  const { environment } = req.params;

  db.get('SELECT * FROM tmpl_files WHERE environment = ?', [environment], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'TMPL file not found' });
    }
    res.json(row);
  });
});

// Update tmpl file
router.put('/:environment', authMiddleware, adminMiddleware, tmplFileValidation, (req, res) => {
  const { environment } = req.params;
  const { file_content } = req.body;

  db.run(
    'UPDATE tmpl_files SET file_content = ?, updated_at = CURRENT_TIMESTAMP WHERE environment = ?',
    [file_content, environment],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update TMPL file' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'TMPL file not found' });
      }
      res.json({ message: 'TMPL file updated successfully' });
    }
  );
});

module.exports = router;
