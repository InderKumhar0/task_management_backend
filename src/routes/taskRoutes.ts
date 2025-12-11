import express from 'express';
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTaskByID,
  updateTask,
} from '../controllers/taskController.js';

const router = express.Router();

router.post('/', createTask);
router.get('/', getAllTasks);
router.get('/:id', getTaskByID);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
