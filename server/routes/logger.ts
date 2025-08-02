import { Router } from 'express';
import { WebSocket } from 'ws';

const router = Router();

// Store connected WebSocket clients for broadcasting
const loggerClients = new Set<WebSocket>();

// Logger service for broadcasting logs
export class LoggerService {
  static broadcast(level: 'info' | 'warn' | 'error', message: string) {
    const logData = {
      type: 'log',
      level,
      message,
      timestamp: new Date().toISOString()
    };

    loggerClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(logData));
      }
    });
  }

  static addClient(ws: WebSocket) {
    loggerClients.add(ws);
    console.log('Logger client connected');
  }

  static removeClient(ws: WebSocket) {
    loggerClients.delete(ws);
    console.log('Logger client disconnected');
  }
}

// Command execution endpoint
router.post('/execute-command', async (req, res) => {
  const { command, shell = 'powershell' } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  try {
    // Log the command execution
    LoggerService.broadcast('info', `Executing command: ${command}`);
    
    // Here you would implement actual command execution
    // For now, we'll simulate it
    const result = await simulateCommand(command, shell);
    
    LoggerService.broadcast('info', `Command completed: ${command}`);
    res.json({ output: result, success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    LoggerService.broadcast('error', `Command failed: ${command} - ${errorMessage}`);
    res.status(500).json({ error: errorMessage });
  }
});

async function simulateCommand(command: string, shell: string): Promise<string> {
  // Simulate command execution delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const cmd = command.toLowerCase().trim();
  
  switch (cmd) {
    case 'ls':
    case 'dir':
      return `Directory listing:\nclient/\nserver/\npackage.json\nREADME.md`;
    
    case 'pwd':
      return shell === 'powershell' ? 'Path: C:\\workspace' : '/workspace';
    
    case 'npm run dev':
      return `Starting development server...\n> vite\nLocal: http://localhost:5000\nNetwork: use --host to expose`;
    
    case 'npm install':
      return `Installing dependencies...\nAdded 247 packages in 15s`;
    
    case 'git status':
      return `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  modified: client/src/pages/dashboard.tsx`;
    
    case 'node --version':
      return 'v18.17.0';
    
    case 'npm --version':
      return '9.6.7';
    
    default:
      if (cmd.startsWith('echo ')) {
        return cmd.substring(5);
      }
      return `'${command}' is not recognized as an internal or external command.`;
  }
}

export default router;