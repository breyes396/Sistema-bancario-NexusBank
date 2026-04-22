import dotenv from 'dotenv';
import sequelize, { dbConnection } from './configs/db.js';
import { initializeAssociations } from './helpers/model-associations.js';
import { createDefaultAdmin } from './helpers/create-default-admin.js';
import { BASE_PATH, createApp } from './configs/app.js';

dotenv.config();

const PORT = process.env.POSTGRES_SERVICE_PORT || process.env.PORT || 3001;

const app = createApp();

const start = async () => {
  try {
    initializeAssociations();

    const syncOptions = process.env.DB_FORCE_SYNC === 'true' ? { force: true } : { alter: true };
    await sequelize.sync(syncOptions);

    await dbConnection();

    await createDefaultAdmin();

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
