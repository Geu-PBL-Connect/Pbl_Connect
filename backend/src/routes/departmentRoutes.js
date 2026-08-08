const express = require('express');
const router = express.Router();
const { getDepartments } = require('../controllers/departmentController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, authorize('SUPER_ADMIN', 'CTO', 'DEVELOPER'), getDepartments);

module.exports = router;
