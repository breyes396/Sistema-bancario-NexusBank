import dotenv from 'dotenv';
import dns from 'dns';
import { dbConnection } from './configs/db.js';
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

const PORT = process.env.MONGO_SERVICE_PORT || process.env.PORT || 3002;

const app = createApp();

const start = async () => {
  try {
    await dbConnection();

    app.listen(PORT, () => {
      console.log(`ms-mongo running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(`Error starting ms-mongo: ${error.message}`);
    process.exit(1);
  }
};

start();
