import morgan from 'morgan';

// Custom token for response time with colors
morgan.token('colorized-status', (req, res) => {
  const status = res.statusCode;
  const color = status >= 500 ? '\x1b[31m' // Red
             : status >= 400 ? '\x1b[33m' // Yellow  
             : status >= 300 ? '\x1b[36m' // Cyan
             : '\x1b[32m'; // Green
  return `${color}${status}\x1b[0m`;
});

const logFormat = process.env.NODE_ENV === 'production'
  ? 'combined'
  : ':method :url :colorized-status :response-time ms - :res[content-length]';

export default function setupLogging(app) {
  app.use(morgan(logFormat, {
    skip: (req, res) => {
      // Skip logging for static assets in development
      return process.env.NODE_ENV === 'development' && 
             (req.url.includes('.js') || req.url.includes('.css') || req.url.includes('.map'));
    }
  }));
}