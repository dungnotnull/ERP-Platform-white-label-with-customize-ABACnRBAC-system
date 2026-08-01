export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  mongodb: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.DB_NAME || 'dym_management',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '24h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
    frontendCallbackUrl: process.env.FRONTEND_CALLBACK_URL || '',
  },
  corsOrigins: process.env.CORS_ORIGINS || '',
  mongodbLogSystem: {
    uri: process.env.MONGODB_URI_FOR_LOG_SYSTEM || '',
    dbName: process.env.DB_NAME_LOG_SYS || 'log_system_dym_management',
  },
  redis: {
    host: process.env.REDIS_HOST || '',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
  },
  systemDeleteSecret: process.env.SYSTEM_DELETE_SECRET || '',
  systemCreateSuperadminSecret: process.env.SYSTEM_CREATE_SUPERADMIN_SECRET || '',
});
