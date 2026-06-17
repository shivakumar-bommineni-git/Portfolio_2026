const express = require('express');
const rateLimit = require('express-rate-limit');
const { chat, status } = require('../controllers/chatController');

const router = express.Router();

// Stricter rate limit specifically for the AI chat endpoint
const chatLimit = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 15,                    // 15 messages per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please wait a moment before trying again.' },
});

router.get('/status', status);
router.post('/', chatLimit, express.json({ limit: '50kb' }), chat);

module.exports = router;
