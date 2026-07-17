
export default {
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || 'default-secret'}-refresh`,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  transfers: {
    maxAmount: Number(process.env.MAX_TRANSFER_AMOUNT || 2000),
    maxDailyAmountBySource: Number(process.env.MAX_DAILY_TRANSFER_BY_SOURCE || 10000),
    maxDailyAmountByDestination: Number(process.env.MAX_DAILY_TRANSFER_BY_DESTINATION || 2000)
  },
  fx: {
    baseCurrency: process.env.FX_BASE_CURRENCY || 'GTQ',
    timeoutMs: Number(process.env.FX_TIMEOUT_MS || 5000)
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.SMTP_USERNAME
  },
  frontendUrl: process.env.FRONTEND_URL || 'https://sistema-bancario-nexusbank.onrender.com'
};
