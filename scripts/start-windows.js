// Windows-specific server startup script
import 'dotenv/config';
import { spawn } from 'child_process';

console.log('Starting LeviatanCode on Windows...');
console.log('Port: 5005');
console.log('Environment: development');

// Set environment variables for Windows
process.env.NODE_ENV = 'development';
process.env.PORT = '5005';

// Start the server with Windows-specific configuration
const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        PORT: '5005',
        NODE_ENV: 'development'
    }
});

server.on('error', (error) => {
    console.error('[FAIL] Server failed to start:', error.message);
    process.exit(1);
});

server.on('close', (code) => {
    console.log(`[INFO] Server exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('[INFO] Shutting down server...');
    server.kill();
});