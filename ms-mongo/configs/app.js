import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { swaggerOptions as mongoSwaggerOptions } from './swagger-configuration.js';
import { swaggerOptions as postgresSwaggerOptions } from '../../ms-postgres/configs/swagger-configuration.js';
import { validateBearerTokenSelective } from '../middlewares/auth-middleware.js';
import { globalErrorHandler, notFoundHandler } from '../middlewares/error-handler.js';
import { sendSuccess } from '../helpers/response.js';

import catalogRoutes from '../src/catalog/catalog.routes.js';
import favoriteRoutes from '../src/favorite/favorite.routes.js';
import securityRoutes from '../src/security/security.routes.js';

export const BASE_PATH = '/api/v1';

const PUBLIC_PATHS = [
  `${BASE_PATH}/health`,
  `${BASE_PATH}/catalog`
];

export const createApp = () => {
  const app = express();
  const mongoSwaggerSpec = swaggerJSDoc(mongoSwaggerOptions);
  const postgresSwaggerSpec = swaggerJSDoc(postgresSwaggerOptions);
  app.set('trust proxy', 1);

  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(morgan('dev'));
  app.get('/api-docs/spec/mongo.json', (_req, res) => {
    return res.json(mongoSwaggerSpec);
  });
  app.get('/api-docs/spec/postgres.json', (_req, res) => {
    return res.json(postgresSwaggerSpec);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      explorer: true,
      swaggerOptions: {
        urls: [
          { url: '/api-docs/spec/mongo.json', name: 'Mongo' },
          { url: '/api-docs/spec/postgres.json', name: 'Postgre' }
        ],
        'urls.primaryName': 'Mongo'
      }
    })
  );
  app.use(validateBearerTokenSelective(PUBLIC_PATHS));

  app.get(`${BASE_PATH}/health`, (_req, res) => {
    return sendSuccess(res, {
      status: 200,
      message: 'API Mongo service is healthy',
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
