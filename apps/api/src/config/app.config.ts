import * as Joi from 'joi';

export const appConfig = () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },
  auth: {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
  encryption: {
    aadhaarKey: process.env.AADHAAR_ENCRYPTION_KEY,
    aadhaarIv: process.env.AADHAAR_ENCRYPTION_IV,
    totpKey: process.env.TOTP_ENCRYPTION_KEY,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucketName: process.env.S3_BUCKET_NAME ?? 'mvhs-erp-dev',
    region: process.env.S3_REGION ?? 'ap-south-1',
    publicUrl: process.env.S3_PUBLIC_URL,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.SMTP_FROM_NAME ?? 'MVHS School ERP',
    fromEmail: process.env.SMTP_FROM_EMAIL,
  },
  cors: {
    clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  },
  upload: {
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES ?? '5242880', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,application/pdf').split(','),
  },
  rateLimit: {
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '10', 10),
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? '60000', 10),
    apiMax: parseInt(process.env.RATE_LIMIT_API_MAX ?? '300', 10),
    apiWindowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS ?? '60000', 10),
  },
  login: {
    maxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? '5', 10),
    lockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? '30', 10),
  },
  seed: {
    allowReset: process.env.ALLOW_DB_SEED_RESET === 'true',
  },
});

export const validationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  CLIENT_ORIGIN: Joi.string().default('http://localhost:3000'),
}).unknown(true);
