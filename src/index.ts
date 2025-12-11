import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import globalErrorHandler from './controllers/errorController.js';
import indexRouter from './routes/indexRoutes.js';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://task-management-frontend-nine.vercel.app',
    ],
    credentials: true,
  })
);

app.get('/', (req, res) => {
  return res.send('Hello, World!');
});

// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   statusCode: 429,

//   handler: (req, res) => {
//     res.status(429).json({
//       status: 'fail',
//       message: 'Too many requests from this IP, please try again in an hour!',
//     });
//   },
// });

// app.use('/api', limiter);

app.use('/api/v1', indexRouter);

app.use(globalErrorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
