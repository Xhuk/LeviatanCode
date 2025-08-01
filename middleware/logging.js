import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Custom token for response time in different colors
morgan.token('colored-response-time', (req, res) => {
  const responseTime = morgan['response-time'](req, res);
  const time = parseFloat(responseTime);
  
  if (time < 100) return `\x1b[32m${responseTime}ms\x1b[0m`; // Green
  if (time < 500) return `\x1b[33m${responseTime}ms\x1b[0m`; // Yellow
  return `\x1b[31m${responseTime}ms\x1b[0m`; // Red
});

// Custom token for status code colors
morgan.token('colored-status', (req, res) => {
  const status = res.statusCode;
  
  if (status >= 200 && status < 300) return `\x1b[32m${status}\x1b[0m`; // Green
  if (status >= 300 && status < 400) return `\x1b[36m${status}\x1b[0m`; // Cyan
  if (status >= 400 && status < 500) return `\x1b[33m${status}\x1b[0m`; // Yellow
  return `\x1b[31m${status}\x1b[0m`; // Red
});

// Development logging format
const devFormat = ':method :url :colored-status :colored-response-time - :res[content-length]';

// Production logging format
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const loggingMiddleware = (app) => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Log to file and console
    app.use(morgan(prodFormat, { stream: accessLogStream }));
    app.use(morgan('combined'));
  } else {
    // Development: Colorful console logging
    app.use(morgan(devFormat));
  }
};

export default loggingMiddleware;