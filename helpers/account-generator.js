'use strict';

import { Account } from '../src/account/account.model.js';

const calculateCheckDigit = (accountBase) => {
    const digits = accountBase.replace(/-/g, '');
    let sum = 0;
    let weight = 2;

    for (let i = digits.length - 1; i >= 0; i--) {
        sum += parseInt(digits[i]) * weight;
        weight = weight === 7 ? 2 : weight + 1;
    }

    const remainder = sum % 11;
    const checkDigit = 11 - remainder;

    if (checkDigit === 11) return '0';
    if (checkDigit === 10) return '1'; 
    return checkDigit.toString();
};

const getAccountTypeCode = (accountType = 'ahorro') => {
    const typeCodes = {
        'ahorro': '001',
        'corriente': '002',
        'monetaria': '003',
        'plazo': '004'
    };
    return typeCodes[accountType.toLowerCase()] || '001';
};

export const generateAccountNumber = async (accountType = 'ahorro') => {
    let accountNumber;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 100;

    while (exists && attempts < maxAttempts) {
        attempts++;

        const typeCode = getAccountTypeCode(accountType);

        const sequential = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        const accountBase = `${typeCode}${sequential}`;

        const checkDigit = calculateCheckDigit(accountBase);

        accountNumber = `${typeCode}-${sequential}-${checkDigit}`;

        const account = await Account.findOne({ where: { accountNumber } });
        if (!account) exists = false;
    }

    if (attempts >= maxAttempts) {
        throw new Error('No se pudo generar un número de cuenta único después de múltiples intentos');
    }

    return accountNumber;
};