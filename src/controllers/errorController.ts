import type { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError.js';
import { ZodError } from 'zod';

const handleZodError = (err: ZodError | any): AppError => {
  let errorsArray: any[] = [];

  if (err instanceof ZodError) {
    errorsArray = err.issues;
  } else if (typeof err === 'string') {
    try {
      errorsArray = JSON.parse(err);
    } catch {
      errorsArray = [];
    }
  } else if (Array.isArray(err)) {
    errorsArray = err;
  } else if (err.errors && Array.isArray(err.errors)) {
    errorsArray = err.errors;
  }

  const formattedErrors: Record<string, string> = {};

  errorsArray.forEach((error: any) => {
    if (error.path && error.path.length > 0) {
      const path = error.path.join('.');

      switch (error.code) {
        case 'invalid_type':
          formattedErrors[
            path
          ] = `Expected ${error.expected}, received ${error.received}`;
          break;
        case 'too_small':
          if (error.type === 'string') {
            formattedErrors[
              path
            ] = `Must be at least ${error.minimum} characters`;
          } else {
            formattedErrors[path] = error.message;
          }
          break;
        case 'too_big':
          if (error.type === 'string') {
            formattedErrors[
              path
            ] = `Must be at most ${error.maximum} characters`;
          } else {
            formattedErrors[path] = error.message;
          }
          break;
        case 'custom':
          formattedErrors[path] = error.message;
          break;
        default:
          formattedErrors[path] = error.message;
      }
    }
  });

  return new AppError('Validation failed', 400, formattedErrors);
};

const handlePrismaError = (err: any): AppError => {
  console.log('FROM PRISMA ERROR HANDLER', err);
  const formattedErrors: Record<string, string> = {};
  if (err.code === 'P2002') {
    const field =
      err.meta?.target?.replace('User_', '').replace('_key', '') || 'field';
    const message = `${
      field.charAt(0).toUpperCase() + field.slice(1)
    } already exists. Please use a different ${field}.`;

    formattedErrors[field] = message;

    return new AppError(message, 409, formattedErrors);
  }

  return new AppError('Database error occurred', 500);
};

const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
      ...(err.errors && { errors: err.errors }),
    });
  }

  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    message: err.message,
  });
};

const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(err.errors && { errors: err.errors }),
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    message: 'Please try again later.',
  });
};

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    console.log(err);

    if (
      err instanceof ZodError ||
      err.issues ||
      (Array.isArray(err) && err[0]?.path)
    ) {
      error = handleZodError(err);
    }

    if (err.code && err.code.startsWith('P')) {
      error = handlePrismaError(err);
    }

    if (error.name === 'JsonWebTokenError') {
      const message = 'Invalid token. Please log in again!';
      error = new AppError(message, 401);
    }

    if (error.name === 'TokenExpiredError') {
      const message = 'Your token has expired! Please log in again.';
      error = new AppError(message, 401);
    }

    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;
