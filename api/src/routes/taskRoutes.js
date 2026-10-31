const express = require('express');
const { listTasks, getTask } = require('../controllers/taskController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', listTasks);
router.get('/:id', getTask);

module.exports = router;