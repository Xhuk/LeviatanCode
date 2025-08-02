// Setup Middleware Script
// This script configures all middleware and security for LeviatanCode

const fs = require('fs');
const path = require('path');

function setupMiddleware() {
    console.log('🛡️ Setting up middleware and security...');
    
    const middlewareContent = `
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { neon } from '@neondatabase/serverless';

const PgSession = ConnectPgSimple(session);

export function setupMiddleware(app: express.Express) {
    // Trust proxy for rate limiting in production
    app.set('trust proxy', 1);
    
    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-eval'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "wss:", "ws:"],
            },
        },
        crossOriginEmbedderPolicy: false
    }));
    
    // CORS configuration
    app.use(cors({
        origin: process.env.NODE_ENV === 'production' 
            ? ['http://localhost:5000'] 
            : true,
        credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for static files
            return req.url.startsWith('/src/') || req.url.startsWith('/node_modules/');
        }
    });
    
    app.use('/api/', limiter);
    
    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Session configuration
    if (process.env.DATABASE_URL) {
        const sql = neon(process.env.DATABASE_URL);
        
        app.use(session({
            store: new PgSession({
                pool: sql as any,
                tableName: 'user_sessions',
                createTableIfMissing: true
            }),
            secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            },
            name: 'leviatan.sid'
        }));
    } else {
        // Fallback to memory store for development
        app.use(session({
            secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false,
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            }
        }));
    }
    
    // Request logging
    app.use((req, res, next) => {
        if (!req.url.startsWith('/src/') && !req.url.startsWith('/node_modules/')) {
            console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
        }
        next();
    });
    
    console.log('✅ Middleware configured successfully');
}

export function setupErrorHandling(app: express.Express) {
    // Global error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error('Global error handler:', err);
        
        if (res.headersSent) {
            return next(err);
        }
        
        const statusCode = err.statusCode || err.status || 500;
        const message = process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message;
            
        res.status(statusCode).json({
            error: message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        });
    });
    
    // 404 handler
    app.use('*', (req, res) => {
        if (req.originalUrl.startsWith('/api/')) {
            res.status(404).json({ error: 'API endpoint not found' });
        } else {
            // Serve index.html for client-side routing
            res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
        }
    });
    
    console.log('✅ Error handling configured');
}
`;

    // Write middleware file
    const serverDir = path.join(process.cwd(), 'server');
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(serverDir, 'middleware.ts'), middlewareContent);
    console.log('✅ Middleware setup completed');
    
    return true;
}

setupMiddleware();