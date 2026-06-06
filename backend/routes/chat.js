const express = require('express');
const router = express.Router();
const { chatWithBot } = require('../services/chatService');

router.post('/', async (req, res) => {
  try {
    const { history = [], message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await chatWithBot(history, message);
    return res.json({ text: response });
  } catch (err) {
    console.error('❌ POST /api/chat error:', err);
    return res.status(500).json({ error: err.message || 'Chat request failed' });
  }
});

module.exports = router;
