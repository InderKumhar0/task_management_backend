import type { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import AppError from '../utils/appError.js';

export interface IUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface jwtSchema {
  id: number;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const protect = catchAsync(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwtSchema;

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );
    }

    req.user = currentUser as IUser;
    next();
  }
);
