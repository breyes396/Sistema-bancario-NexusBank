'use strict';

import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

export const dbConnection = async () => {
    try {
        if (!process.env.URI_MONGO) {
            console.warn('MongoDB URI not set (URI_MONGO). Skipping MongoDB connection.');
            return false;
        }
        mongoose.connection.on('error', () => {
            console.log('MongoDB | no se pudo conectar a mongoDB');
            mongoose.disconnect();
        });
        mongoose.connection.on('connecting', () => {
            console.log('MongoDB | intentando conectar a mongoDB');
        });
        mongoose.connection.on('connected', () => {
            console.log('MongoDB | conectado a mongoDB');
        });
        mongoose.connection.on('open', () => {
            console.log('MongoDB | conectado a la base de datos NexusBank');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB | reconectando a mongoDB');
        });
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB | desconectando a mongoDB');
        });

        await mongoose.connect(process.env.URI_MONGO, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10
        })
        return true;
    } catch (error) {
        console.log(`Error al conectar la db: ${error}`);
        return false;
    }
}

const gracefulShutdown = async (signal) => {
    console.log(`MongoDB | Received ${signal}. Closing database connection...`);
    try {
        await mongoose.connection.close();
        console.log('MongoDB | Database connection closed successfully');
        process.exit(0);
    } catch (error) {
        console.error('MongoDB | Error during graceful shutdown:', error.message);
        process.exit(1);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));