import session from 'express-session';
import MemoryStoreFactory from 'memorystore';
const MemoryStore = MemoryStoreFactory(session);

// Session middleware configuration
const sessionMiddleware = session({
  store: new MemoryStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'leviatancode.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  rolling: true // Reset expiration on each request
});

export default sessionMiddleware;