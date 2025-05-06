import winston, { format } from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Custom format
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.printf((info: winston.Logform.TransformableInfo) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Console format with colors
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  customFormat
);

// Define transports
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: customFormat,
  }),
  new winston.transports.File({
    filename: path.join('logs', 'all.log'),
    format: customFormat,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports,
});

export default logger; 