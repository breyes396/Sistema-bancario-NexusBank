'use strict';

import Client from './client.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';

export const registerClient = async (req, res) => {
    try {
        const { income } = req.body;

        if (income < 100) {
            return res.status(400).json({
                success: false,
                message: 'El ingreso debe ser mayor o igual a 100'
            });
        }

        const accountNumber = await generateAccountNumber();

        const client = new Client({
            ...req.body,
            accountNumber
        });

        await client.save();

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            data: client
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar cliente',
            error: error.message
        });
    }
};