const express = require('express');
const templateGenerator = require('../services/templateGenerator');
const { templateGenerationValidation } = require('../middleware/validation');

const router = express.Router();

// Generate and download template
router.post('/generate', templateGenerationValidation, async (req, res) => {
  try {
    const { sessionId, zipPath } = await templateGenerator.generateTemplate(req.body);

    res.download(zipPath, 'Ansible-Template.zip', async (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      
      // Cleanup after download
      setTimeout(async () => {
        await templateGenerator.cleanup(sessionId);
      }, 5000);
    });
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template', details: error.message });
  }
});

module.exports = router;
