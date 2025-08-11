/**
 * Color-coded logging utility for LeviatanCode
 * Provides different colors for different AI services and log levels
 */

// ANSI color codes for terminal output
const colors = {
  // Reset
  reset: '\x1b[0m',
  
  // Log levels
  error: '\x1b[31m',    // Red
  warn: '\x1b[33m',     // Yellow
  info: '\x1b[37m',     // White
  
  // AI Services
  chatgpt: '\x1b[32m',   // Green
  gemini: '\x1b[34m',    // Blue
  ollama: '\x1b[35m',    // Magenta
  flask: '\x1b[36m',     // Cyan
  
  // System components
  system: '\x1b[90m',    // Gray
  database: '\x1b[96m',  // Bright Cyan
  middleware: '\x1b[93m' // Bright Yellow
};

export interface LogOptions {
  service?: 'chatgpt' | 'gemini' | 'ollama' | 'flask' | 'system' | 'database' | 'middleware';
  level?: 'info' | 'warn' | 'error';
  timestamp?: boolean;
}

export class ColorLogger {
  private static getServiceIcon(service: string): string {
    switch (service) {
      case 'chatgpt': return '🤖';
      case 'gemini': return '✨';
      case 'ollama': return '🦙';
      case 'flask': return '🐍';
      case 'database': return '🗄️';
      case 'middleware': return '⚙️';
      case 'system': return '🔧';
      default: return '📝';
    }
  }

  private static getServicePrefix(service: string): string {
    switch (service) {
      case 'chatgpt': return '[ChatGPT]';
      case 'gemini': return '[Gemini]';
      case 'ollama': return '[Ollama]';
      case 'flask': return '[Flask]';
      case 'database': return '[Database]';
      case 'middleware': return '[Middleware]';
      case 'system': return '[System]';
      default: return '[App]';
    }
  }

  static log(message: string, options: LogOptions = {}): void {
    const {
      service = 'system',
      level = 'info',
      timestamp = true
    } = options;

    // Get colors based on level and service
    let colorCode = colors.info; // Default white
    
    // Level colors take priority for warnings and errors
    if (level === 'warn') {
      colorCode = colors.warn; // Yellow
    } else if (level === 'error') {
      colorCode = colors.error; // Red
    } else if (service && colors[service]) {
      // Use service color for info level
      colorCode = colors[service];
    }

    // Build log message
    let logMessage = '';
    
    if (timestamp) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      logMessage += `${timeStr} `;
    }

    // Add service icon and prefix
    const icon = this.getServiceIcon(service);
    const prefix = this.getServicePrefix(service);
    
    logMessage += `${icon} ${prefix} ${message}`;

    // Apply color and output
    console.log(`${colorCode}${logMessage}${colors.reset}`);
  }

  // Convenience methods for different services
  static chatgpt(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'chatgpt', level });
  }

  static gemini(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'gemini', level });
  }

  static ollama(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'ollama', level });
  }

  static flask(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'flask', level });
  }

  static database(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'database', level });
  }

  static middleware(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'middleware', level });
  }

  static system(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.log(message, { service: 'system', level });
  }

  // General purpose methods for levels
  static info(message: string, service?: LogOptions['service']): void {
    this.log(message, { service, level: 'info' });
  }

  static warn(message: string, service?: LogOptions['service']): void {
    this.log(message, { service, level: 'warn' });
  }

  static error(message: string, service?: LogOptions['service']): void {
    this.log(message, { service, level: 'error' });
  }
}

// Export default instance for convenience
export const logger = ColorLogger;