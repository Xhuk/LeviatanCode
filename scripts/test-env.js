import 'dotenv/config';

console.log('Environment Variables Test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Platform:', process.platform);
console.log('Working Directory:', process.cwd());

// Check .env file exists
import { existsSync } from 'fs';
console.log('.env file exists:', existsSync('.env'));

// List all environment variables starting with PORT
Object.keys(process.env).forEach(key => {
  if (key.includes('PORT') || key === 'DATABASE_URL') {
    console.log(`${key}:`, process.env[key]);
  }
});