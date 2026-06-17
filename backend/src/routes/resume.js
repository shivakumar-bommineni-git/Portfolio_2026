const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { get, save } = require('../controllers/resumeController');

router.get('/', authenticate, get);
router.put('/', authenticate, save);

module.exports = router;
