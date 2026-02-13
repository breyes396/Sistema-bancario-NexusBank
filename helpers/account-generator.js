'use strict';

import Client from '../src/Client/client.model.js';

export const generateAccountNumber = async () => {
    let accountNumber;
    let exists = true;

    while (exists) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const client = await Client.findOne({ accountNumber });
        if (!client) exists = false;
    }

    return accountNumber;
};