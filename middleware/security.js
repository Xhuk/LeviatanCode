import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for local development
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.includes('localhost'));
  }
});

export default function setupSecurity(app) {
  // For development - disable CSP to allow Vite HMR
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production CSP - restrictive security
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'", "https:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
  } else {
    // Development mode - disable CSP for Vite compatibility
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP in development
      crossOriginEmbedderPolicy: false,
    }));
    console.log('[INFO] CSP disabled for development mode');
  }

  // Apply rate limiting
  app.use('/api/', limiter);
  
  // Trust proxy for rate limiting to work properly
  app.set('trust proxy', 1);
}