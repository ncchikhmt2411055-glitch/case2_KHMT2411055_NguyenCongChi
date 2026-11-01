const express = require('express');
const {
  taskStats,
  assignmentStats,
  deadlineStats,
} = require('../controllers/statisticsController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/tasks', taskStats);
router.get('/assignments', assignmentStats);
router.get('/deadlines', deadlineStats);

module.exports = router;