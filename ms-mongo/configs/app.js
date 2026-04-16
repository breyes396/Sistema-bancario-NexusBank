import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { validateBearerTokenSelective } from '../middlewares/auth-middleware.js';
import { globalErrorHandler, notFoundHandler } from '../middlewares/error-handler.js';
import { sendSuccess } from '../helpers/response.js';

import catalogRoutes from '../src/catalog/catalog.routes.js';
import favoriteRoutes from '../src/favorite/favorite.routes.js';
import securityRoutes from '../src/security/security.routes.js';

export const BASE_PATH = '/nexusBank/v1';

const PUBLIC_PATHS = [
  `${BASE_PATH}/health`,
  `${BASE_PATH}/catalog`
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
      message: 'NexusBank Mongo service is healthy',
      data: { service: 'ms-mongo' }
    });
  });

  app.use(`${BASE_PATH}/catalog`, catalogRoutes);
  app.use(`${BASE_PATH}`, favoriteRoutes);
  app.use(`${BASE_PATH}`, securityRoutes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
