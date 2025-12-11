import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { loginSchema, signupSchema } from '../validation/user.validation.js';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

const signToken = (id: string): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  const option: SignOptions = {
    expiresIn: expiresIn as unknown as SignOptions['expiresIn'],
  };

  return jwt.sign({ id }, process.env.JWT_SECRET as string, option);
};

export const createSendToken = (user: any, res: any) => {
  const token = signToken(user.id);

  const cookieOption = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOption);

  user.password = undefined;

  return { user, token };
};

export const signup = catchAsync(async (req, res, next) => {
  const validated = signupSchema.parse(req.body);

  const hashed = await hashPassword(validated.password);

  const userData = {
    name: validated.name,
    email: validated.email,
    password: hashed,
  };

  const newUser = await prisma.user.create({ data: userData });

  let { user, token } = createSendToken(newUser, res);

  res.status(201).json({
    status: 'success',
    message: 'Signup successfully',
    token: token,
    data: user,
  });
});

export const login = catchAsync(async (req, res, next) => {
  const validated = loginSchema.parse(req.body);

  const checkUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (!checkUser) return next(new AppError('Incorrect credentials', 401));

  const checkPassword = await comparePassword(
    validated.password,
    checkUser.password
  );

  if (!checkPassword) return next(new AppError('Incorrect credentials', 401));

  let { user, token } = createSendToken(checkUser, res);

  res.status(200).json({
    status: 'success',
    message: 'Login successfully',
    token: token,
    data: user,
  });
});

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};
