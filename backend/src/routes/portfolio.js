const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getPublic, get, save } = require('../controllers/portfolioController');

router.get('/public', getPublic);
router.get('/',  authenticate, get);
router.put('/',  authenticate, save);

module.exports = router;
