import express from 'express';
import { getMe, getUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', getMe, getUser);
router.get('/:id', getUser);

export default router;
