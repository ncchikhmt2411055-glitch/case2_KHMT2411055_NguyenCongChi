const express = require('express');
const {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateStatus,
  deleteTask,
  listActivities,
} = require('../controllers/taskController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateStatus);
router.get('/:id/activities', listActivities);

module.exports = router;