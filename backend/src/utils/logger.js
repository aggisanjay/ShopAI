import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRequestContext } from './context.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'stripesecretkey',
  'stripewebhooksecret',
  'clientsecret',
  'creditcard',
  'cardnumber',
  'cvv',
  'cvc',
  'cookie',
  'set-cookie',
]);

export const redactSensitive = (obj, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 6) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitive(item, depth + 1));
  }
  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      redacted[key] = redactSensitive(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
};

// Formatter to inject context (requestId, traceId, userId) from AsyncLocalStorage
const injectContext = winston.format((info) => {
  const context = getRequestContext();
  if (context.requestId && !info.requestId) info.requestId = context.requestId;
  if (context.traceId && !info.traceId) info.traceId = context.traceId;
  if (context.userId && !info.userId) info.userId = context.userId;

  // Redact any sensitive metadata in the log object
  if (info.meta && typeof info.meta === 'object') {
    info.meta = redactSensitive(info.meta);
  }
  return info;
});

const isProduction = process.env.NODE_ENV === 'production';

// Development human-friendly formatter
const devFormat = winston.format.printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
  const reqStr = requestId ? `[${requestId.slice(0, 8)}] ` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(redactSensitive(meta))}` : '';
  return `${timestamp} [${level}]: ${reqStr}${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    injectContext()
  ),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format((info) => {
              // Ensure message is redacted if it's an object
              if (typeof info.message === 'object') {
                info.message = redactSensitive(info.message);
              }
              return info;
            })(),
            winston.format.json()
          )
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            devFormat
          ),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10485760,
      maxFiles: 5,
      format: winston.format.json(),
    }),
  ],
});

export default logger;
