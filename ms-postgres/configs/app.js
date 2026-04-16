import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { validateBearerTokenSelective } from '../middlewares/auth-middleware.js';
import { globalErrorHandler, notFoundHandler } from '../middlewares/error-handler.js';
import { verifyTokenAndGetUser } from '../middlewares/role-middleware.js';
import { validateEditOwnProfile } from '../middlewares/profile-validations.js';
import { sendSuccess } from '../helpers/response.js';

import authRoutes from '../src/auth/auth.routes.js';
import accountRoutes from '../src/account/account.routes.js';
import depositRoutes from '../src/deposit/deposit.routes.js';
import transactionRoutes from '../src/transaction/transaction.routes.js';
import userRoutes from '../src/user/user.routes.js';
import { editOwnProfile } from '../src/user/user.controller.js';

export const BASE_PATH = '/nexusBank/v1';

const PUBLIC_PATHS = [
  `${BASE_PATH}/health`,
  `${BASE_PATH}/auth/login`,
  `${BASE_PATH}/auth/verify-email`,
  `${BASE_PATH}/auth/resend-verification`,
  `${BASE_PATH}/auth/forgot-password`,
  `${BASE_PATH}/auth/reset-password`
];

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(morgan('dev'));
  app.use(validateBearerTokenSelective(PUBLIC_PATHS));

  app.get(`${BASE_PATH}/health`, (_req, res) => {
    return sendSuccess(res, {
      status: 200,
      message: 'NexusBank Postgres service is healthy',
      data: { service: 'ms-postgres' }
    });
  });

  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}`, accountRoutes);
  app.use(`${BASE_PATH}`, depositRoutes);
  app.use(`${BASE_PATH}`, transactionRoutes);
  app.put(`${BASE_PATH}/profile/edit`, verifyTokenAndGetUser, validateEditOwnProfile, editOwnProfile);
  app.use(`${BASE_PATH}/user`, userRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
