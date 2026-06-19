import dotenv from 'dotenv';
import dns from 'dns';
import sequelize, { dbConnection } from './configs/db.js';
import { initializeAssociations } from './helpers/model-associations.js';
import { createDefaultAdmin } from './helpers/create-default-admin.js';
import { createDefaultEmployee } from './helpers/create-default-employee.js';
import { BASE_PATH, createApp } from './configs/app.js';

dotenv.config();

// Prefer IPv4 resolution to avoid ENETUNREACH when host/system has no IPv6 route
if (typeof dns.setDefaultResultOrder === 'function') {
  try {
    dns.setDefaultResultOrder('ipv4first');
    console.log('DNS resolution order set to ipv4first');
  } catch (e) {
    console.warn('Could not set DNS resolution order:', e && e.message ? e.message : e);
  }
}

const PORT = process.env.POSTGRES_SERVICE_PORT || process.env.PORT || 3001;

const app = createApp();

const start = async () => {
  try {
    initializeAssociations();

    const syncOptions = process.env.DB_FORCE_SYNC === 'true' ? { force: true } : { alter: true };
    await sequelize.sync(syncOptions);

    await dbConnection();

    await createDefaultAdmin();
    await createDefaultEmployee();

    app.listen(PORT, () => {
      console.log(`ms-postgres running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(`Error starting ms-postgres: ${error.message}`);
    process.exit(1);
  }
};

start();
