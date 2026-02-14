'use strict';

import bcrypt from 'bcryptjs';
import Client from '../src/Client/client.model.js';

export const createDefaultAdmin = async () => {
    try {
        const adminExists = await Client.findOne({ role: 'Admin' });

        if (adminExists) {
            console.log('✓ Usuario Admin ya existe en la base de datos');
            return adminExists;
        }

        const defaultAdmin = {
            name: 'Admin NexusBank',
            email: 'admin@nexusbank.com',
            password: 'Admin123',
            phone: '+573001234567',
            role: 'Admin',
            income: 0,
            documentType: 'CC',
            documentNumber: '1234567890',
            isActive: true
        };

        const salt = await bcrypt.genSalt(10);
        defaultAdmin.password = await bcrypt.hash(defaultAdmin.password, salt);

        const adminCreated = await Client.create(defaultAdmin);

        console.log('✓ Usuario Admin creado exitosamente');
        console.log(`   Email: ${adminCreated.email}`);
        console.log(`   Contraseña inicial: Admin123 (cambiarla al primer acceso)`);

        return adminCreated;
    } catch (error) {
        console.error('Error al crear el usuario Admin:', error.message);
        return null;
    }
};
