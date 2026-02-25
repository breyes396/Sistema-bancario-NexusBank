import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

export const dbConnectionPostgres = async () => {
    try {
        if (!process.env.DB_NAME || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_HOST) {
            console.warn('Postgres connection env vars not fully set (DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST). Skipping Postgres connection.');
            return false;
        }

        await sequelize.authenticate();
        console.log('Connection to PostgreSQL established successfully.');
        await sequelize.sync({ alter: true }); // Automatically sync models with database
        console.log('PostgreSQL models synchronized.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the PostgreSQL database:', error);
        return false;
    }
}

export default sequelize;