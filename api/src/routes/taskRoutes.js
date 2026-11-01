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
const {
  listAssignees,
  assignUsers,
  setPrimaryAssignee,
  removeAssignee,
} = require('../controllers/assignmentController');
const {
  listShares,
  createShares,
  updateShare,
  revokeShare,
} = require('../controllers/taskShareController');
const { listTaskEmailLogs } = require('../controllers/emailLogController');
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

router.get('/:id/assignees', listAssignees);
router.post('/:id/assignees', assignUsers);
router.patch('/:id/assignees/:userId', setPrimaryAssignee);
router.delete('/:id/assignees/:userId', removeAssignee);

router.get('/:id/shares', listShares);
router.post('/:id/shares', createShares);
router.patch('/:id/shares/:shareId', updateShare);
router.delete('/:id/shares/:shareId', revokeShare);

router.get('/:id/email-logs', listTaskEmailLogs);

module.exports = router;