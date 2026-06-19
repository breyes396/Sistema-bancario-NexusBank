export const withTimeout = async (promise, timeoutMs, timeoutMessage = 'Tiempo de espera agotado') => {
    let timer = null;

    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

export const getJsonByteSize = (value) => {
    try {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch (_error) {
        return 0;
    }
};
