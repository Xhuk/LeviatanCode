// PM2 Configuration for DataScraper Pro
// Use this for production deployment on Windows Server

module.exports = {
  apps: [
    {
      name: 'datascraper-pro',
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx',
      instances: 1, // Set to 'max' for cluster mode
      exec_mode: 'fork', // or 'cluster' for cluster mode
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart configuration
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', 'temp'],
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory and CPU limits
      max_memory_restart: '500M',
      
      // Windows-specific configuration
      windowsHide: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_interval: 30000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      shutdown_with_message: false,
      
      // Advanced options
      merge_logs: true,
      time: true,
      
      // Custom startup script (optional)
      // script: './scripts/start-production.js',
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'administrator',
      host: 'your-windows-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/datascraper-pro.git',
      path: 'C:\\Apps\\datascraper-pro',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};