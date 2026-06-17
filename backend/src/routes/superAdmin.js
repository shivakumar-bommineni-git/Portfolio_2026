const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/superAdminController');

const guard = [authenticate, requireRole('super_admin')];

router.get('/stats',         ...guard, ctrl.getDashboardStats);
router.get('/admins',        ...guard, ctrl.getAdmins);
router.get('/users',         ...guard, ctrl.getAllUsers);
router.get('/audit-logs',    ...guard, ctrl.getAuditLogs);

router.post('/admins/create',
  ...guard,
  [
    body('phone').trim().matches(/^\+?[1-9]\d{9,14}$/).withMessage('Valid phone required'),
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name required'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Invalid email'),
  ],
  validate,
  ctrl.createAdmin
);

router.put('/admins/:id/toggle',  ...guard, ctrl.toggleAdmin);
router.delete('/admins/:id',      ...guard, ctrl.deleteAdmin);
router.put('/users/:id/toggle',   ...guard, ctrl.toggleUser);

module.exports = router;
