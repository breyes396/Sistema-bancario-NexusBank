'use strict';

import bcrypt from 'bcryptjs';
import { User, Admin, Role } from '../src/db/models/index.js';

export const createDefaultAdmin = async () => {
    try {
        const [roleAdmin] = await Role.findOrCreate({ where: { name: 'Admin' }, defaults: { description: 'System Administrator' } });
        const [roleClient] = await Role.findOrCreate({ where: { name: 'Client' }, defaults: { description: 'Bank Client' } });
        const [roleEmployee] = await Role.findOrCreate({ where: { name: 'Employee' }, defaults: { description: 'Bank Employee' } });

        // Admin defaults
        const adminEmail = 'admin@nexusbank.com';
        
        // Search in Admin table specifically
        let adminExists = await Admin.findOne({ where: { email: adminEmail } });

        if (adminExists) {
            console.log('✓ Usuario Admin ya existe en la base de datos (Tabla Admins)');
            return adminExists;
        }

        console.log('Creando usuario Admin por defecto...');

        const defaultAdmin = {
            name: 'ADMINB',
            email: adminEmail,
            password: 'ADMINB',
            phone: '+573001234567',
            status: true
        };

        const salt = await bcrypt.genSalt(10);
        defaultAdmin.password = await bcrypt.hash(defaultAdmin.password, salt);

        const adminCreated = await Admin.create(defaultAdmin);
        
        // Associate Role
        await adminCreated.addRole(roleAdmin);

        console.log('✓ Usuario Admin creado exitosamente en tabla Admins');
        console.log(`   Email: ${adminCreated.email}`);
        console.log(`   Contraseña inicial: ADMINB (cambiarla al primer acceso)`);

        return adminCreated;
    } catch (error) {
        console.error('Error al crear el usuario Admin:', error.message);
        return null;
    }
};
