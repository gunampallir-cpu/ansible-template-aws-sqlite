const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware, adminMiddleware, checkAdminUser } = require('../middleware/auth');
const { loginValidation, changePasswordValidation } = require('../middleware/validation');

const router = express.Router();

// Login
router.post('/login', loginValidation, (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin
      }
    });
  });
});

// Change password
router.post('/change-password', authMiddleware, changePasswordValidation, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update password' });
        }
        res.json({ message: 'Password updated successfully' });
      }
    );
  });
});

// Verify token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      is_admin: req.user.is_admin
    }
  });
});

module.exports = router;
