const express = require('express');
const { searchUsers } = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);
router.get('/search', searchUsers);

module.exports = router;