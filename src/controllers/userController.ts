import prisma from '../lib/prisma.js';
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { NextFunction, Response } from 'express';

export const getMe = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.params.id = req.user!.id.toString();

    next();
  }
);

export const getUser = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id, 10);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'User fetched successfully',
      data: user,
    });
  }
);
