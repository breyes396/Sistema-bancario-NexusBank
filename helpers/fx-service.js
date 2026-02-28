'use strict';

import config from '../configs/config.js';

const normalizeCurrency = (value) => (value || '').trim().toUpperCase();

const buildFxUrl = (baseCurrency, targetCurrency) => {
    const baseUrl = config.fx.apiBaseUrl;
    const apiKey = config.fx.apiKey;

    if (!apiKey) {
        throw new Error('FX_API_KEY no configurada');
    }

    return `${baseUrl}/fetch-one?from=${baseCurrency}&to=${targetCurrency}`;
};

const parseRateFromResponse = (data, targetCurrency) => {
    if (data?.result && data.result[targetCurrency] !== undefined) {
        return data.result[targetCurrency];
    }
    if (data?.rates && data.rates[targetCurrency] !== undefined) {
        return data.rates[targetCurrency];
    }
    return null;
};

const parseTimestampFromResponse = (data) => {
    if (data?.updated) {
        return new Date(data.updated).toISOString();
    }
    if (data?.timestamp) {
        return new Date(data.timestamp * 1000).toISOString();
    }
    return new Date().toISOString();
};

export const getExchangeRate = async (targetCurrency) => {
    const baseCurrency = normalizeCurrency(config.fx.baseCurrency);
    const normalizedTarget = normalizeCurrency(targetCurrency);

    if (!normalizedTarget) {
        throw new Error('Moneda de destino requerida');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.fx.timeoutMs);

    try {
        const url = buildFxUrl(baseCurrency, normalizedTarget);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'X-API-Key': config.fx.apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Error en API FX: ${response.status}`);
        }

        const data = await response.json();
        const rate = parseRateFromResponse(data, normalizedTarget);

        if (rate === null) {
            throw new Error('Moneda no soportada por la API');
        }

        return {
            baseCurrency,
            targetCurrency: normalizedTarget,
            rate,
            rateTimestamp: parseTimestampFromResponse(data)
        };
    } finally {
        clearTimeout(timeoutId);
    }
};
