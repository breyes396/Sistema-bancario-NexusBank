import dotenv from 'dotenv';
import { dbConnection } from './configs/db.js';
import { BASE_PATH, createApp } from './configs/app.js';

dotenv.config();

const PORT = process.env.MONGO_SERVICE_PORT || process.env.PORT || 3002;

const app = createApp();

const start = async () => {
  try {
    await dbConnection();

    app.listen(PORT, () => {
      console.log(`ms-mongo running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
    });
  } catch (error) {
    console.error(`Error starting ms-mongo: ${error.message}`);
    process.exit(1);
  }
};

start();
