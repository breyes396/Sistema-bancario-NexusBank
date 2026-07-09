'use strict';

import config from '../configs/config.js';

const normalizeCurrency = (value) => (value || '').trim().toUpperCase();

export const getExchangeRate = async (targetCurrency) => {
    const baseCurrency = normalizeCurrency(config.fx.baseCurrency || 'GTQ');
    const normalizedTarget = normalizeCurrency(targetCurrency);

    if (!normalizedTarget) {
        throw new Error('Moneda de destino requerida');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.fx.timeoutMs || 5000);

    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
            signal: controller.signal
        });

        if (!response.ok) {
            let errorText = '';
            try { errorText = await response.text(); } catch(e) {}
            throw new Error(`Error en API FX: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const rate = data?.rates?.[normalizedTarget];

        if (rate === undefined || rate === null) {
            throw new Error('Moneda no soportada por la API');
        }

        return {
            baseCurrency,
            targetCurrency: normalizedTarget,
            rate,
            rateTimestamp: new Date().toISOString()
        };
    } catch (err) {
        throw new Error(`Error de FX: ${err.message}`);
    } finally {
        clearTimeout(timeoutId);
    }
};
