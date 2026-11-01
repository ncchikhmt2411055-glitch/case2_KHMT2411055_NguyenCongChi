const express = require('express');
const { retryEmail } = require('../controllers/emailLogController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.post('/:id/retry', retryEmail);

module.exports = router;