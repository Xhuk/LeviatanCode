import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Security middleware for production and local development
const securityMiddleware = (app) => {
  // Basic security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // File upload rate limiting
  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit file uploads
    message: 'Too many file uploads, please try again later.',
  });

  app.use('/api/projects/import/', uploadLimiter);
};

export default securityMiddleware;