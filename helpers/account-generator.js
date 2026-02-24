'use strict';

import { Account } from '../src/db/models/index.js';

export const generateAccountNumber = async () => {
    let accountNumber;
    let exists = true;

    while (exists) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const account = await Account.findOne({ where: { accountNumber } });
        if (!account) exists = false;
    }

    return accountNumber;
};