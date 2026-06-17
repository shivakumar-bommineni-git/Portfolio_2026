const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/adminController');

const guard = [authenticate, requireRole('admin', 'super_admin')];

router.get('/stats',              ...guard, ctrl.getDashboardStats);
router.get('/users',              ...guard, ctrl.getUsers);
router.put('/users/:id/toggle',   ...guard, ctrl.toggleUser);

module.exports = router;
