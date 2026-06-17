const express = require('express');
const rateLimit = require('express-rate-limit');
const { send } = require('../controllers/contactController');
const router = express.Router();

const contactLimit = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                      // max 5 contact submissions per IP per hour
  message: { message: 'Too many messages sent. Please try again later.' },
});

router.post('/', contactLimit, send);
module.exports = router;
