import cors from 'cors';

// CORS middleware configuration for local development
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    // Add your local IP for mobile testing
    'http://192.168.1.*',
    // Allow Replit domains
    'https://*.replit.app',
    'https://*.repl.co'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

export default cors(corsOptions);