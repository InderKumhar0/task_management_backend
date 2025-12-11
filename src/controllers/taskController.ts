import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  createTaskSchema,
  updateTaskSchema,
} from '../validation/task.validation.js';
import { AuthenticatedRequest, IUser } from '../middlewares/authMiddleware.js';
import AppError from '../utils/appError.js';

export const createTask = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const validated = createTaskSchema.parse(req.body);

    const currentUser = req.user as IUser;

    const newTask = await prisma.task.create({
      data: { ...validated, userId: currentUser.id },
    });

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: newTask,
    });
  }
);

export const getAllTasks = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUser = req.user as IUser;

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;

    let filteredTasksQuery: any = { userId: currentUser.id, isDeleted: false };

    Object.entries(req.query).forEach(([key, value]) => {
      if (value === undefined || value === '') return;

      if (['page', 'limit'].includes(key)) return;

      filteredTasksQuery[key] = value;
    });

    const tasks = await prisma.task.findMany({
      where: filteredTasksQuery,
      skip,
      take: limit,
    });

    res.status(200).json({
      status: 'success',
      message: 'Tasks fetched successfully',
      data: tasks,
      pagination: {
        page,
        limit,
      },
    });
  }
);

export const getTaskByID = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const currentUser = req.user as IUser;

    const tasks = await prisma.task.findFirst({
      where: { userId: currentUser.id, isDeleted: false },
    });

    res.status(200).json({
      status: 'success',
      message: 'Task fetched successfully',
      data: tasks,
    });
  }
);

export const updateTask = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const taskId = parseInt(req.params.id, 10);
    const currentUser = req.user as IUser;

    const task = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    if (task.userId !== currentUser.id) {
      return next(
        new AppError('You do not have permission to update this task', 403)
      );
    }

    const validated = updateTaskSchema.parse(req.body);

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: validated,
    });

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: updatedTask,
    });
  }
);

export const deleteTask = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const taskId = parseInt(req.params.id);

    const currentUser = req.user as IUser;

    const task = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    if (task.userId !== currentUser.id) {
      return next(
        new AppError('You do not have permission to delete this task', 403)
      );
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
      data: null,
    });
  }
);
