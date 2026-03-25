'use strict';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { validateBearerTokenSelective } from '../middlewares/auth-middleware.js';
import sequelize, { dbConnection } from './db.js';
import { initializeAssociations } from '../helpers/model-associations.js';
import authRoutes from '../src/auth/auth.routes.js';
import accountRoutes from '../src/account/account.routes.js';
import userRoutes from '../src/user/user.routes.js';
import catalogRoutes from '../src/catalog/catalog.routes.js';
import favoriteRoutes from '../src/favorite/favorite.routes.js';
import { createDefaultAdmin } from '../helpers/create-default-admin.js';

import { editOwnProfile } from '../src/user/user.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../middlewares/role-middleware.js';
import { validateEditOwnProfile } from '../middlewares/profile-validations.js';


const BASE_PATH = '/nexusBank/v1';

const PUBLIC_PATHS = [
    `${BASE_PATH}/health`,
    `${BASE_PATH}/auth/login`,
    `${BASE_PATH}/auth/verify-email`,
    `${BASE_PATH}/auth/resend-verification`,
    `${BASE_PATH}/auth/forgot-password`,
    `${BASE_PATH}/auth/reset-password`,
    `${BASE_PATH}/catalog`
];

const middlewares = (app) => {
    app.use(express.urlencoded({extended: false, limit: '10mb'}));
    app.use(express.json({limit: '10mb'}));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(morgan('dev'));
    app.use(validateBearerTokenSelective(PUBLIC_PATHS));
}

const routes = (app) => {
    app.get(`${BASE_PATH}/health`, (req, res) => {
        res.status(200).json({
            success: true,
            message: 'NexusBank API is healthy',
            timestamp: new Date().toISOString()
        });
    });

    app.use(`${BASE_PATH}/auth`, authRoutes);
    app.use(`${BASE_PATH}`, accountRoutes);
    app.put(`${BASE_PATH}/profile/edit`, verifyTokenAndGetUser, validateEditOwnProfile, editOwnProfile);
    app.use(`${BASE_PATH}/user`, userRoutes);
    app.use(`${BASE_PATH}/users`, userRoutes);
    app.use(`${BASE_PATH}/catalog`, catalogRoutes);
    app.use(`${BASE_PATH}`, favoriteRoutes);
    app.use((req, res) =>{
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado en Api'
        })
    })
}

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;
    app.set('trust proxy', 1);

    try {
        initializeAssociations();

        const syncOptions = process.env.DB_FORCE_SYNC === 'true' 
            ? { force: true } 
            : { alter: true };
        
        await sequelize.sync(syncOptions);
        console.log(`Database synced with options:`, syncOptions);

        await dbConnection();
        
        await createDefaultAdmin();
        middlewares(app);
        routes(app);

        app.listen(PORT, ()=> {
            console.log(`NexusBank server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
        })
    } catch (error) {
        console.error(`Error starting Server: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}