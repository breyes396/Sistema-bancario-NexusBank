import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { swaggerOptions as postgresSwaggerOptions } from './swagger-configuration.js';
import { swaggerOptions as mongoSwaggerOptions } from '../../ms-mongo/configs/swagger-configuration.js';
import { validateBearerTokenSelective } from '../middlewares/auth-middleware.js';
import { globalErrorHandler, notFoundHandler } from '../middlewares/error-handler.js';
import { verifyTokenAndGetUser } from '../middlewares/role-middleware.js';
import { validateEditOwnProfile } from '../middlewares/profile-validations.js';
import { sendSuccess } from '../helpers/response.js';

import authRoutes from '../src/auth/auth.routes.js';
import accountRoutes from '../src/account/account.routes.js';
import notificationRoutes from '../src/notifications/notification.routes.js';
import depositRoutes from '../src/deposit/deposit.routes.js';
import depositEmployeeRoutes from '../src/deposit/depositEmployee.routes.js';
import transactionRoutes from '../src/transaction/transaction.routes.js';
import userRoutes from '../src/user/user.routes.js';
import { editOwnProfile } from '../src/user/user.controller.js';
import { sendEmail } from '../services/email.service.js';

export const BASE_PATH = '/api/v1';

const PUBLIC_PATHS = [
  `${BASE_PATH}/health`,
  `${BASE_PATH}/auth/login`,
  `${BASE_PATH}/auth/register`,
  `${BASE_PATH}/auth/verify-email`,
  `${BASE_PATH}/auth/resend-verification`,
  `${BASE_PATH}/auth/forgot-password`,
  `${BASE_PATH}/auth/reset-password`
  ,
  `${BASE_PATH}/internal/test-email`
];

export const createApp = () => {
  const app = express();
  const postgresSwaggerSpec = swaggerJSDoc(postgresSwaggerOptions);
  const mongoSwaggerSpec = swaggerJSDoc(mongoSwaggerOptions);
  app.set('trust proxy', 1);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(morgan('dev'));
  
  // Servir archivos estáticos de uploads
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.get('/api-docs/spec/postgres.json', (_req, res) => {
    return res.json(postgresSwaggerSpec);
  });
  app.get('/api-docs/spec/mongo.json', (_req, res) => {
    return res.json(mongoSwaggerSpec);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      explorer: true,
      swaggerOptions: {
        urls: [
          { url: '/api-docs/spec/postgres.json', name: 'Postgre' },
          { url: '/api-docs/spec/mongo.json', name: 'Mongo' }
        ],
        'urls.primaryName': 'Postgre'
      }
    })
  );
  app.use(validateBearerTokenSelective(PUBLIC_PATHS));

  app.get(`${BASE_PATH}/health`, (_req, res) => {
    return sendSuccess(res, {
      status: 200,
      message: 'API Postgres service is healthy',
      data: { service: 'ms-postgres' }
    });
  });

  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}`, accountRoutes);
  app.use(`${BASE_PATH}`, notificationRoutes);
  app.use(`${BASE_PATH}`, depositRoutes);
  app.use(`${BASE_PATH}`, depositEmployeeRoutes);
  app.use(`${BASE_PATH}`, transactionRoutes);
  app.put(`${BASE_PATH}/profile/edit`, verifyTokenAndGetUser, validateEditOwnProfile, editOwnProfile);
  app.use(`${BASE_PATH}/user`, userRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);

  // Endpoint interno para probar envío de correo
  app.post(`${BASE_PATH}/internal/test-email`, async (req, res) => {
    try {
      const to = req.body?.to || process.env.DEV_TEST_EMAIL || process.env.SMTP_USERNAME;
      const subject = req.body?.subject || 'NexusBank - Test Email';
      const html = req.body?.html || `<p>Prueba de correo desde ms-postgres: ${new Date().toISOString()}</p>`;
      const result = await sendEmail(to, subject, html);
      if (result && result.success) return sendSuccess(res, { status: 200, message: 'Email enviado (test)', data: result });
      return res.status(502).json({ success: false, message: 'Fallo enviando email', error: result && result.error });
    } catch (err) {
      console.error('Error endpoint test-email:', err);
      return res.status(500).json({ success: false, message: 'Error interno', error: err.message });
    }
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
