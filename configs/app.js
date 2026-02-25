'use strict';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { dbConnection } from './db.js';
import { dbConnectionPostgres } from './postgres-db.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { validateBearerTokenSelective } from '../middlewares/auth-middleware.js';
import { createDefaultAdmin } from '../helpers/create-default-admin.js';
import clientRoutes from '../src/Client/client.routes.js';
import productRoutes from '../src/Catalog/product.routes.js';
import postRoutes from '../src/transferencia/transfer.routes.js';
import adminRoutes from '../src/admin/admin.routes.js';

const BASE_PATH = '/nexusBank/v1';

const PUBLIC_PATHS = [
    `${BASE_PATH}/health`,
    `${BASE_PATH}/client/login`,
    `${BASE_PATH}/auth/login`,
    `${BASE_PATH}/auth/register`,
    /^\/nexusBank\/v1\/catalog\/get/,
    /^\/nexusBank\/v1\/catalog\/category\//,
    /^\/nexusBank\/v1\/catalog\/[a-f0-9]{24}$/
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
    app.use(`${BASE_PATH}/client`, clientRoutes);
    app.use(`${BASE_PATH}/catalog`, productRoutes);
    app.use(`${BASE_PATH}`, postRoutes);
    app.use(`${BASE_PATH}/admin`, adminRoutes);

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
    app.set('trus proxy', 1);

    try {
        const mongoConnected = await dbConnection();
        const postgresConnected = await dbConnectionPostgres();

        // Only create default admin if Postgres is available (Sequelize models depend on Postgres)
        if (postgresConnected) {
            await createDefaultAdmin();
        } else {
            console.warn('Skipping createDefaultAdmin because Postgres is not connected.');
        }
        middlewares(app);
        routes(app);

        app.listen(PORT, ()=> {
            console.log(`NexusBank server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
        })
    } catch (error) {
        console.error(`Error starting Admin Server: ${error.message}`);
        process.exit(1);
    }
}